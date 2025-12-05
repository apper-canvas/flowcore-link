import mockData from "../mockData/transactions.json";
class TransactionService {
  constructor() {
    this.transactions = [...mockData];
  }

  async getAll() {
    await this.delay();
    return [...this.transactions];
  }

  async getById(id) {
    await this.delay();
    const transaction = this.transactions.find(t => t.Id === parseInt(id));
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    return { ...transaction };
  }

  async create(transactionData) {
    await this.delay();
    const newTransaction = {
      Id: this.getNextId(),
      ...transactionData,
date: new Date().toISOString(),
      relatedOrderId: transactionData.relatedOrderId || null
    };
    this.transactions.push(newTransaction);
    
    // Log activity
    await this.logTransactionActivity("CREATE", newTransaction, "Created new transaction");
    
    return { ...newTransaction };
  }

  async update(id, transactionData) {
    await this.delay();
    const index = this.transactions.findIndex(t => t.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Transaction not found");
    }
    
    this.transactions[index] = {
      ...this.transactions[index],
      ...transactionData,
      Id: parseInt(id)
};
    
    // Log activity
    await this.logTransactionActivity("UPDATE", this.transactions[index], "Updated transaction information");
    return { ...this.transactions[index] };
  }

async delete(id) {
    await this.delay();
    const index = this.transactions.findIndex(t => t.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Transaction not found");
    }
    
    const deletedTransaction = { ...this.transactions[index] };
    this.transactions.splice(index, 1);
    
    // Log activity
    await this.logTransactionActivity("DELETE", deletedTransaction, "Deleted transaction record");
    
    return true;
  }

  async getByType(type) {
    await this.delay();
    return this.transactions.filter(t => t.type.toLowerCase() === type.toLowerCase());
  }

  async getByDateRange(startDate, endDate) {
    await this.delay();
    return this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
});
  }

  async getSummary() {
    await this.delay();
    const income = this.transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = this.transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses
    };
  }

  async getRecentTransactions(limit = 10) {
    await this.delay();
    return this.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  async getCashFlowAnalysis(startDate, endDate) {
    await this.delay();
    const filtered = this.transactions.filter(t => {
      const date = new Date(t.date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });

    const monthlyData = {};
    filtered.forEach(t => {
      const month = new Date(t.date).toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, net: 0 };
      }
      
      if (t.type === "income") {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += t.amount;
      }
      monthlyData[month].net = monthlyData[month].income - monthlyData[month].expenses;
    });

    return Object.keys(monthlyData)
      .sort()
      .map(month => ({
        month,
        ...monthlyData[month]
      }));
  }

  async getExpenseCategorization(startDate, endDate) {
    await this.delay();
    const expenses = this.transactions.filter(t => {
      const date = new Date(t.date);
      const isExpense = t.type === "expense";
      const inRange = date >= new Date(startDate) && date <= new Date(endDate);
      return isExpense && inRange;
    });

    const categoryTotals = {};
    let totalExpenses = 0;

    expenses.forEach(t => {
      const category = t.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + t.amount;
      totalExpenses += t.amount;
    });

    return Object.keys(categoryTotals).map(category => ({
      category,
      amount: categoryTotals[category],
      percentage: totalExpenses > 0 ? (categoryTotals[category] / totalExpenses * 100) : 0
    })).sort((a, b) => b.amount - a.amount);
  }

  getNextId() {
    return Math.max(...this.transactions.map(t => t.Id), 0) + 1;
}

  async logTransactionActivity(action, transaction, description) {
    try {
      const activityLogService = (await import('./activityLogService')).default;
      await activityLogService.logActivity({
        userId: "user_003",
        username: "Current User",
        action,
        entityType: "Transaction",
        entityId: transaction.Id,
        entityName: transaction.description,
        description,
        details: {
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount
        }
      });
    } catch (error) {
      console.error("Failed to log transaction activity:", error);
    }
  }

  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new TransactionService();