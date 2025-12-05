import mockData from '@/services/mockData/chartOfAccounts.json';

let accounts = [...mockData];

const chartOfAccountsService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return accounts.map(account => ({ ...account }));
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const account = accounts.find(a => a.Id === parseInt(id));
    return account ? { ...account } : null;
  },

  getByType: async (accountType) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return accounts
      .filter(account => account.account_type === accountType)
      .map(account => ({ ...account }));
  },

  create: async (accountData) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const newAccount = {
      Id: Math.max(...accounts.map(a => a.Id), 0) + 1,
      account_code: accountData.account_code,
      account_name: accountData.account_name,
      account_type: accountData.account_type
    };
    accounts.push(newAccount);
    return { ...newAccount };
  },

  update: async (id, accountData) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const index = accounts.findIndex(a => a.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Account not found');
    }
    
    accounts[index] = {
      ...accounts[index],
      ...accountData
    };
    
    return { ...accounts[index] };
  },

  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = accounts.findIndex(a => a.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Account not found');
    }
    
    accounts.splice(index, 1);
    return true;
  },

  getTrialBalance: async () => {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Calculate balances for each account
    const trialBalance = accounts.map(account => ({
      ...account,
      debit_balance: account.account_type === 'Asset' || account.account_type === 'Expense' ? 
        Math.random() * 50000 : 0,
      credit_balance: account.account_type === 'Liability' || account.account_type === 'Equity' || account.account_type === 'Revenue' ? 
        Math.random() * 50000 : 0
    }));

    return trialBalance;
  }
};

export default chartOfAccountsService;