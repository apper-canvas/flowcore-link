import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import DataTable from "@/components/organisms/DataTable";
import PurchaseOrderModal from "@/components/organisms/PurchaseOrderModal";
import SupplierModal from "@/components/organisms/SupplierModal";
import SearchBar from "@/components/molecules/SearchBar";
import StatusBadge from "@/components/molecules/StatusBadge";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import purchaseOrderService from "@/services/api/purchaseOrderService";
import supplierService from "@/services/api/supplierService";
import { format } from "date-fns";

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredPOs, setFilteredPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPurchaseOrders();
  }, [purchaseOrders, searchQuery, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const [posData, suppliersData] = await Promise.all([
        purchaseOrderService.getAll(),
        supplierService.getAll()
      ]);
      setPurchaseOrders(posData);
      setSuppliers(suppliersData);
    } catch (err) {
      setError("Failed to load purchase orders");
      console.error("Purchase orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterPurchaseOrders = () => {
    let filtered = [...purchaseOrders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(po => {
        const supplier = suppliers.find(s => s.Id === po.supplierId);
        return (
          po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(po => po.status === statusFilter);
    }

    setFilteredPOs(filtered);
  };

  const handleSavePurchaseOrder = async (poData) => {
    try {
      if (selectedPO) {
        await purchaseOrderService.update(selectedPO.Id, poData);
        const updatedPOs = purchaseOrders.map(po =>
          po.Id === selectedPO.Id ? { ...po, ...poData } : po
        );
        setPurchaseOrders(updatedPOs);
      } else {
        const newPO = await purchaseOrderService.create(poData);
        setPurchaseOrders([...purchaseOrders, newPO]);
      }
      setIsPOModalOpen(false);
      setSelectedPO(null);
    } catch (error) {
      throw error;
    }
  };

  const handleSaveSupplier = async (supplierData) => {
    try {
      if (selectedSupplier) {
        await supplierService.update(selectedSupplier.Id, supplierData);
        const updatedSuppliers = suppliers.map(s =>
          s.Id === selectedSupplier.Id ? { ...s, ...supplierData } : s
        );
        setSuppliers(updatedSuppliers);
      } else {
        const newSupplier = await supplierService.create(supplierData);
        setSuppliers([...suppliers, newSupplier]);
      }
      setIsSupplierModalOpen(false);
      setSelectedSupplier(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDeletePurchaseOrder = async (po) => {
    if (window.confirm(`Are you sure you want to delete purchase order ${po.poNumber}?`)) {
      try {
        await purchaseOrderService.delete(po.Id);
        setPurchaseOrders(purchaseOrders.filter(p => p.Id !== po.Id));
        toast.success("Purchase order deleted successfully");
      } catch (error) {
        toast.error("Failed to delete purchase order");
      }
    }
  };

  const handleEditPurchaseOrder = (po) => {
    setSelectedPO(po);
    setIsPOModalOpen(true);
  };

  const handleAddPurchaseOrder = () => {
    setSelectedPO(null);
    setIsPOModalOpen(true);
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsSupplierModalOpen(true);
  };

  const handleStatusChange = async (po, newStatus) => {
    try {
      const updatedPO = await purchaseOrderService.update(po.Id, { status: newStatus });
      const updatedPOs = purchaseOrders.map(p =>
        p.Id === po.Id ? updatedPO : p
      );
      setPurchaseOrders(updatedPOs);
      toast.success(`Purchase order status updated to ${newStatus}`);
      
      if (newStatus === 'received') {
        toast.success("Inventory has been updated with received items");
      }
    } catch (error) {
      toast.error("Failed to update purchase order status");
    }
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.Id === supplierId);
    return supplier ? supplier.name : "Unknown Supplier";
  };

  const columns = [
    { key: "poNumber", label: "PO Number", sortable: true },
    { 
      key: "supplierId", 
      label: "Supplier", 
      sortable: true,
      render: (value) => getSupplierName(value)
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} type="purchase-order" />
    },
    { 
      key: "total", 
      label: "Total", 
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    { 
      key: "orderDate", 
      label: "Order Date", 
      sortable: true,
      render: (value) => value ? format(new Date(value), "MMM dd, yyyy") : "-"
    },
    { 
      key: "expectedDate", 
      label: "Expected Date", 
      sortable: true,
      render: (value) => value ? format(new Date(value), "MMM dd, yyyy") : "-"
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, po) => (
        <div className="flex items-center gap-2">
          <Select
            value={po.status}
            onChange={(e) => handleStatusChange(po, e.target.value)}
            className="w-32 text-xs"
          >
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditPurchaseOrder(po)}
          >
            <ApperIcon name="Edit2" className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePurchaseOrder(po)}
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
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-2 text-gray-600">Manage supplier orders and inventory replenishment</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button 
            variant="secondary" 
            onClick={handleAddSupplier}
          >
            <ApperIcon name="Building2" className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
          <Button onClick={handleAddPurchaseOrder}>
            <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Purchase Order Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {["draft", "ordered", "received", "cancelled"].map(status => {
          const count = purchaseOrders.filter(po => po.status === status).length;
          return (
            <div key={status} className="card p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{status}</div>
            </div>
          );
        })}
      </div>

      {/* Supplier Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{suppliers.length}</div>
              <div className="text-sm text-gray-600">Total Suppliers</div>
            </div>
            <ApperIcon name="Building2" className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {suppliers.filter(s => s.status === "active").length}
              </div>
              <div className="text-sm text-gray-600">Active Suppliers</div>
            </div>
            <ApperIcon name="CheckCircle" className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${purchaseOrders
                  .filter(po => po.status === 'received')
                  .reduce((sum, po) => sum + po.total, 0)
                  .toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Total Received Value</div>
            </div>
            <ApperIcon name="DollarSign" className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search purchase orders by PO number or supplier name..."
            />
          </div>
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      {filteredPOs.length === 0 && !loading ? (
        <Empty
          title="No purchase orders found"
          description={searchQuery || statusFilter 
            ? "Try adjusting your filters to see more purchase orders"
            : "Get started by creating your first purchase order"
          }
          actionLabel="Create Purchase Order"
          onAction={handleAddPurchaseOrder}
          icon="Truck"
        />
      ) : (
        <DataTable
          data={filteredPOs}
          columns={columns}
          loading={loading}
          onRowClick={handleEditPurchaseOrder}
        />
      )}

      {/* Purchase Order Modal */}
      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => {
          setIsPOModalOpen(false);
          setSelectedPO(null);
        }}
        purchaseOrder={selectedPO}
        onSave={handleSavePurchaseOrder}
      />

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        onSave={handleSaveSupplier}
      />
    </div>
  );
};

export default PurchaseOrders;