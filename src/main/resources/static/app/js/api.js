const API_BASE_URL = window.HEALTHDESK_API_BASE_URL || API_CONFIG?.BASE_URL || '/api';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    setToken(token) {
        localStorage.setItem('token', token);
    }

    removeToken() {
        localStorage.removeItem('token');
    }

    getHeaders(includeContentType = true) {
        const headers = {};
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async handleResponse(response) {
        if (response.status === 401) {
            this.removeToken();
            localStorage.removeItem('currentUser');
            window.location.href = '/app/login.html';
            throw new Error('Session expired. Please login again.');
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (!response.ok) {
            throw new Error(data?.message || data?.error || 'Request failed');
        }
        return data;
    }

    async get(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async post(endpoint, data) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async put(endpoint, data) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async delete(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok && data.accessToken) {
            this.setToken(data.accessToken);
            localStorage.setItem('currentUser', JSON.stringify({
                id: data.userId,
                username: data.username,
                role: data.role,
                name: data.fullName || data.username,
                fullname: data.fullName || data.username,
                fullName: data.fullName || data.username,
                email: data.email || ''
            }));
        }
        return data;
    }

    async verifyOtp(username, password, otpCode) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, otpCode })
        });
        const data = await response.json();
        if (response.ok && data.accessToken) {
            this.setToken(data.accessToken);
            localStorage.setItem('currentUser', JSON.stringify({
                id: data.userId,
                username: data.username,
                role: data.role,
                name: data.fullName || data.username,
                fullname: data.fullName || data.username,
                fullName: data.fullName || data.username,
                email: data.email || ''
            }));
        }
        return data;
    }

    async resendOtp(username) {
        return this.post('/auth/resend-otp', { username });
    }

    async logout() {
        try {
            await this.post('/auth/logout', {});
        } catch (error) {
            console.error('Logout error:', error);
        }
        this.removeToken();
        localStorage.removeItem('currentUser');
    }

    async changePassword(oldPassword, newPassword) {
        return this.put('/auth/change-password', { oldPassword, newPassword });
    }

    async getPatients(page = 0, size = 10, search = '') {
        return this.get(`/patients?page=${page}&size=${size}&search=${encodeURIComponent(search)}`);
    }

    async getPatientById(id) {
        return this.get(`/patients/${id}`);
    }

    async getPatientByNumber(patientNumber) {
        return this.get(`/patients/number/${patientNumber}`);
    }

    async createPatient(patientData) {
        return this.post('/patients', patientData);
    }

    async updatePatient(id, patientData) {
        return this.put(`/patients/${id}`, patientData);
    }

    async archivePatient(id) {
        return this.put(`/patients/${id}/archive`, {});
    }

    async deletePatient(id) {
        return this.archivePatient(id);
    }

    async searchPatients(query) {
        return this.get(`/patients/search?q=${encodeURIComponent(query)}`);
    }

    async getAppointments(page = 0, size = 10, date = null) {
        let url = `/appointments?page=${page}&size=${size}`;
        if (date) url += `&date=${date}`;
        return this.get(url);
    }

    async getAppointmentById(id) {
        return this.get(`/appointments/${id}`);
    }

    async getTodayAppointments() {
        return this.get('/appointments/today');
    }

    async getUpcomingAppointments() {
        return this.get('/appointments/upcoming');
    }

    async createAppointment(appointmentData) {
        return this.post('/appointments', appointmentData);
    }

    async updateAppointment(id, appointmentData) {
        return this.put(`/appointments/${id}`, appointmentData);
    }

    async cancelAppointment(id, reason) {
        return this.put(`/appointments/${id}/cancel`, { cancellationReason: reason });
    }

    async rescheduleAppointment(id, newDate, newTime, reason) {
        return this.put(`/appointments/${id}/reschedule`, { newDate, newTime, reason });
    }

    async getAvailableSlots(doctorId, date) {
        return this.get(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
    }

    async getNurses() {
        return this.get('/public/nurses');
    }

    async getMedicalHistory(patientId) {
        return this.get(`/medical-history/${patientId}`);
    }

    async addMedicalHistory(patientId, historyData) {
        return this.post(`/medical-history/${patientId}`, historyData);
    }

    async updateMedicalHistory(historyId, historyData) {
        return this.put(`/medical-history/${historyId}`, historyData);
    }

    async getVitals(patientId) {
        return this.get(`/vitals/${patientId}`);
    }

    async updateVitals(patientId, vitalsData) {
        return this.put(`/vitals/${patientId}`, vitalsData);
    }

    async getPrescriptions(patientId) {
        return this.get(`/prescriptions/${patientId}`);
    }

    async createPrescription(prescriptionData) {
        return this.post('/prescriptions', prescriptionData);
    }

    async getUsers(page = 0, size = 10, search = '') {
        return this.get(`/users?page=${page}&size=${size}&search=${encodeURIComponent(search)}`);
    }

    async getUserById(id) {
        return this.get(`/users/${id}`);
    }

    async createUser(userData) {
        return this.post('/users', userData);
    }

    async updateUser(id, userData) {
        return this.put(`/users/${id}`, userData);
    }

    async resetUserPassword(id, newPassword) {
        return this.put(`/users/${id}/reset-password`, { password: newPassword });
    }

    async archiveUser(id) {
        return this.put(`/users/${id}/archive`, {});
    }

    async deleteUser(id) {
        return this.delete(`/users/${id}`);
    }

    async getAppointmentReport(startDate, endDate) {
        return this.get(`/reports/appointments?start=${startDate}&end=${endDate}`);
    }

    async getPatientReport() {
        return this.get('/reports/activity');
    }

    async getUserReport() {
        return this.get('/reports/users');
    }

    async getDashboardStats() {
        return this.get('/reports/activity');
    }

    async getStaffDashboard() {
        return this.get('/dashboard/staff');
    }

    async getNurseDashboard() {
        return this.get('/dashboard/nurse');
    }

    async getDoctorDashboard() {
        return this.get('/dashboard/doctor');
    }

    async getAdminDashboard() {
        return this.get('/dashboard/admin');
    }
}

const api = new ApiService();
