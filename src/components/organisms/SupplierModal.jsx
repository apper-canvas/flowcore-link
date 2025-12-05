import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import FormField from "@/components/molecules/FormField";
import Button from "@/components/atoms/Button";

const SupplierModal = ({ isOpen, onClose, supplier, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    paymentTerms: "Net 30",
    status: "active",
    rating: 0
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        contactName: supplier.contactName || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        paymentTerms: supplier.paymentTerms || "Net 30",
        status: supplier.status || "active",
        rating: supplier.rating || 0
      });
    } else {
      setFormData({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        paymentTerms: "Net 30",
        status: "active",
        rating: 0
      });
    }
  }, [supplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    
    if (!formData.contactName.trim()) {
      toast.error("Contact name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      toast.success(supplier ? "Supplier updated successfully" : "Supplier created successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  const paymentTermsOptions = [
    { value: "Net 15", label: "Net 15" },
    { value: "Net 30", label: "Net 30" },
    { value: "Net 45", label: "Net 45" },
    { value: "Net 60", label: "Net 60" },
    { value: "COD", label: "Cash on Delivery" },
    { value: "Prepaid", label: "Prepaid" }
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {supplier ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ApperIcon name="X" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Supplier Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter supplier name"
              required
            />
            
            <FormField
              label="Contact Name"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Enter contact person name"
              required
            />
            
            <FormField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
            
            <FormField
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
            
            <FormField
              label="Payment Terms"
              type="select"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              options={paymentTermsOptions}
              required
            />
            
            <FormField
              label="Status"
              type="select"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              required
            />
          </div>

          <FormField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter full address"
          />
          
          <FormField
            label="Rating"
            type="number"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="0"
            max="5"
            step="0.1"
            placeholder="0.0"
          />

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {loading ? "Saving..." : (supplier ? "Update Supplier" : "Create Supplier")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;