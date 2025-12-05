import mockData from "../mockData/orders.json";
import activityLogService from "./activityLogService";
class OrderService {
  constructor() {
    this.orders = [...mockData];
    this.salesOrders = this.transformToSalesOrders(mockData);
    this.salesOrderLines = [];
    this.deliveryNotes = [];
    this.salesInvoices = [];
    this.initializeSampleData();
  }

  transformToSalesOrders(orders) {
    return orders.map(order => ({
      sales_order_id: order.Id,
      sales_order_number: order.orderNumber,
      customer_id: order.customerId,
      order_date: order.createdAt,
      delivery_date: order.updatedAt,
      status: this.mapStatus(order.status),
      total_amount: order.total
    }));
  }

  mapStatus(oldStatus) {
    switch (oldStatus) {
      case 'completed': return 'delivered';
      case 'processing': return 'processing';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }

  initializeSampleData() {
    // Initialize sales order lines
    this.orders.forEach(order => {
      if (order.items) {
        order.items.forEach((item, index) => {
          this.salesOrderLines.push({
            sales_order_lines_id: this.getNextLineId(),
            sales_order_id: order.Id,
            item_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            tax_code_id: 1, // Default tax code
            line_total: item.total
          });
        });
      }
    });

    // Initialize sample delivery notes
    this.deliveryNotes.push(
      {
        delivery_notes_id: 1,
        sales_order_id: 1,
        warehouse_id: 1,
        delivery_date: "2024-01-22T14:15:00.000Z"
      },
      {
        delivery_notes_id: 2,
        sales_order_id: 4,
        warehouse_id: 1,
        delivery_date: "2024-01-19T10:20:00.000Z"
      }
    );

    // Initialize sample sales invoices
    this.salesInvoices.push(
      {
        ar_invoice_id: 1,
        customer_id: 1,
        invoice_number: "INV-001234",
        invoice_date: "2024-01-22T14:15:00.000Z",
        total_amount: 196.53,
        status: "paid",
        sales_order_id: 1
      },
      {
        ar_invoice_id: 2,
        customer_id: 4,
        invoice_number: "INV-001235",
        invoice_date: "2024-01-19T10:20:00.000Z",
        total_amount: 37.79,
        status: "paid",
        sales_order_id: 4
      }
    );
  }

  getNextLineId() {
    return Math.max(...this.salesOrderLines.map(l => l.sales_order_lines_id), 0) + 1;
  }

  getNextDeliveryId() {
    return Math.max(...this.deliveryNotes.map(d => d.delivery_notes_id), 0) + 1;
  }

  getNextInvoiceId() {
    return Math.max(...this.salesInvoices.map(i => i.ar_invoice_id), 0) + 1;
  }

// Legacy order methods (maintained for compatibility)
  async getAll() {
    await this.delay();
    return [...this.orders];
  }

  async getById(id) {
    await this.delay();
    const order = this.orders.find(o => o.Id === parseInt(id));
    if (!order) {
      throw new Error("Order not found");
    }
    return { ...order };
  }

  async create(orderData) {
    await this.delay();
    const newOrder = {
      Id: this.getNextId(),
      orderNumber: this.generateOrderNumber(),
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.orders.push(newOrder);
    
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "CREATE",
      entityType: "Order",
      entityId: newOrder.Id,
      entityName: newOrder.orderNumber,
      description: `Created new order ${newOrder.orderNumber}`,
      details: {
        customerId: newOrder.customerId,
        orderTotal: newOrder.total,
        itemCount: newOrder.items?.length || 0
      }
    });
    
    return { ...newOrder };
  }

