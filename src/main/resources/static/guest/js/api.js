const API_BASE_URL = 'http://localhost:8080/api';

const GuestAPI = {
    async getClinicInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/public/clinic-info`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Using default clinic info');
        }
        return null;
    },

    async getClinicHours() {
        try {
            const response = await fetch(`${API_BASE_URL}/public/hours`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Using default clinic hours');
        }
        return null;
    },

    async getDoctors() {
        try {
            const response = await fetch(`${API_BASE_URL}/public/doctors`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Doctors API not available');
        }
        return [];
    },

    async getServices() {
        try {
            const response = await fetch(`${API_BASE_URL}/public/services`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Services API not available');
        }
        return [];
    }
};