package com.healthdesk.dto;

import java.util.Map;

public class ActivityReportDTO {
    private int totalAppointments;
    private int scheduledAppointments;
    private int completedAppointments;
    private int cancelledAppointments;
    private int rescheduledAppointments;
    private int upcomingAppointments;
    private int totalPatients;
    private int activePatients;
    private int archivedPatients;
    private Map<String, Integer> appointmentsByStatus;

    public int getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(int totalAppointments) { this.totalAppointments = totalAppointments; }

    public int getScheduledAppointments() { return scheduledAppointments; }
    public void setScheduledAppointments(int scheduledAppointments) { this.scheduledAppointments = scheduledAppointments; }

    public int getCompletedAppointments() { return completedAppointments; }
    public void setCompletedAppointments(int completedAppointments) { this.completedAppointments = completedAppointments; }

    public int getCancelledAppointments() { return cancelledAppointments; }
    public void setCancelledAppointments(int cancelledAppointments) { this.cancelledAppointments = cancelledAppointments; }

    public int getRescheduledAppointments() { return rescheduledAppointments; }
    public void setRescheduledAppointments(int rescheduledAppointments) { this.rescheduledAppointments = rescheduledAppointments; }

    public int getUpcomingAppointments() { return upcomingAppointments; }
    public void setUpcomingAppointments(int upcomingAppointments) { this.upcomingAppointments = upcomingAppointments; }

    public int getTotalPatients() { return totalPatients; }
    public void setTotalPatients(int totalPatients) { this.totalPatients = totalPatients; }

    public int getActivePatients() { return activePatients; }
    public void setActivePatients(int activePatients) { this.activePatients = activePatients; }

    public int getArchivedPatients() { return archivedPatients; }
    public void setArchivedPatients(int archivedPatients) { this.archivedPatients = archivedPatients; }

    public Map<String, Integer> getAppointmentsByStatus() { return appointmentsByStatus; }
    public void setAppointmentsByStatus(Map<String, Integer> appointmentsByStatus) { this.appointmentsByStatus = appointmentsByStatus; }
}
