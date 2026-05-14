const API_BASE_URL = window.HEALTHDESK_API_BASE_URL || '/api';

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
    },

    async submitInquiry(inquiry) {
        const payload = {
            ...inquiry,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(`${API_BASE_URL}/public/customer-inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return { success: true, source: 'backend' };
            }
        } catch (error) {
            console.log('Customer inquiry API not available; storing locally.');
        }

        const inquiries = JSON.parse(localStorage.getItem('guestInquiries') || '[]');
        inquiries.unshift({
            id: Date.now(),
            ...payload,
            date: new Date().toLocaleString()
        });
        localStorage.setItem('guestInquiries', JSON.stringify(inquiries));
        return { success: true, source: 'local' };
    }
};
