import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import DataTable from "@/components/organisms/DataTable";
import MetricCard from "@/components/molecules/MetricCard";
import SearchBar from "@/components/molecules/SearchBar";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Input from "@/components/atoms/Input";
import Label from "@/components/atoms/Label";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import journalEntriesService from "@/services/api/journalEntriesService";
import journalEntryLinesService from "@/services/api/journalEntryLinesService";
import chartOfAccountsService from "@/services/api/chartOfAccountsService";
import { format } from "date-fns";

const JournalEntries = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    je_date: format(new Date(), 'yyyy-MM-dd'),
    description: "",
    lines: [
      { account_id: "", debit: "", credit: "" },
      { account_id: "", debit: "", credit: "" }
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [journalEntries, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const [entriesData, accountsData] = await Promise.all([
        journalEntriesService.getAll(),
        chartOfAccountsService.getAll()
      ]);
      setJournalEntries(entriesData);
      setAccounts(accountsData);
    } catch (err) {
      setError("Failed to load journal entries");
      console.error("Journal entries error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...journalEntries];

    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.je_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  };

  const handleAddEntry = () => {
    setSelectedEntry(null);
    setFormData({
      je_date: format(new Date(), 'yyyy-MM-dd'),
      description: "",
      lines: [
        { account_id: "", debit: "", credit: "" },
        { account_id: "", debit: "", credit: "" }
      ]
    });
    setIsModalOpen(true);
  };

  const handleEditEntry = async (entry) => {
    setModalLoading(true);
    setSelectedEntry(entry);
    setIsModalOpen(true);

    try {
      const entryWithLines = await journalEntriesService.getById(entry.Id);
      setFormData({
        je_date: entryWithLines.je_date,
        description: entryWithLines.description,
        lines: entryWithLines.lines || []
      });
    } catch (error) {
      toast.error("Failed to load journal entry details");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteEntry = async (entry) => {
    if (window.confirm(`Are you sure you want to delete journal entry ${entry.je_number}?`)) {
      try {
        await journalEntriesService.delete(entry.Id);
        setJournalEntries(journalEntries.filter(je => je.Id !== entry.Id));
        toast.success("Journal entry deleted successfully");
      } catch (error) {
        toast.error("Failed to delete journal entry");
      }
    }
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      // Validate form
      if (!formData.description.trim()) {
        throw new Error("Description is required");
      }

      // Filter out empty lines and validate
      const validLines = formData.lines.filter(line => 
        line.account_id && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0)
      );

      if (validLines.length < 2) {
        throw new Error("At least two journal entry lines are required");
      }

      // Validate debits equal credits
      const totalDebits = validLines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
      const totalCredits = validLines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error("Total debits must equal total credits");
      }

      // Validate no line has both debit and credit
      for (const line of validLines) {
        if (parseFloat(line.debit || 0) > 0 && parseFloat(line.credit || 0) > 0) {
          throw new Error("A line cannot have both debit and credit amounts");
        }
      }

      const entryData = {
        ...formData,
        lines: validLines
      };

      if (selectedEntry) {
        await journalEntriesService.update(selectedEntry.Id, entryData);
        const updatedEntries = journalEntries.map(je =>
          je.Id === selectedEntry.Id ? { ...je, ...formData } : je
        );
        setJournalEntries(updatedEntries);
        toast.success("Journal entry updated successfully");
      } else {
        const newEntry = await journalEntriesService.create(entryData);
        setJournalEntries([...journalEntries, newEntry]);
        toast.success("Journal entry created successfully");
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save journal entry");
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { account_id: "", debit: "", credit: "" }]
    });
  };

  const handleRemoveLine = (index) => {
    if (formData.lines.length > 2) {
      setFormData({
        ...formData,
        lines: formData.lines.filter((_, i) => i !== index)
      });
    }
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Clear the opposite field when entering a value
    if (field === "debit" && value) {
      newLines[index].credit = "";
    } else if (field === "credit" && value) {
      newLines[index].debit = "";
    }
    
    setFormData({ ...formData, lines: newLines });
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.Id === parseInt(accountId));
    return account ? `${account.account_code} - ${account.account_name}` : "";
  };

  // Calculate totals for validation display
  const totalDebits = formData.lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
  const totalCredits = formData.lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const columns = [
    { 
      key: "je_number", 
      label: "JE Number", 
      sortable: true 
    },
    { 
      key: "je_date", 
      label: "Date", 
      sortable: true,
      render: (value) => format(new Date(value), "MMM dd, yyyy")
    },
    { 
      key: "description", 
      label: "Description", 
      sortable: true 
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, entry) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditEntry(entry)}
          >
            <ApperIcon name="Edit2" className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteEntry(entry)}
            className="text-error hover:text-error"
          >
            <ApperIcon name="Trash2" className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorView message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="mt-2 text-gray-600">Manage double-entry bookkeeping transactions</p>
        </div>
        <Button onClick={handleAddEntry}>
          <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
          New Journal Entry
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Entries"
          value={journalEntries.length.toString()}
          icon="BookOpen"
        />
        <MetricCard
          title="This Month"
          value={journalEntries.filter(je => 
            new Date(je.je_date).getMonth() === new Date().getMonth()
          ).length.toString()}
          icon="Calendar"
        />
        <MetricCard
          title="Chart of Accounts"
          value={accounts.length.toString()}
          icon="Users"
        />
      </div>

      {/* Search */}
      <div className="card p-6 mb-6">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search journal entries by description or JE number..."
        />
      </div>

      {/* Journal Entries Table */}
      {filteredEntries.length === 0 && !loading ? (
        <Empty
          title="No journal entries found"
          description={searchQuery 
            ? "Try adjusting your search to see more entries"
            : "Get started by creating your first journal entry"
          }
          actionLabel="New Journal Entry"
          onAction={handleAddEntry}
          icon="BookOpen"
        />
      ) : (
        <DataTable
          data={filteredEntries}
          columns={columns}
          loading={loading}
          onRowClick={handleEditEntry}
        />
      )}

      {/* Journal Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
                 onClick={() => setIsModalOpen(false)} />
            
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {modalLoading ? (
                <Loading />
              ) : (
                <form onSubmit={handleSaveEntry}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <ApperIcon name="X" className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.je_date}
                        onChange={(e) => setFormData({ ...formData, je_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter journal entry description"
                        required
                      />
                    </div>
                  </div>

                  {/* Journal Entry Lines */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Journal Entry Lines</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddLine}
                      >
                        <ApperIcon name="Plus" className="w-4 h-4 mr-1" />
                        Add Line
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {formData.lines.map((line, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                          <div className="col-span-5">
                            <Select
                              value={line.account_id}
                              onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                              required
                            >
                              <option value="">Select Account</option>
                              {accounts.map(account => (
                                <option key={account.Id} value={account.Id}>
                                  {account.account_code} - {account.account_name}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Debit"
                              value={line.debit}
                              onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Credit"
                              value={line.credit}
                              onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                            />
                          </div>
                          <div className="col-span-1">
                            {formData.lines.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveLine(index)}
                                className="text-error"
                              >
                                <ApperIcon name="X" className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Debits: </span>
                          <span className="text-blue-600">${totalDebits.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Total Credits: </span>
                          <span className="text-blue-600">${totalCredits.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Status: </span>
                          <span className={isBalanced ? "text-green-600" : "text-red-600"}>
                            {isBalanced ? "Balanced" : "Out of Balance"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isBalanced || modalLoading}
                    >
                      {modalLoading && <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                      {selectedEntry ? 'Update Entry' : 'Create Entry'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;