  async update(id, orderData) {
    await this.delay();
    const index = this.orders.findIndex(o => o.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Order not found");
    }
    
    const oldOrder = { ...this.orders[index] };
    this.orders[index] = {
      ...this.orders[index],
      ...orderData,
      Id: parseInt(id),
      updatedAt: new Date().toISOString()
    };
    
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "UPDATE",
      entityType: "Order",
      entityId: parseInt(id),
      entityName: this.orders[index].orderNumber,
      description: `Updated order ${this.orders[index].orderNumber}`,
      details: {
        previousStatus: oldOrder.status,
        newStatus: this.orders[index].status,
        previousTotal: oldOrder.total,
        newTotal: this.orders[index].total
      }
    });
    
    return { ...this.orders[index] };
  }

  async delete(id) {
    await this.delay();
    const index = this.orders.findIndex(o => o.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Order not found");
    }
    
    const deletedOrder = { ...this.orders[index] };
    this.orders.splice(index, 1);
    
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "DELETE",
      entityType: "Order",
      entityId: parseInt(id),
      entityName: deletedOrder.orderNumber,
      description: `Deleted order ${deletedOrder.orderNumber}`,
      details: {
        orderTotal: deletedOrder.total,
        deletionReason: "User requested deletion"
      }
    });
  }

  // Sales Orders methods
  async getSalesOrders() {
    await this.delay();
    return [...this.salesOrders];
  }

  async getSalesOrderById(id) {
    await this.delay();
    const order = this.salesOrders.find(o => o.sales_order_id === parseInt(id));
    if (!order) {
      throw new Error("Sales order not found");
    }
    return { ...order };
  }

  async createSalesOrder(orderData) {
    await this.delay();
    const newOrder = {
      sales_order_id: this.getNextId(),
      sales_order_number: this.generateOrderNumber(),
      customer_id: orderData.customer_id,
      order_date: new Date().toISOString(),
      delivery_date: orderData.delivery_date || null,
      status: 'pending',
      total_amount: orderData.total_amount || 0
    };
    
    this.salesOrders.push(newOrder);
    
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User", 
      action: "CREATE",
      entityType: "Sales Order",
      entityId: newOrder.sales_order_id,
      entityName: newOrder.sales_order_number,
      description: `Created new sales order ${newOrder.sales_order_number}`,
      details: {
        customerId: newOrder.customer_id,
        orderTotal: newOrder.total_amount
      }
    });
    
    return { ...newOrder };
  }

  async updateSalesOrder(id, orderData) {
    await this.delay();
    const index = this.salesOrders.findIndex(o => o.sales_order_id === parseInt(id));
    if (index === -1) {
      throw new Error("Sales order not found");
    }
    
    const oldOrder = { ...this.salesOrders[index] };
    this.salesOrders[index] = {
      ...this.salesOrders[index],
      ...orderData,
      sales_order_id: parseInt(id)
    };
    
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "UPDATE", 
      entityType: "Sales Order",
      entityId: parseInt(id),
      entityName: this.salesOrders[index].sales_order_number,
      description: `Updated sales order ${this.salesOrders[index].sales_order_number}`,
      details: {
        previousStatus: oldOrder.status,
        newStatus: this.salesOrders[index].status
      }
    });
    
    return { ...this.salesOrders[index] };
  }

  async deleteSalesOrder(id) {
    await this.delay();
    const index = this.salesOrders.findIndex(o => o.sales_order_id === parseInt(id));
    if (index === -1) {
      throw new Error("Sales order not found");
    }
    
    const deletedOrder = { ...this.salesOrders[index] };
    this.salesOrders.splice(index, 1);
    
    // Remove related order lines
    this.salesOrderLines = this.salesOrderLines.filter(
      line => line.sales_order_id !== parseInt(id)
    );
    
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "DELETE",
      entityType: "Sales Order", 
      entityId: parseInt(id),
      entityName: deletedOrder.sales_order_number,
      description: `Deleted sales order ${deletedOrder.sales_order_number}`,
      details: {
        orderTotal: deletedOrder.total_amount
      }
    });
  }

  // Sales Order Lines methods
  async getSalesOrderLines(salesOrderId) {
    await this.delay();
    return this.salesOrderLines.filter(line => line.sales_order_id === parseInt(salesOrderId));
  }

  async createSalesOrderLine(lineData) {
    await this.delay();
    const newLine = {
      sales_order_lines_id: this.getNextLineId(),
      ...lineData,
      line_total: lineData.quantity * lineData.unit_price
    };
    
    this.salesOrderLines.push(newLine);
    return { ...newLine };
  }

  // Delivery Notes methods
  async createDeliveryNote(salesOrderId, deliveryData) {
    await this.delay();
    const newDeliveryNote = {
      delivery_notes_id: this.getNextDeliveryId(),
      sales_order_id: parseInt(salesOrderId),
      warehouse_id: deliveryData.warehouse_id || 1,
      delivery_date: deliveryData.delivery_date || new Date().toISOString()
    };
    
    this.deliveryNotes.push(newDeliveryNote);
    
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "CREATE",
      entityType: "Delivery Note",
      entityId: newDeliveryNote.delivery_notes_id,
      entityName: `DN-${newDeliveryNote.delivery_notes_id}`,
      description: `Created delivery note for sales order ${salesOrderId}`,
      details: {
        salesOrderId: salesOrderId,
        warehouseId: deliveryData.warehouse_id
      }
    });
    
    return { ...newDeliveryNote };
  }

  // Sales Invoices methods  
  async createInvoiceFromOrder(salesOrderId) {
    await this.delay();
    const salesOrder = await this.getSalesOrderById(salesOrderId);
    
    const newInvoice = {
      ar_invoice_id: this.getNextInvoiceId(),
      customer_id: salesOrder.customer_id,
      invoice_number: this.generateInvoiceNumber(),
      invoice_date: new Date().toISOString(),
      total_amount: salesOrder.total_amount,
      status: 'unpaid',
      sales_order_id: parseInt(salesOrderId)
    };
    
    this.salesInvoices.push(newInvoice);
    
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "CREATE",
      entityType: "Sales Invoice",
      entityId: newInvoice.ar_invoice_id,
      entityName: newInvoice.invoice_number,
      description: `Created invoice ${newInvoice.invoice_number} from sales order ${salesOrder.sales_order_number}`,
      details: {
        salesOrderId: salesOrderId,
        invoiceTotal: newInvoice.total_amount
      }
    });
    
    return { ...newInvoice };
  }

  async getSalesInvoices() {
    await this.delay();
    return [...this.salesInvoices];
  }

  async updateInvoiceStatus(invoiceId, status) {
    await this.delay();
    const index = this.salesInvoices.findIndex(i => i.ar_invoice_id === parseInt(invoiceId));
    if (index === -1) {
      throw new Error("Invoice not found");
    }
    
this.salesInvoices[index].status = status;
    return { ...this.salesInvoices[index] };
  }
// Legacy helper methods
  async getByStatus(status) {
    await this.delay();
    return this.orders.filter(o => o.status.toLowerCase() === status.toLowerCase());
  }

  async getByCustomerId(customerId) {
    await this.delay();
    return this.orders.filter(o => o.customerId === parseInt(customerId));
  }

  async getRecentOrders(limit = 10) {
    await this.delay();
    return this.orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  getNextId() {
    const maxOrderId = Math.max(...this.orders.map(o => o.Id), 0);
    const maxSalesOrderId = Math.max(...this.salesOrders.map(o => o.sales_order_id), 0);
    return Math.max(maxOrderId, maxSalesOrderId) + 1;
  }

  generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    return `SO-${timestamp}`;
  }

  generateInvoiceNumber() {
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${timestamp}`;
  }
delay(ms = 350) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new OrderService();