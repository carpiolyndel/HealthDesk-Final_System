package com.healthdesk.dto;

import java.util.Map;

public class UserReportDTO {
    private int totalUsers;
    private int activeUsers;
    private int archivedUsers;
    private Map<String, Integer> usersByRole;

    public int getTotalUsers() { return totalUsers; }
    public void setTotalUsers(int totalUsers) { this.totalUsers = totalUsers; }
    public int getActiveUsers() { return activeUsers; }
    public void setActiveUsers(int activeUsers) { this.activeUsers = activeUsers; }
    public int getArchivedUsers() { return archivedUsers; }
    public void setArchivedUsers(int archivedUsers) { this.archivedUsers = archivedUsers; }
    public Map<String, Integer> getUsersByRole() { return usersByRole; }
    public void setUsersByRole(Map<String, Integer> usersByRole) { this.usersByRole = usersByRole; }
}
