import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Input from "@/components/atoms/Input";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import MetricCard from "@/components/molecules/MetricCard";
import Chart from "react-apexcharts";
import transactionService from "@/services/api/transactionService";
import productService from "@/services/api/productService";
import { format, subMonths } from "date-fns";

const AdvancedReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range state
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Report data state
  const [cashFlowData, setCashFlowData] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [profitMargins, setProfitMargins] = useState([]);
  
  // Chart options
  const [chartPeriod, setChartPeriod] = useState('monthly');

  useEffect(() => {
    loadReportData();
  }, [startDate, endDate]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cashFlow, expenses, profits] = await Promise.all([
        transactionService.getCashFlowAnalysis(startDate, endDate),
        transactionService.getExpenseCategorization(startDate, endDate),
        productService.getProfitMargins()
      ]);

      setCashFlowData(cashFlow);
      setExpenseCategories(expenses);
      setProfitMargins(profits);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      dateRange: { startDate, endDate },
      cashFlow: cashFlowData,
      expenses: expenseCategories,
      profitMargins: profitMargins,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Report exported successfully");
  };

  // Cash flow chart configuration
  const cashFlowChartOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: true }
    },
    title: {
      text: 'Cash Flow Trend',
      align: 'left'
    },
    xaxis: {
      categories: cashFlowData.map(d => format(new Date(d.month + '-01'), 'MMM yyyy')),
      title: { text: 'Month' }
    },
    yaxis: {
      title: { text: 'Amount ($)' },
      labels: {
        formatter: (value) => `$${value.toLocaleString()}`
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#10b981', '#ef4444', '#3b82f6'],
    legend: {
      position: 'top'
    }
  };

  const cashFlowSeries = [
    {
      name: 'Income',
      data: cashFlowData.map(d => d.income)
    },
    {
      name: 'Expenses', 
      data: cashFlowData.map(d => d.expenses)
    },
    {
      name: 'Net Cash Flow',
      data: cashFlowData.map(d => d.net)
    }
  ];

  // Expense pie chart configuration
  const expenseChartOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    title: {
      text: 'Expense Breakdown by Category',
      align: 'left'
    },
    labels: expenseCategories.map(e => e.category),
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Expenses',
              formatter: () => `$${expenseCategories.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`
            }
          }
        }
      }
    }
  };

  const expenseSeries = expenseCategories.map(e => e.amount);

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadReportData} />;

  // Calculate summary metrics
  const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = cashFlowData.reduce((sum, d) => sum + d.expenses, 0);
  const netCashFlow = totalIncome - totalExpenses;
  const avgProfitMargin = profitMargins.length > 0 
    ? profitMargins.reduce((sum, p) => sum + p.marginPercentage, 0) / profitMargins.length 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/financials')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ApperIcon name="ArrowLeft" className="w-4 h-4 mr-1" />
              Back to Financials
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Financial Reports</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive analysis of cash flow, expenses, and profit margins
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="outline" onClick={handleExportReport}>
            <ApperIcon name="Download" className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Chart Period</label>
            <Select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="form-input"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Income"
          value={`$${totalIncome.toLocaleString()}`}
          icon="TrendingUp"
          className="card"
        />
        <MetricCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          icon="TrendingDown"
          className="card"
        />
        <MetricCard
          title="Net Cash Flow"
          value={`$${netCashFlow.toLocaleString()}`}
          icon={netCashFlow >= 0 ? "ArrowUp" : "ArrowDown"}
          className={`card ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
        />
        <MetricCard
          title="Avg Profit Margin"
          value={`${avgProfitMargin.toFixed(1)}%`}
          icon="Percent"
          className="card"
        />
      </div>

      {/* Cash Flow Analysis */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Analysis</h3>
        {cashFlowData.length > 0 ? (
          <Chart
            options={cashFlowChartOptions}
            series={cashFlowSeries}
            type="line"
            height={350}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No cash flow data available for the selected period
          </div>
        )}
      </div>

      {/* Expense Categorization & Profit Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Expense Categories */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          {expenseCategories.length > 0 ? (
            <div>
              <Chart
                options={expenseChartOptions}
                series={expenseSeries}
                type="donut"
                height={300}
              />
              <div className="mt-4 space-y-2">
                {expenseCategories.slice(0, 5).map((expense, index) => (
                  <div key={expense.category} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{expense.category}</span>
                    <span className="text-gray-600">
                      ${expense.amount.toLocaleString()} ({expense.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No expense data available for the selected period
            </div>
          )}
        </div>

        {/* Product Profit Margins */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Profit Margins</h3>
          {profitMargins.length > 0 ? (
            <div className="space-y-3">
              {profitMargins.slice(0, 8).map((product) => (
                <div key={product.Id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-gray-600">{product.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {product.marginPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">
                      ${product.profit.toFixed(2)} profit
                    </div>
                  </div>
                </div>
              ))}
              {profitMargins.length > 8 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  +{profitMargins.length - 8} more products
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No product data available
            </div>
          )}
        </div>
      </div>

      {/* Report Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>
        <div className="prose prose-sm text-gray-600">
          <p>
            <strong>Report Period:</strong> {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
          </p>
          <p>
            <strong>Cash Flow Performance:</strong> {netCashFlow >= 0 ? 'Positive' : 'Negative'} net cash flow of ${Math.abs(netCashFlow).toLocaleString()}
          </p>
          {expenseCategories.length > 0 && (
            <p>
              <strong>Top Expense Category:</strong> {expenseCategories[0]?.category} accounting for {expenseCategories[0]?.percentage.toFixed(1)}% of total expenses
            </p>
          )}
          {profitMargins.length > 0 && (
            <p>
              <strong>Highest Margin Product:</strong> {profitMargins[0]?.name} with {profitMargins[0]?.marginPercentage.toFixed(1)}% profit margin
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;