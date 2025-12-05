import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/organisms/Layout";

const Dashboard = lazy(() => import("@/components/pages/Dashboard"));
const Inventory = lazy(() => import("@/components/pages/Inventory"));
const Orders = lazy(() => import("@/components/pages/Orders"));
const Customers = lazy(() => import("@/components/pages/Customers"));
const Financials = lazy(() => import("@/components/pages/Financials"));
const JournalEntries = lazy(() => import("@/components/pages/JournalEntries"));
const AdvancedReports = lazy(() => import("@/components/pages/AdvancedReports"));
const ActivityLog = lazy(() => import("@/components/pages/ActivityLog"));
const PurchaseOrders = lazy(() => import("@/components/pages/PurchaseOrders"));
const NotFound = lazy(() => import("@/components/pages/NotFound"));
const LoadingSuspense = ({ children }) => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4">
        <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  }>
    {children}
  </Suspense>
);

const mainRoutes = [
  {
    path: "",
    index: true,
    element: <LoadingSuspense><Dashboard /></LoadingSuspense>
  },
  {
    path: "inventory",
    element: <LoadingSuspense><Inventory /></LoadingSuspense>
  },
  {
    path: "orders",
    element: <LoadingSuspense><Orders /></LoadingSuspense>
  },
  {
    path: "sales-orders",
    element: <LoadingSuspense><Orders /></LoadingSuspense>
  },
  {
    path: "customers",
    element: <LoadingSuspense><Customers /></LoadingSuspense>
  },
  {
    path: "financials",
    element: <LoadingSuspense><Financials /></LoadingSuspense>
  },
  {
    path: "journal-entries",
    element: <LoadingSuspense><JournalEntries /></LoadingSuspense>
  },
  {
    path: "activity-log",
    element: <LoadingSuspense><ActivityLog /></LoadingSuspense>
  },
  {
    path: "financials/reports", 
    element: <LoadingSuspense><AdvancedReports /></LoadingSuspense>
  },
  {
    path: "purchase-orders", 
    element: <LoadingSuspense><PurchaseOrders /></LoadingSuspense>
  },
  {
    path: "*",
    element: <LoadingSuspense><NotFound /></LoadingSuspense>
  }
];

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: mainRoutes
  }
];

export const router = createBrowserRouter(routes);