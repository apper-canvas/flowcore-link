import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: "BarChart3" },
    { name: "Inventory", href: "/inventory", icon: "Package" },
    { name: "Sales Orders", href: "/sales-orders", icon: "ShoppingCart" },
    { name: "Purchase Orders", href: "/purchase-orders", icon: "Truck" },
    { name: "Customers", href: "/customers", icon: "Users" },
    { name: "Financials", href: "/financials", icon: "DollarSign" },
    { name: "Journal Entries", href: "/journal-entries", icon: "BookOpen" },
    { name: "Activity Log", href: "/activity-log", icon: "Activity" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex items-center cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-3">
                  <ApperIcon name="Layers" className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  FlowCore ERP
                </h1>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ApperIcon 
                name={isSidebarOpen ? "X" : "Menu"} 
                className="w-6 h-6" 
              />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:transform-none ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-3">
                <ApperIcon name="Layers" className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FlowCore ERP
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-primary bg-primary/10 border-r-2 border-primary"
                        : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`
                  }
                >
                  <ApperIcon name={item.icon} className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-64">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;