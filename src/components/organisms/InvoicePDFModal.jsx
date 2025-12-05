import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Loading from "@/components/ui/Loading";
import customerService from "@/services/api/customerService";

const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

const InvoicePDFModal = ({ isOpen, onClose, order }) => {
  const [customer, setCustomer] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (isOpen && order?.customerId) {
      loadCustomerData();
    }
  }, [isOpen, order]);

  const loadCustomerData = async () => {
    setIsLoadingCustomer(true);
    try {
      const customerData = await customerService.getById(order.customerId);
      setCustomer(customerData);
    } catch (error) {
      toast.error("Failed to load customer data");
      console.error("Error loading customer:", error);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!order || !customer) {
      toast.error("Order and customer data required");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const result = await apperClient.functions.invoke(import.meta.env.VITE_GENERATE_INVOICE_PDF, {
        body: JSON.stringify({ order, customer }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (result instanceof ArrayBuffer) {
        // Create blob and download
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${order.orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("Invoice PDF downloaded successfully");
        onClose();
      } else {
        console.info(`apper_info: Got an error in this function: ${import.meta.env.VITE_GENERATE_INVOICE_PDF}. The response body is: ${JSON.stringify(result)}.`);
        toast.error("Failed to generate PDF");
      }
    } catch (error) {
      console.info(`apper_info: Got this error an this function: ${import.meta.env.VITE_GENERATE_INVOICE_PDF}. The error is: ${error.message}`);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const calculateSubtotal = () => {
    if (!order?.items) return 0;
    return order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Generate Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ApperIcon name="X" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoadingCustomer ? (
            <Loading />
          ) : (
            <div className="space-y-6">
              {/* Invoice Preview */}
              <div className="bg-gray-50 p-6 rounded-lg">
                {/* Company Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">FlowCore ERP</h1>
                    <div className="text-sm text-gray-600 mt-2">
                      <div>1234 Business Street</div>
                      <div>Business City, BC 12345</div>
                      <div>Phone: (555) 123-4567</div>
                      <div>Email: billing@flowcore-erp.com</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-primary">INVOICE</h2>
                    <div className="text-sm text-gray-600 mt-2">
                      <div>Invoice #: INV-{order?.orderNumber}</div>
                      <div>Date: {new Date(order?.createdAt).toLocaleDateString()}</div>
                      <div>Order #: {order?.orderNumber}</div>
                    </div>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
                  <div className="text-gray-600">
                    <div>{customer?.name || 'N/A'}</div>
                    <div>{customer?.email || 'N/A'}</div>
                    {customer?.phone && <div>{customer.phone}</div>}
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="border p-3 text-left">Description</th>
                        <th className="border p-3 text-center">Qty</th>
                        <th className="border p-3 text-right">Price</th>
                        <th className="border p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.items?.map((item, index) => (
                        <tr key={index} className={index % 2 === 1 ? "bg-gray-100" : "bg-white"}>
                          <td className="border p-3">{item.name}</td>
                          <td className="border p-3 text-center">{item.quantity}</td>
                          <td className="border p-3 text-right">${item.price.toFixed(2)}</td>
                          <td className="border p-3 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2 border-t">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Tax (10%):</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t font-bold text-lg">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-sm text-gray-600">
                  <div>Thank you for your business!</div>
                  <div>Payment due within 30 days</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={isLoadingCustomer || isGeneratingPDF || !customer}
            className="flex items-center gap-2"
          >
            {isGeneratingPDF ? (
              <>
                <ApperIcon name="Loader2" className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ApperIcon name="Download" className="w-4 h-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFModal;