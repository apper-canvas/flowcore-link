import mockData from "../mockData/purchaseOrders.json";
import activityLogService from "./activityLogService";
import productService from "./productService";

class PurchaseOrderService {
  constructor() {
    this.purchaseOrders = [...mockData];
  }

  async getAll() {
    await this.delay();
    return [...this.purchaseOrders];
  }

  async getById(id) {
    await this.delay();
    const po = this.purchaseOrders.find(p => p.Id === parseInt(id));
    if (!po) {
      throw new Error("Purchase order not found");
    }
    return { ...po };
  }

  async create(poData) {
    await this.delay();
    const newPO = {
      Id: this.getNextId(),
      poNumber: this.generatePONumber(),
      ...poData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.purchaseOrders.push(newPO);
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "CREATE",
      entityType: "PurchaseOrder",
      entityId: newPO.Id,
      entityName: newPO.poNumber,
      description: `Created new purchase order ${newPO.poNumber}`,
      details: {
        supplierId: newPO.supplierId,
        status: newPO.status,
        total: newPO.total,
        itemCount: newPO.items?.length || 0
      }
    });
    
    return { ...newPO };
  }

  async update(id, poData) {
    await this.delay();
    const index = this.purchaseOrders.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Purchase order not found");
    }
    
    const oldPO = { ...this.purchaseOrders[index] };
    this.purchaseOrders[index] = {
      ...this.purchaseOrders[index],
      ...poData,
      Id: parseInt(id),
      updatedAt: new Date().toISOString()
    };
    
    // If status changed to received, update inventory
    if (oldPO.status !== "received" && poData.status === "received") {
      this.purchaseOrders[index].receivedDate = new Date().toISOString();
      await this.updateInventoryFromPO(this.purchaseOrders[index]);
    }
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "UPDATE",
      entityType: "PurchaseOrder",
      entityId: parseInt(id),
      entityName: this.purchaseOrders[index].poNumber,
      description: `Updated purchase order ${this.purchaseOrders[index].poNumber}`,
      details: {
        previousStatus: oldPO.status,
        newStatus: this.purchaseOrders[index].status,
        previousTotal: oldPO.total,
        newTotal: this.purchaseOrders[index].total
      }
    });
    
    return { ...this.purchaseOrders[index] };
  }

  async delete(id) {
    await this.delay();
    const index = this.purchaseOrders.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Purchase order not found");
    }
    
    const deletedPO = { ...this.purchaseOrders[index] };
    this.purchaseOrders.splice(index, 1);
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "DELETE",
      entityType: "PurchaseOrder",
      entityId: parseInt(id),
      entityName: deletedPO.poNumber,
      description: `Deleted purchase order ${deletedPO.poNumber}`,
      details: {
        supplierId: deletedPO.supplierId,
        total: deletedPO.total,
        deletionReason: "User requested deletion"
      }
    });
    
    return true;
  }

  async updateInventoryFromPO(purchaseOrder) {
    try {
      for (const item of purchaseOrder.items) {
        await productService.updateStock(item.productId, item.quantity, 'add');
      }
      
      // Log inventory update activity
      activityLogService.logActivity({
        userId: "user_002",
        username: "Current User",
        action: "UPDATE",
        entityType: "Inventory",
        entityId: purchaseOrder.Id,
        entityName: `PO ${purchaseOrder.poNumber} Received`,
        description: `Updated inventory from received purchase order ${purchaseOrder.poNumber}`,
        details: {
          itemsReceived: purchaseOrder.items.length,
          totalQuantity: purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      console.error("Error updating inventory:", error);
      throw error;
    }
  }

  async getByStatus(status) {
    await this.delay();
    return this.purchaseOrders.filter(p => p.status.toLowerCase() === status.toLowerCase());
  }

  async getBySupplierId(supplierId) {
    await this.delay();
    return this.purchaseOrders.filter(p => p.supplierId === parseInt(supplierId));
  }

  async getRecentOrders(limit = 10) {
    await this.delay();
    return this.purchaseOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  getNextId() {
    return Math.max(...this.purchaseOrders.map(p => p.Id), 0) + 1;
  }

  generatePONumber() {
    const timestamp = Date.now().toString().slice(-6);
    return `PO-${timestamp}`;
  }

  delay(ms = 350) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new PurchaseOrderService();