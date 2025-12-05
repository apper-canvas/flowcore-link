import mockData from "../mockData/activityLog.json";

class ActivityLogService {
  constructor() {
    this.activities = [...mockData];
  }

  async getAll() {
    await this.delay();
    return [...this.activities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getById(id) {
    await this.delay();
    const activity = this.activities.find(a => a.Id === parseInt(id));
    if (!activity) {
      throw new Error("Activity not found");
    }
    return { ...activity };
  }

  async logActivity(activityData) {
    await this.delay();
    const newActivity = {
      Id: this.getNextId(),
      timestamp: new Date().toISOString(),
      userId: activityData.userId || "system",
      username: activityData.username || "System User",
      action: activityData.action,
      entityType: activityData.entityType,
      entityId: activityData.entityId || null,
      entityName: activityData.entityName || null,
      description: activityData.description,
      details: activityData.details || {},
      ipAddress: activityData.ipAddress || "192.168.1.1",
      userAgent: activityData.userAgent || "Mozilla/5.0 (Web Application)"
    };
    
    this.activities.unshift(newActivity); // Add to beginning for chronological order
    return { ...newActivity };
  }

  async getByDateRange(startDate, endDate) {
    await this.delay();
    return this.activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= new Date(startDate) && activityDate <= new Date(endDate);
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getByUser(userId) {
    await this.delay();
    return this.activities
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getByEntityType(entityType) {
    await this.delay();
    return this.activities
      .filter(activity => activity.entityType.toLowerCase() === entityType.toLowerCase())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getByAction(action) {
    await this.delay();
    return this.activities
      .filter(activity => activity.action.toLowerCase() === action.toLowerCase())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async search(query) {
    await this.delay();
    const searchTerm = query.toLowerCase();
    return this.activities
      .filter(activity =>
        activity.description.toLowerCase().includes(searchTerm) ||
        activity.username.toLowerCase().includes(searchTerm) ||
        activity.entityType.toLowerCase().includes(searchTerm) ||
        activity.action.toLowerCase().includes(searchTerm) ||
        (activity.entityName && activity.entityName.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getActivitySummary() {
    await this.delay();
    const totalActivities = this.activities.length;
    const last24Hours = this.activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return activityDate >= yesterday;
    }).length;

    const actionCounts = {};
    const entityTypeCounts = {};

    this.activities.forEach(activity => {
      actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1;
      entityTypeCounts[activity.entityType] = (entityTypeCounts[activity.entityType] || 0) + 1;
    });

    return {
      totalActivities,
      last24Hours,
      actionCounts,
      entityTypeCounts,
      mostActiveUser: this.getMostActiveUser(),
      recentActivity: this.activities.slice(0, 5)
    };
  }

  getMostActiveUser() {
    const userCounts = {};
    this.activities.forEach(activity => {
      userCounts[activity.username] = (userCounts[activity.username] || 0) + 1;
    });

    const sortedUsers = Object.entries(userCounts).sort(([,a], [,b]) => b - a);
    return sortedUsers.length > 0 ? { username: sortedUsers[0][0], count: sortedUsers[0][1] } : null;
  }

  getNextId() {
    return Math.max(...this.activities.map(a => a.Id), 0) + 1;
  }

  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ActivityLogService();