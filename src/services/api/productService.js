import mockData from "../mockData/products.json";
import activityLogService from "./activityLogService";

class ProductService {
  constructor() {
    this.products = [...mockData];
  }

  async getAll() {
    await this.delay();
    return [...this.products];
  }

  async getById(id) {
    await this.delay();
    const product = this.products.find(p => p.Id === parseInt(id));
    if (!product) {
      throw new Error("Product not found");
    }
    return { ...product };
  }

  async create(productData) {
    await this.delay();
    const newProduct = {
      Id: this.getNextId(),
      ...productData,
      createdAt: new Date().toISOString()
};
    this.products.push(newProduct);
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_001",
      username: "Current User",
      action: "CREATE",
      entityType: "Product",
      entityId: newProduct.Id,
      entityName: newProduct.name,
      description: `Added new product to inventory: ${newProduct.name}`,
      details: {
        sku: newProduct.sku,
        price: newProduct.price,
        stockLevel: newProduct.stockLevel,
        category: newProduct.category
      }
    });
    
    return { ...newProduct };
  }

  async update(id, productData) {
    await this.delay();
    const index = this.products.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Product not found");
    }
const oldProduct = { ...this.products[index] };
    this.products[index] = {
      ...this.products[index],
      ...productData,
      Id: parseInt(id)
    };
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_001",
      username: "Current User",
      action: "UPDATE",
      entityType: "Product",
      entityId: parseInt(id),
      entityName: this.products[index].name,
      description: `Updated product information for ${this.products[index].name}`,
      details: {
        previousPrice: oldProduct.price,
        newPrice: this.products[index].price,
        previousStock: oldProduct.stockLevel,
        newStock: this.products[index].stockLevel
      }
    });
    
    return { ...this.products[index] };
  }

  async delete(id) {
    await this.delay();
const index = this.products.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Product not found");
    }
    
    const deletedProduct = { ...this.products[index] };
    this.products.splice(index, 1);
    
    // Log activity
    activityLogService.logActivity({
      userId: "user_001",
      username: "Current User",
      action: "DELETE",
      entityType: "Product",
      entityId: parseInt(id),
      entityName: deletedProduct.name,
      description: `Removed product from inventory: ${deletedProduct.name}`,
      details: {
        sku: deletedProduct.sku,
        finalStockLevel: deletedProduct.stockLevel,
        deletionReason: "User requested deletion"
      }
    });
    
    return true;
  }

async getLowStockProducts() {
    await this.delay();
    return this.products.filter(p => p.stockLevel <= p.reorderPoint);
  }

  async getByCategory(category) {
    await this.delay();
    return this.products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  async getProfitMargins() {
    await this.delay();
    return this.products.map(product => {
      // Calculate cost (assuming 60% of price is cost for demo purposes)
      const estimatedCost = product.price * 0.6;
      const profit = product.price - estimatedCost;
      const marginPercentage = (profit / product.price) * 100;
      
      return {
        Id: product.Id,
        name: product.name,
        category: product.category,
        price: product.price,
        estimatedCost: estimatedCost,
        profit: profit,
        marginPercentage: marginPercentage,
        stockLevel: product.stockLevel
      };
    }).sort((a, b) => b.marginPercentage - a.marginPercentage);
  }

async updateStock(productId, quantity, operation = 'add') {
    await this.delay();
    const index = this.products.findIndex(p => p.Id === parseInt(productId));
    if (index === -1) {
      throw new Error("Product not found");
    }
    
    const product = this.products[index];
    if (operation === 'add') {
      product.stockLevel += quantity;
    } else if (operation === 'subtract') {
      product.stockLevel = Math.max(0, product.stockLevel - quantity);
    }
    
    product.updatedAt = new Date().toISOString();
    return { ...product };
  }

  getNextId() {
    return Math.max(...this.products.map(p => p.Id), 0) + 1;
  }

  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ProductService();