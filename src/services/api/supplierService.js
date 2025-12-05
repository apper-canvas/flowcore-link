import mockData from "../mockData/suppliers.json";
import activityLogService from "./activityLogService";

class SupplierService {
  constructor() {
    this.suppliers = [...mockData];
  }

  async getAll() {
    await this.delay();
    return [...this.suppliers];
  }

  async getById(id) {
    await this.delay();
    const supplier = this.suppliers.find(s => s.Id === parseInt(id));
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    return { ...supplier };
  }

  async create(supplierData) {
    await this.delay();
    const newSupplier = {
      Id: this.getNextId(),
      ...supplierData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.suppliers.push(newSupplier);
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "CREATE",
      entityType: "Supplier",
      entityId: newSupplier.Id,
      entityName: newSupplier.name,
      description: `Created new supplier ${newSupplier.name}`,
      details: {
        contactName: newSupplier.contactName,
        email: newSupplier.email,
        status: newSupplier.status
      }
    });
    
    return { ...newSupplier };
  }

  async update(id, supplierData) {
    await this.delay();
    const index = this.suppliers.findIndex(s => s.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Supplier not found");
    }
    
    const oldSupplier = { ...this.suppliers[index] };
    this.suppliers[index] = {
      ...this.suppliers[index],
      ...supplierData,
      Id: parseInt(id),
      updatedAt: new Date().toISOString()
    };
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "UPDATE",
      entityType: "Supplier",
      entityId: parseInt(id),
      entityName: this.suppliers[index].name,
      description: `Updated supplier ${this.suppliers[index].name}`,
      details: {
        previousStatus: oldSupplier.status,
        newStatus: this.suppliers[index].status,
        previousEmail: oldSupplier.email,
        newEmail: this.suppliers[index].email
      }
    });
    
    return { ...this.suppliers[index] };
  }

  async delete(id) {
    await this.delay();
    const index = this.suppliers.findIndex(s => s.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Supplier not found");
    }
    
    const deletedSupplier = { ...this.suppliers[index] };
    this.suppliers.splice(index, 1);
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_002",
      username: "Current User",
      action: "DELETE",
      entityType: "Supplier",
      entityId: parseInt(id),
      entityName: deletedSupplier.name,
      description: `Deleted supplier ${deletedSupplier.name}`,
      details: {
        contactName: deletedSupplier.contactName,
        deletionReason: "User requested deletion"
      }
    });
    
    return true;
  }

  async getActiveSuppliers() {
    await this.delay();
    return this.suppliers.filter(s => s.status === "active");
  }

  async getByStatus(status) {
    await this.delay();
    return this.suppliers.filter(s => s.status.toLowerCase() === status.toLowerCase());
  }

  getNextId() {
    return Math.max(...this.suppliers.map(s => s.Id), 0) + 1;
  }

  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new SupplierService();