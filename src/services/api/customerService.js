import mockData from "../mockData/customers.json";
import activityLogService from "./activityLogService";

class CustomerService {
  constructor() {
    this.customers = [...mockData];
  }

  async getAll() {
    await this.delay();
    return [...this.customers];
  }

  async getById(id) {
    await this.delay();
    const customer = this.customers.find(c => c.Id === parseInt(id));
    if (!customer) {
      throw new Error("Customer not found");
    }
    return { ...customer };
  }

  async create(customerData) {
    await this.delay();
    const newCustomer = {
      Id: this.getNextId(),
      ...customerData,
      totalOrders: 0,
      totalSpent: 0,
createdAt: new Date().toISOString()
    };
    this.customers.push(newCustomer);
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_001",
      username: "Current User",
      action: "CREATE",
      entityType: "Customer",
      entityId: newCustomer.Id,
      entityName: newCustomer.name,
      description: `Created new customer record for ${newCustomer.name}`,
      details: {
        email: newCustomer.email,
        phone: newCustomer.phone
      }
    });
    
    return { ...newCustomer };
  }

  async update(id, customerData) {
    await this.delay();
    const index = this.customers.findIndex(c => c.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Customer not found");
}
    
    const oldCustomer = { ...this.customers[index] };
    this.customers[index] = {
      ...this.customers[index],
      ...customerData,
      Id: parseInt(id)
    };
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_001",
      username: "Current User",
      action: "UPDATE",
      entityType: "Customer",
      entityId: parseInt(id),
      entityName: this.customers[index].name,
      description: `Updated customer information for ${this.customers[index].name}`,
      details: {
        previousName: oldCustomer.name,
        newName: this.customers[index].name,
        emailChanged: oldCustomer.email !== this.customers[index].email
      }
    });
    return { ...this.customers[index] };
  }

  async delete(id) {
await this.delay();
    const index = this.customers.findIndex(c => c.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Customer not found");
    }
    
    const deletedCustomer = { ...this.customers[index] };
    this.customers.splice(index, 1);
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_001",
      username: "Current User",
      action: "DELETE",
      entityType: "Customer",
      entityId: parseInt(id),
      entityName: deletedCustomer.name,
      description: `Deleted customer record for ${deletedCustomer.name}`,
      details: {
        lastEmail: deletedCustomer.email,
        deletionReason: "User requested deletion"
      }
    });
    
    return true;
  }

  async updateCustomerStats(customerId, orderTotal) {
    await this.delay();
    const customer = this.customers.find(c => c.Id === parseInt(customerId));
    if (customer) {
      customer.totalOrders += 1;
      customer.totalSpent += orderTotal;
    }
  }

  async getTopCustomers(limit = 5) {
    await this.delay();
    return this.customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  getNextId() {
    return Math.max(...this.customers.map(c => c.Id), 0) + 1;
  }

  delay(ms = 250) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new CustomerService();