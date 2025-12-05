import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();



  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-3">
                <ApperIcon name="Layers" className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FlowCore ERP
              </h1>
            </div>
          </div>
{/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`
              }
            >
              Dashboard
            </NavLink>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <ApperIcon
                name={isMobileMenuOpen ? "X" : "Menu"}
                className="w-6 h-6"
              />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:text-gray-900"
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;