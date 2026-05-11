const SharedData = {
    init: function() {
        this.initUsers();
        this.initPatients();
        this.initAppointments();
        this.initMedicalRecords();
        this.initVitals();
        this.initInquiries();
    },
    
    initUsers: function() {
        if (!localStorage.getItem('systemUsers')) {
            const users = [
                { id: 1, username: 'admin', password: 'admin123', fullname: 'Admin User', email: 'admin@healthdesk.com', role: 'ADMIN', status: 'Active', lastLogin: '2026-03-10' },
                { id: 2, username: 'doctor', password: 'doctor123', fullname: 'Dr. James Cruz', email: 'doctor@healthdesk.com', role: 'DOCTOR', status: 'Active', lastLogin: '2026-03-10' },
                { id: 3, username: 'nurse1', password: 'nurse123', fullname: 'Anna Reyes', email: 'nurse1@healthdesk.com', role: 'NURSE', status: 'Active', lastLogin: '2026-03-10' },
                { id: 4, username: 'nurse2', password: 'nurse123', fullname: 'Bea Gomez', email: 'nurse2@healthdesk.com', role: 'NURSE', status: 'Active', lastLogin: '2026-03-10' },
                { id: 5, username: 'staff', password: 'staff123', fullname: 'Maria Santos', email: 'staff@healthdesk.com', role: 'STAFF', status: 'Active', lastLogin: '2026-03-10' }
            ];
            localStorage.setItem('systemUsers', JSON.stringify(users));
        }
    },
    
    initPatients: function() {
        if (!localStorage.getItem('sharedPatients')) {
            const patients = [
                { id: 'P001', name: 'Carpio, Lyndel J.', firstName: 'Lyndel J.', lastName: 'Carpio', age: 22, gender: 'Male', contact: '09123456789', email: 'carpio@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', assignedDoctorId: 2, assignedNurseId: 3, diagnosis: 'Hypertension', status: 'Active' },
                { id: 'P002', name: 'Balanquit, Junel M.', firstName: 'Junel M.', lastName: 'Balanquit', age: 23, gender: 'Male', contact: '09123456788', email: 'balanquit@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', assignedDoctorId: 2, assignedNurseId: 3, diagnosis: 'Diabetes Type 2', status: 'Active' },
                { id: 'P003', name: 'Balansag, Geraldine R.', firstName: 'Geraldine R.', lastName: 'Balansag', age: 22, gender: 'Female', contact: '09123456787', email: 'balansag@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', assignedDoctorId: 2, assignedNurseId: 4, diagnosis: 'Respiratory Infection', status: 'Active' },
                { id: 'P004', name: 'Colele, Shella Mae E.', firstName: 'Shella Mae E.', lastName: 'Colele', age: 23, gender: 'Female', contact: '09123456786', email: 'colele@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', assignedDoctorId: 2, assignedNurseId: 4, diagnosis: 'Arthritis', status: 'Active' },
                { id: 'P005', name: 'Senobio, Denzel', firstName: 'Denzel', lastName: 'Senobio', age: 22, gender: 'Male', contact: '09123456785', email: 'senobio@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', assignedDoctorId: 2, assignedNurseId: 3, diagnosis: 'Migraine', status: 'Active' },
                { id: 'P006', name: 'Dizon, Judy Marie A.', firstName: 'Judy Marie A.', lastName: 'Dizon', age: 23, gender: 'Female', contact: '09123456784', email: 'dizon@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', assignedDoctorId: 2, assignedNurseId: 4, diagnosis: 'Allergy', status: 'Active' }
            ];
            localStorage.setItem('sharedPatients', JSON.stringify(patients));
        }
    },
    
    initAppointments: function() {
        if (!localStorage.getItem('sharedAppointments')) {
            const today = new Date().toISOString().split('T')[0];
            const appointments = [
                { id: 1, date: today, time: '09:00 AM', patientId: 'P001', patientName: 'Carpio, Lyndel J.', doctorId: 2, doctorName: 'Dr. James Cruz', nurseId: 3, status: 'scheduled', reason: 'Follow-up checkup' },
                { id: 2, date: today, time: '10:30 AM', patientId: 'P002', patientName: 'Balanquit, Junel M.', doctorId: 2, doctorName: 'Dr. James Cruz', nurseId: 3, status: 'scheduled', reason: 'Blood sugar test' },
                { id: 3, date: today, time: '01:00 PM', patientId: 'P003', patientName: 'Balansag, Geraldine R.', doctorId: 2, doctorName: 'Dr. James Cruz', nurseId: 4, status: 'scheduled', reason: 'Chest congestion' }
            ];
            localStorage.setItem('sharedAppointments', JSON.stringify(appointments));
        }
    },
    
    initMedicalRecords: function() {
        if (!localStorage.getItem('sharedMedicalRecords')) {
            const records = [
                { patientId: 'P001', diagnosis: 'Hypertension', history: 'High blood pressure since 2020', medications: 'Lisinopril 10mg once daily', allergies: 'None', lastVisit: new Date().toISOString().split('T')[0] },
                { patientId: 'P002', diagnosis: 'Diabetes Type 2', history: 'Diagnosed 2024, family history', medications: 'Metformin 500mg twice daily', allergies: 'Penicillin', lastVisit: new Date().toISOString().split('T')[0] },
                { patientId: 'P003', diagnosis: 'Respiratory Infection', history: 'Recurrent respiratory issues', medications: 'Amoxicillin 500mg', allergies: 'None', lastVisit: new Date().toISOString().split('T')[0] },
                { patientId: 'P004', diagnosis: 'Arthritis', history: 'Joint pain for 2 years', medications: 'Ibuprofen as needed', allergies: 'None', lastVisit: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
                { patientId: 'P005', diagnosis: 'Migraine', history: 'Frequent headaches', medications: 'Ibuprofen 400mg', allergies: 'NSAIDs', lastVisit: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
                { patientId: 'P006', diagnosis: 'Allergy', history: 'Seasonal allergies', medications: 'Loratadine 10mg', allergies: 'Pollen', lastVisit: new Date(Date.now() - 172800000).toISOString().split('T')[0] }
            ];
            localStorage.setItem('sharedMedicalRecords', JSON.stringify(records));
        }
    },
    
    initVitals: function() {
        if (!localStorage.getItem('sharedVitals')) {
            const vitals = [
                { patientId: 'P001', bp: '130/85', temp: '36.5', weight: '65', hr: '78', lastUpdated: new Date().toISOString().split('T')[0] },
                { patientId: 'P002', bp: '120/80', temp: '36.8', weight: '68', hr: '72', lastUpdated: new Date().toISOString().split('T')[0] },
                { patientId: 'P003', bp: '125/82', temp: '38.2', weight: '62', hr: '88', lastUpdated: new Date().toISOString().split('T')[0] },
                { patientId: 'P004', bp: '140/90', temp: '36.5', weight: '60', hr: '75', lastUpdated: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
                { patientId: 'P005', bp: '118/78', temp: '36.5', weight: '70', hr: '70', lastUpdated: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
                { patientId: 'P006', bp: '115/75', temp: '36.6', weight: '58', hr: '74', lastUpdated: new Date(Date.now() - 172800000).toISOString().split('T')[0] }
            ];
            localStorage.setItem('sharedVitals', JSON.stringify(vitals));
        }
    },
    
    initInquiries: function() {
        if (!localStorage.getItem('guestInquiries')) {
            localStorage.setItem('guestInquiries', JSON.stringify([]));
        }
    },
    
    getPatients: function() {
        return JSON.parse(localStorage.getItem('sharedPatients') || '[]');
    },
    
    getPatientById: function(id) {
        const patients = this.getPatients();
        return patients.find(p => p.id === id);
    },
    
    getPatientsByDoctor: function(doctorId) {
        const patients = this.getPatients();
        return patients.filter(p => p.assignedDoctorId === doctorId);
    },
    
    getPatientsByNurse: function(nurseId) {
        const patients = this.getPatients();
        return patients.filter(p => p.assignedNurseId === nurseId);
    },
    
    addPatient: function(patient) {
        const patients = this.getPatients();
        patients.push(patient);
        localStorage.setItem('sharedPatients', JSON.stringify(patients));
        return patient;
    },
    
    updatePatient: function(patientId, updates) {
        const patients = this.getPatients();
        const index = patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
            patients[index] = { ...patients[index], ...updates };
            localStorage.setItem('sharedPatients', JSON.stringify(patients));
            return true;
        }
        return false;
    },
    
    assignNurseToPatient: function(patientId, nurseId) {
        return this.updatePatient(patientId, { assignedNurseId: nurseId });
    },
    
    getAppointments: function() {
        return JSON.parse(localStorage.getItem('sharedAppointments') || '[]');
    },
    
    getAppointmentsByDoctor: function(doctorId) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.doctorId === doctorId);
    },
    
    getAppointmentsByNurse: function(nurseId) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.nurseId === nurseId);
    },
    
    getAppointmentsByDate: function(date) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.date === date);
    },
    
    addAppointment: function(appointment) {
        const appointments = this.getAppointments();
        const newId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1;
        const newAppointment = { id: newId, ...appointment, status: 'scheduled' };
        appointments.push(newAppointment);
        localStorage.setItem('sharedAppointments', JSON.stringify(appointments));
        return newAppointment;
    },
    
    updateAppointment: function(id, updates) {
        const appointments = this.getAppointments();
        const index = appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            appointments[index] = { ...appointments[index], ...updates };
            localStorage.setItem('sharedAppointments', JSON.stringify(appointments));
            return true;
        }
        return false;
    },
    
    cancelAppointment: function(id, reason) {
        return this.updateAppointment(id, { status: 'cancelled', cancelledReason: reason });
    },
    
    getMedicalRecords: function() {
        return JSON.parse(localStorage.getItem('sharedMedicalRecords') || '[]');
    },
    
    getMedicalRecordByPatient: function(patientId) {
        const records = this.getMedicalRecords();
        return records.find(r => r.patientId === patientId);
    },
    
    addMedicalRecord: function(record) {
        const records = this.getMedicalRecords();
        records.push(record);
        localStorage.setItem('sharedMedicalRecords', JSON.stringify(records));
        return record;
    },
    
    updateMedicalRecord: function(patientId, updates) {
        const records = this.getMedicalRecords();
        const index = records.findIndex(r => r.patientId === patientId);
        if (index !== -1) {
            records[index] = { ...records[index], ...updates, lastVisit: new Date().toISOString().split('T')[0] };
            localStorage.setItem('sharedMedicalRecords', JSON.stringify(records));
            return true;
        }
        return false;
    },
    
    getVitals: function() {
        return JSON.parse(localStorage.getItem('sharedVitals') || '[]');
    },
    
    getVitalsByPatient: function(patientId) {
        const vitals = this.getVitals();
        return vitals.find(v => v.patientId === patientId);
    },
    
    addVitals: function(vitals) {
        const allVitals = this.getVitals();
        allVitals.push(vitals);
        localStorage.setItem('sharedVitals', JSON.stringify(allVitals));
        return vitals;
    },
    
    updateVitals: function(patientId, updates) {
        const vitals = this.getVitals();
        const index = vitals.findIndex(v => v.patientId === patientId);
        if (index !== -1) {
            vitals[index] = { ...vitals[index], ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
            localStorage.setItem('sharedVitals', JSON.stringify(vitals));
            return true;
        }
        return false;
    },
    
    getUsers: function() {
        return JSON.parse(localStorage.getItem('systemUsers') || '[]');
    },
    
    getUserById: function(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id);
    },
    
    getUsersByRole: function(role) {
        const users = this.getUsers();
        return users.filter(u => u.role === role);
    },
    
    addUser: function(user) {
        const users = this.getUsers();
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = { id: newId, ...user, status: 'Active', lastLogin: 'Never' };
        users.push(newUser);
        localStorage.setItem('systemUsers', JSON.stringify(users));
        return newUser;
    },
    
    updateUser: function(id, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('systemUsers', JSON.stringify(users));
            return true;
        }
        return false;
    },
    
    deleteUser: function(id) {
        const users = this.getUsers();
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem('systemUsers', JSON.stringify(filtered));
        return true;
    },
    
    getInquiries: function() {
        return JSON.parse(localStorage.getItem('guestInquiries') || '[]');
    },
    
    addInquiry: function(inquiry) {
        const inquiries = this.getInquiries();
        const newInquiry = { id: Date.now(), ...inquiry, date: new Date().toLocaleString(), status: 'pending' };
        inquiries.push(newInquiry);
        localStorage.setItem('guestInquiries', JSON.stringify(inquiries));
        return newInquiry;
    },
    
    updateInquiry: function(id, status) {
        const inquiries = this.getInquiries();
        const index = inquiries.findIndex(i => i.id === id);
        if (index !== -1) {
            inquiries[index].status = status;
            localStorage.setItem('guestInquiries', JSON.stringify(inquiries));
            return true;
        }
        return false;
    },
    
    deleteInquiry: function(id) {
        const inquiries = this.getInquiries();
        const filtered = inquiries.filter(i => i.id !== id);
        localStorage.setItem('guestInquiries', JSON.stringify(filtered));
        return true;
    },
    
    clearAll: function() {
        localStorage.removeItem('systemUsers');
        localStorage.removeItem('sharedPatients');
        localStorage.removeItem('sharedAppointments');
        localStorage.removeItem('sharedMedicalRecords');
        localStorage.removeItem('sharedVitals');
        localStorage.removeItem('guestInquiries');
        this.init();
    }
};

SharedData.init();
