import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import DataTable from "@/components/organisms/DataTable";
import TransactionModal from "@/components/organisms/TransactionModal";
import MetricCard from "@/components/molecules/MetricCard";
import SearchBar from "@/components/molecules/SearchBar";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import transactionService from "@/services/api/transactionService";
import chartOfAccountsService from "@/services/api/chartOfAccountsService";
import { format } from "date-fns";

const Financials = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [trialBalance, setTrialBalance] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, netIncome: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");

  useEffect(() => {
    loadFinancialData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, typeFilter, categoryFilter]);

  const loadFinancialData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const [transactionsData, summaryData, accountsData, trialBalanceData] = await Promise.all([
        transactionService.getAll(),
        transactionService.getSummary(),
        chartOfAccountsService.getAll(),
        chartOfAccountsService.getTrialBalance()
      ]);
      
      setTransactions(transactionsData);
      setSummary(summaryData);
      setAccounts(accountsData);
      setTrialBalance(trialBalanceData);
    } catch (err) {
      setError("Failed to load financial data");
      console.error("Financials error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(transaction => transaction.category === categoryFilter);
    }

    setFilteredTransactions(filtered);
  };

  const handleSaveTransaction = async (transactionData) => {
    try {
      if (selectedTransaction) {
        await transactionService.update(selectedTransaction.Id, transactionData);
        const updatedTransactions = transactions.map(t =>
          t.Id === selectedTransaction.Id ? { ...t, ...transactionData } : t
        );
        setTransactions(updatedTransactions);
      } else {
        const newTransaction = await transactionService.create(transactionData);
        setTransactions([...transactions, newTransaction]);
      }
      
      const newSummary = await transactionService.getSummary();
      setSummary(newSummary);
      
      setIsModalOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (window.confirm(`Are you sure you want to delete this transaction?`)) {
      try {
        await transactionService.delete(transaction.Id);
        setTransactions(transactions.filter(t => t.Id !== transaction.Id));
        
        const newSummary = await transactionService.getSummary();
        setSummary(newSummary);
        
        toast.success("Transaction deleted successfully");
      } catch (error) {
        toast.error("Failed to delete transaction");
      }
    }
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  // Calculate chart of accounts summary
  const assetAccounts = accounts.filter(acc => acc.account_type === "Asset");
  const liabilityAccounts = accounts.filter(acc => acc.account_type === "Liability");
  const equityAccounts = accounts.filter(acc => acc.account_type === "Equity");
  const revenueAccounts = accounts.filter(acc => acc.account_type === "Revenue");
  const expenseAccounts = accounts.filter(acc => acc.account_type === "Expense");

  const transactionColumns = [
    { 
      key: "date", 
      label: "Date", 
      sortable: true,
      render: (value) => format(new Date(value), "MMM dd, yyyy")
    },
    {
      key: "type",
      label: "Type",
      render: (value) => (
        <span className={`status-badge ${
          value === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {value === "income" ? "Income" : "Expense"}
        </span>
      )
    },
    { key: "category", label: "Category", sortable: true },
    { key: "description", label: "Description", sortable: true },
    { 
      key: "amount", 
      label: "Amount", 
      sortable: true,
      render: (value, transaction) => (
        <span className={transaction.type === "income" ? "text-success font-semibold" : "text-error font-semibold"}>
          {transaction.type === "income" ? "+" : "-"}${value.toFixed(2)}
        </span>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, transaction) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditTransaction(transaction)}
          >
            <ApperIcon name="Edit2" className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTransaction(transaction)}
            className="text-error hover:text-error"
          >
            <ApperIcon name="Trash2" className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const trialBalanceColumns = [
    { key: "account_code", label: "Account Code", sortable: true },
    { key: "account_name", label: "Account Name", sortable: true },
    { key: "account_type", label: "Type", sortable: true },
    { 
      key: "debit_balance", 
      label: "Debit Balance", 
      render: (value) => value > 0 ? `$${value.toFixed(2)}` : "-"
    },
    { 
      key: "credit_balance", 
      label: "Credit Balance", 
      render: (value) => value > 0 ? `$${value.toFixed(2)}` : "-"
    }
  ];

  const categories = [...new Set(transactions.map(t => t.category))];

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
        <ErrorView message={error} onRetry={loadFinancialData} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="mt-2 text-gray-600">Track transactions, accounts, and financial performance</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button 
            variant="outline" 
            onClick={() => window.open('/financials/reports', '_blank')}
            className="hidden sm:flex"
          >
            <ApperIcon name="BarChart3" className="w-4 h-4 mr-2" />
            Advanced Reports
          </Button>
          <Button onClick={handleAddTransaction}>
            <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
            Record Transaction
          </Button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Assets"
          value={assetAccounts.length.toString()}
          icon="TrendingUp"
          trend="Accounts"
          trendDirection="up"
        />
        <MetricCard
          title="Total Liabilities"
          value={liabilityAccounts.length.toString()}
          icon="TrendingDown"
          trend="Accounts"
          trendDirection="down"
        />
        <MetricCard
          title="Revenue Accounts"
          value={revenueAccounts.length.toString()}
          icon="DollarSign"
          trend="Active"
          trendDirection="up"
        />
        <MetricCard
          title="Expense Accounts"
          value={expenseAccounts.length.toString()}
          icon="Calculator"
          trend="Active"
          trendDirection="neutral"
        />
      </div>

      {/* Chart of Accounts Overview */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart of Accounts Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Assets</div>
            <div className="text-2xl font-bold text-blue-600">{assetAccounts.length}</div>
            <div className="text-xs text-gray-600">Accounts</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Liabilities</div>
            <div className="text-2xl font-bold text-red-600">{liabilityAccounts.length}</div>
            <div className="text-xs text-gray-600">Accounts</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Equity</div>
            <div className="text-2xl font-bold text-purple-600">{equityAccounts.length}</div>
            <div className="text-xs text-gray-600">Accounts</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Revenue</div>
            <div className="text-2xl font-bold text-green-600">{revenueAccounts.length}</div>
            <div className="text-xs text-gray-600">Accounts</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Expenses</div>
            <div className="text-2xl font-bold text-orange-600">{expenseAccounts.length}</div>
            <div className="text-xs text-gray-600">Accounts</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("trial-balance")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "trial-balance"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Trial Balance
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "transactions" && (
            <>
              {/* Transaction Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2">
                  <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transactions by description or category..."
                  />
                </div>
                
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </Select>
                
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </div>

              {/* Transactions Table */}
              {filteredTransactions.length === 0 && !loading ? (
                <Empty
                  title="No transactions found"
                  description={searchQuery || typeFilter || categoryFilter 
                    ? "Try adjusting your filters to see more transactions"
                    : "Get started by recording your first transaction"
                  }
                  actionLabel="Record Transaction"
                  onAction={handleAddTransaction}
                  icon="FileText"
                />
              ) : (
                <DataTable
                  data={filteredTransactions}
                  columns={transactionColumns}
                  loading={loading}
                  onRowClick={handleEditTransaction}
                />
              )}
            </>
          )}

          {activeTab === "trial-balance" && (
            <>
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900">Trial Balance</h4>
                <p className="text-gray-600">Current balances for all accounts</p>
              </div>
              
              <DataTable
                data={trialBalance}
                columns={trialBalanceColumns}
                loading={loading}
              />
              
              {/* Trial Balance Totals */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Debits: </span>
                    <span className="text-blue-600">
                      ${trialBalance.reduce((sum, acc) => sum + (acc.debit_balance || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Total Credits: </span>
                    <span className="text-blue-600">
                      ${trialBalance.reduce((sum, acc) => sum + (acc.credit_balance || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};

export default Financials;