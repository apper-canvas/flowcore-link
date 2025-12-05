import mockData from '@/services/mockData/payments.json';

let payments = [...mockData];

const paymentsService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return payments.map(payment => ({ ...payment }));
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const payment = payments.find(p => p.Id === parseInt(id));
    return payment ? { ...payment } : null;
  },

  getByInvoiceId: async (invoiceId) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return payments
      .filter(payment => payment.invoice_id === parseInt(invoiceId))
      .map(payment => ({ ...payment }));
  },

  create: async (paymentData) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Generate new payment ID
    const maxPaymentId = Math.max(...payments.map(p => p.payment_id), 0);
    
    const newPayment = {
      Id: Math.max(...payments.map(p => p.Id), 0) + 1,
      payment_id: maxPaymentId + 1,
      invoice_id: paymentData.invoice_id,
      payment_date: paymentData.payment_date,
      amount_paid: parseFloat(paymentData.amount_paid),
      payment_method: paymentData.payment_method
    };
    
    payments.push(newPayment);
    return { ...newPayment };
  },

  update: async (id, paymentData) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const index = payments.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Payment not found');
    }
    
    payments[index] = {
      ...payments[index],
      invoice_id: paymentData.invoice_id || payments[index].invoice_id,
      payment_date: paymentData.payment_date || payments[index].payment_date,
      amount_paid: parseFloat(paymentData.amount_paid || payments[index].amount_paid),
      payment_method: paymentData.payment_method || payments[index].payment_method
    };
    
    return { ...payments[index] };
  },

  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = payments.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Payment not found');
    }
    
    payments.splice(index, 1);
    return true;
  },

  getPaymentSummary: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount_paid, 0);
    const paymentsByMethod = payments.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount_paid;
      return acc;
    }, {});

    return {
      totalPayments,
      paymentsByMethod,
      paymentCount: payments.length
    };
  }
};

export default paymentsService;