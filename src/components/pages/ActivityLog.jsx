import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import DataTable from "@/components/organisms/DataTable";
import SearchBar from "@/components/molecules/SearchBar";
import MetricCard from "@/components/molecules/MetricCard";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Input from "@/components/atoms/Input";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import activityLogService from "@/services/api/activityLogService";
import { format, subDays } from "date-fns";

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchQuery, actionFilter, entityTypeFilter, userFilter, startDate, endDate]);

  const loadActivities = async () => {
    setLoading(true);
    setError("");
    
    try {
      const [activitiesData, summaryData] = await Promise.all([
        activityLogService.getAll(),
        activityLogService.getActivitySummary()
      ]);
      setActivities(activitiesData);
      setSummary(summaryData);
    } catch (err) {
      setError("Failed to load activity log");
      console.error("Activity Log error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        const start = startDate ? new Date(startDate) : new Date('2000-01-01');
        const end = endDate ? new Date(endDate + 'T23:59:59') : new Date('2100-01-01');
        return activityDate >= start && activityDate <= end;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.entityName && activity.entityName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Action filter
    if (actionFilter) {
      filtered = filtered.filter(activity => activity.action === actionFilter);
    }

    // Entity type filter
    if (entityTypeFilter) {
      filtered = filtered.filter(activity => activity.entityType === entityTypeFilter);
    }

    // User filter
    if (userFilter) {
      filtered = filtered.filter(activity => activity.username === userFilter);
    }

    setFilteredActivities(filtered);
  };

  const handleExportLog = async () => {
    setExportLoading(true);
    try {
      const exportData = filteredActivities.map(activity => ({
        Timestamp: format(new Date(activity.timestamp), "yyyy-MM-dd HH:mm:ss"),
        User: activity.username,
        Action: activity.action,
        "Entity Type": activity.entityType,
        "Entity Name": activity.entityName || "N/A",
        Description: activity.description,
        "IP Address": activity.ipAddress
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Activity log exported successfully");
    } catch (error) {
      toast.error("Failed to export activity log");
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "CREATE": return "Plus";
      case "UPDATE": return "Edit2";
      case "DELETE": return "Trash2";
      case "SYSTEM": return "Settings";
      default: return "Activity";
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "CREATE": return "text-success";
      case "UPDATE": return "text-primary";
      case "DELETE": return "text-error";
      case "SYSTEM": return "text-secondary";
      default: return "text-gray-600";
    }
  };

  const columns = [
    { 
      key: "timestamp", 
      label: "Date & Time", 
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          <div className="font-medium">{format(new Date(value), "MMM dd, yyyy")}</div>
          <div className="text-gray-500">{format(new Date(value), "HH:mm:ss")}</div>
        </div>
      )
    },
    { 
      key: "username", 
      label: "User", 
      sortable: true,
      render: (value, activity) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
            <ApperIcon name="User" className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">{value}</div>
            <div className="text-xs text-gray-500">{activity.ipAddress}</div>
          </div>
        </div>
      )
    },
    {
      key: "action",
      label: "Action",
      render: (value) => (
        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(value)} bg-current bg-opacity-10`}>
          <ApperIcon name={getActionIcon(value)} className="w-3 h-3" />
          {value}
        </span>
      )
    },
    { 
      key: "entityType", 
      label: "Entity", 
      sortable: true,
      render: (value) => (
        <span className="status-badge bg-gray-100 text-gray-800">{value}</span>
      )
    },
    { 
      key: "description", 
      label: "Description", 
      sortable: true,
      render: (value, activity) => (
        <div>
          <div className="font-medium text-sm">{value}</div>
          {activity.entityName && (
            <div className="text-xs text-gray-500">Entity: {activity.entityName}</div>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorView message={error} onRetry={loadActivities} />
      </div>
    );
  }

  const uniqueActions = [...new Set(activities.map(a => a.action))];
  const uniqueEntityTypes = [...new Set(activities.map(a => a.entityType))];
  const uniqueUsers = [...new Set(activities.map(a => a.username))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="mt-2 text-gray-600">Monitor all user actions and system changes for audit compliance</p>
        </div>
        <Button 
          onClick={handleExportLog} 
          loading={exportLoading}
          disabled={exportLoading || filteredActivities.length === 0}
          className="mt-4 sm:mt-0"
        >
          <ApperIcon name="Download" className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Activities"
          value={summary.totalActivities?.toLocaleString() || "0"}
          icon="Activity"
          trend="All time"
          trendDirection="neutral"
        />
        <MetricCard
          title="Last 24 Hours"
          value={summary.last24Hours || "0"}
          icon="Clock"
          trend="Recent activity"
          trendDirection="up"
        />
        <MetricCard
          title="Most Active User"
          value={summary.mostActiveUser?.username || "None"}
          icon="User"
          trend={summary.mostActiveUser ? `${summary.mostActiveUser.count} actions` : "No data"}
          trendDirection="neutral"
        />
        <MetricCard
          title="Filtered Results"
          value={filteredActivities.length.toLocaleString()}
          icon="Filter"
          trend="Current view"
          trendDirection="neutral"
        />
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
          <div className="lg:col-span-2">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities, users, or entities..."
            />
          </div>
          
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </Select>
          
          <Select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
          >
            <option value="">All Entities</option>
            {uniqueEntityTypes.map(entityType => (
              <option key={entityType} value={entityType}>{entityType}</option>
            ))}
          </Select>

          <Select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Activities Table */}
      {filteredActivities.length === 0 && !loading ? (
        <Empty
          title="No activities found"
          description={searchQuery || actionFilter || entityTypeFilter || userFilter 
            ? "Try adjusting your filters to see more activities"
            : "No activities recorded in the selected date range"
          }
          icon="Activity"
        />
      ) : (
        <DataTable
          data={filteredActivities}
          columns={columns}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ActivityLog;