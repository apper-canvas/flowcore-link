import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import orderService from "@/services/api/orderService";
import customerService from "@/services/api/customerService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import InvoicePDFModal from "@/components/organisms/InvoicePDFModal";
import OrderModal from "@/components/organisms/OrderModal";
import DataTable from "@/components/organisms/DataTable";
import SearchBar from "@/components/molecules/SearchBar";
import StatusBadge from "@/components/molecules/StatusBadge";

const Orders = () => {
const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [salesOrders, searchQuery, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const [ordersData, customersData] = await Promise.all([
        orderService.getSalesOrders(),
        customerService.getAll()
      ]);
      setSalesOrders(ordersData);
      setCustomers(customersData);
    } catch (err) {
      setError("Failed to load sales orders");
      console.error("Sales Orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...salesOrders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order => {
        const customer = customers.find(c => c.Id === order.customer_id);
        return (
          order.sales_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleSaveOrder = async (orderData) => {
    try {
      if (selectedOrder) {
        await orderService.updateSalesOrder(selectedOrder.sales_order_id, orderData);
        const updatedOrders = salesOrders.map(o =>
          o.sales_order_id === selectedOrder.sales_order_id ? { ...o, ...orderData } : o
        );
        setSalesOrders(updatedOrders);
      } else {
        const newOrder = await orderService.createSalesOrder(orderData);
        setSalesOrders([...salesOrders, newOrder]);
      }
      setIsModalOpen(false);
      setSelectedOrder(null);
      toast.success(selectedOrder ? "Sales order updated successfully" : "Sales order created successfully");
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteOrder = async (order) => {
    if (window.confirm(`Are you sure you want to delete sales order ${order.sales_order_number}?`)) {
      try {
        await orderService.deleteSalesOrder(order.sales_order_id);
        setSalesOrders(salesOrders.filter(o => o.sales_order_id !== order.sales_order_id));
        toast.success("Sales order deleted successfully");
      } catch (error) {
        toast.error("Failed to delete sales order");
      }
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleAddOrder = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleGenerateInvoice = async (order) => {
    try {
      const invoice = await orderService.createInvoiceFromOrder(order.sales_order_id);
      toast.success(`Invoice ${invoice.invoice_number} created successfully`);
      
      // Update order status to invoiced
      await handleStatusChange(order, 'invoiced');
      
      setSelectedOrderForInvoice(order);
      setIsInvoiceModalOpen(true);
    } catch (error) {
      toast.error("Failed to create invoice");
    }
  };

  const handleCreateDeliveryNote = async (order) => {
    try {
      const deliveryNote = await orderService.createDeliveryNote(order.sales_order_id, {
        warehouse_id: 1, // Default warehouse
        delivery_date: new Date().toISOString()
      });
      toast.success(`Delivery note created successfully`);
      
      // Update order status to delivered
      await handleStatusChange(order, 'delivered');
    } catch (error) {
      toast.error("Failed to create delivery note");
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      const updatedOrder = await orderService.updateSalesOrder(order.sales_order_id, { status: newStatus });
      const updatedOrders = salesOrders.map(o =>
        o.sales_order_id === order.sales_order_id ? updatedOrder : o
      );
      setSalesOrders(updatedOrders);
      toast.success(`Sales order status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update sales order status");
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.Id === customerId);
    return customer ? customer.name : "Unknown Customer";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'invoiced': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { key: "sales_order_number", label: "Sales Order #", sortable: true },
    { 
      key: "customer_id", 
      label: "Customer", 
      sortable: true,
      render: (value) => getCustomerName(value)
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    { 
      key: "total_amount", 
      label: "Total Amount", 
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    { 
      key: "order_date", 
      label: "Order Date", 
      sortable: true,
      render: (value) => format(new Date(value), "MMM dd, yyyy")
    },
    { 
      key: "delivery_date", 
      label: "Delivery Date", 
      sortable: true,
      render: (value) => value ? format(new Date(value), "MMM dd, yyyy") : "-"
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, order) => (
        <div className="flex items-center gap-2">
          <Select
            value={order.status}
            onChange={(e) => handleStatusChange(order, e.target.value)}
            className="w-32 text-xs"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          {(order.status === 'processing') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateDeliveryNote(order)}
              title="Create Delivery Note"
            >
              <ApperIcon name="Truck" className="w-4 h-4" />
            </Button>
          )}
          {(order.status === 'delivered') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleGenerateInvoice(order)}
              title="Generate Invoice"
            >
              <ApperIcon name="FileText" className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditOrder(order)}
          >
            <ApperIcon name="Edit2" className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteOrder(order)}
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
          <h1 className="text-3xl font-bold text-gray-900">Sales Order Management</h1>
          <p className="mt-2 text-gray-600">Complete order-to-cash workflow management</p>
        </div>
        <Button onClick={handleAddOrder} className="mt-4 sm:mt-0">
          <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
          Create Sales Order
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by order number or customer..."
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="card">
        {filteredOrders.length === 0 ? (
          <Empty 
            title="No Sales Orders Found"
            description="Get started by creating your first sales order."
          />
        ) : (
          <DataTable
            data={filteredOrders}
            columns={columns}
            loading={loading}
            searchable={false}
          />
        )}
      </div>

      {/* Sales Order Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSave={handleSaveOrder}
        isSalesOrder={true}
      />

      {/* Invoice PDF Modal */}
      <InvoicePDFModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedOrderForInvoice(null);
        }}
        order={selectedOrderForInvoice}
      />
    </div>
  );
};

export default Orders;