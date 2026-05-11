let staffAppointments = [
    { id: 1, date: new Date().toISOString().split('T')[0], time: '09:00 AM', patientId: 'P001', patient: 'Carpio, Lyndel J.', doctor: 'Dr. Santos', status: 'scheduled' },
    { id: 2, date: new Date().toISOString().split('T')[0], time: '10:30 AM', patientId: 'P002', patient: 'Balanquit, Junel M.', doctor: 'Dr. Cruz', status: 'scheduled' },
    { id: 3, date: new Date().toISOString().split('T')[0], time: '01:00 PM', patientId: 'P003', patient: 'Balansag, Geraldine R.', doctor: 'Dr. Lopez', status: 'scheduled' },
    { id: 4, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '02:30 PM', patientId: 'P004', patient: 'Colele, Shella Mae E.', doctor: 'Dr. Santos', status: 'scheduled' },
    { id: 5, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '03:30 PM', patientId: 'P005', patient: 'Senobio, Denzel', doctor: 'Dr. Cruz', status: 'scheduled' },
    { id: 6, date: new Date(Date.now() + 172800000).toISOString().split('T')[0], time: '09:00 AM', patientId: 'P006', patient: 'Dizon, Judy Marie A.', doctor: 'Dr. Lopez', status: 'scheduled' }
];

let staffPatients = [
    { id: 'P001', firstName: 'Lyndel J.', lastName: 'Carpio', name: 'Carpio, Lyndel J.', age: 22, contact: '09123456789', email: 'carpio@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', gender: 'Male' },
    { id: 'P002', firstName: 'Junel M.', lastName: 'Balanquit', name: 'Balanquit, Junel M.', age: 23, contact: '09123456788', email: 'balanquit@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', gender: 'Male' },
    { id: 'P003', firstName: 'Geraldine R.', lastName: 'Balansag', name: 'Balansag, Geraldine R.', age: 22, contact: '09123456787', email: 'balansag@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', gender: 'Female' },
    { id: 'P004', firstName: 'Shella Mae E.', lastName: 'Colele', name: 'Colele, Shella Mae E.', age: 23, contact: '09123456786', email: 'colele@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', gender: 'Female' },
    { id: 'P005', firstName: 'Denzel', lastName: 'Senobio', name: 'Senobio, Denzel', age: 22, contact: '09123456785', email: 'senobio@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', gender: 'Male' },
    { id: 'P006', firstName: 'Judy Marie A.', lastName: 'Dizon', name: 'Dizon, Judy Marie A.', age: 23, contact: '09123456784', email: 'dizon@healthdesk.com', address: 'Cawayan, Catarman, Northern Samar', gender: 'Female' }
];

let bookedSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '03:30 PM'];
let nextPatientId = 7;
let nextAppointmentId = 7;

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function calculateStats() {
    const today = getToday();
    const todayCount = staffAppointments.filter(a => a.date === today).length;
    const weekCount = staffAppointments.filter(a => new Date(a.date) > new Date(Date.now() - 7 * 86400000)).length;
    return { today: todayCount, week: weekCount, patients: staffPatients.length, slots: Math.max(0, 12 - todayCount) };
}

function updateStats() {
    const stats = calculateStats();
    document.getElementById('todayCount').innerHTML = stats.today;
    document.getElementById('weekCount').innerHTML = stats.week;
    document.getElementById('patientCount').innerHTML = stats.patients;
    document.getElementById('slotCount').innerHTML = stats.slots;
}

function renderTodayAppointments() {
    const tbody = document.getElementById('appointmentsList');
    if (!tbody) return;
    const today = getToday();
    const todayApps = staffAppointments.filter(a => a.date === today);
    if (todayApps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No appointments today<\/td><\/tr>';
        return;
    }
    let html = '';
    for (let i = 0; i < todayApps.length; i++) {
        const a = todayApps[i];
        html += `
            <tr>
                <td>${a.time}<\/td>
                <td>${a.patientId}<\/td>
                <td><strong>${escapeHtml(a.patient)}<\/strong><\/td>
                <td>${a.doctor}<\/td>
                <td><span class="status-scheduled">${a.status}<\/span><\/td>
                <td><button class="btn-edit" onclick="editAppointment(${a.id})">Edit<\/button><button class="btn-cancel" onclick="cancelAppointment(${a.id})">Cancel<\/button><\/td>
             <\/tr>
        `;
    }
    tbody.innerHTML = html;
}

function renderAllAppointments() {
    const tbody = document.getElementById('allAppointmentsList');
    if (!tbody) return;
    if (staffAppointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No appointments found<\/td><\/tr>';
        return;
    }
    let html = '';
    for (let i = 0; i < staffAppointments.length; i++) {
        const a = staffAppointments[i];
        html += `
            <tr>
                <td>${a.date}<\/td>
                <td>${a.time}<\/td>
                <td><strong>${escapeHtml(a.patient)}<\/strong><\/td>
                <td>${a.doctor}<\/td>
                <td><span class="status-scheduled">${a.status}<\/span><\/td>
                <td><button class="btn-edit" onclick="editAppointment(${a.id})">Edit<\/button><button class="btn-cancel" onclick="cancelAppointment(${a.id})">Cancel<\/button><\/td>
             <\/tr>
        `;
    }
    tbody.innerHTML = html;
}

function renderPatients() {
    const tbody = document.getElementById('patientsList');
    if (!tbody) return;
    if (staffPatients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No patients found<\/td><\/tr>';
        return;
    }
    let html = '';
    for (let i = 0; i < staffPatients.length; i++) {
        const p = staffPatients[i];
        html += `
            <tr>
                <td>${p.id}<\/td>
                <td><strong>${escapeHtml(p.name)}<\/strong><\/td>
                <td>${p.age}<\/td>
                <td>${p.contact}<\/td>
                <td><span class="status-active">Registration only<\/span><\/td>
             <\/tr>
        `;
    }
    tbody.innerHTML = html;
}

function openAppointmentModal() {
    document.getElementById('appointmentModal').classList.add('active');
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').classList.remove('active');
    document.getElementById('appointmentForm').reset();
}

function openPatientModal() {
    document.getElementById('patientModal').classList.add('active');
}

function closePatientModal() {
    document.getElementById('patientModal').classList.remove('active');
    document.getElementById('patientForm').reset();
}

function getBookedSlotsForDate(date, excludeId) {
    return staffAppointments.filter(a => a.date === date && a.id !== excludeId).map(a => a.time);
}

function editAppointment(id) {
    const app = staffAppointments.find(a => a.id === id);
    if (!app) return;
    const newTime = prompt('Edit time:', app.time);
    if (!newTime) return;
    if (getBookedSlotsForDate(app.date, app.id).includes(newTime)) {
        showToast('Time slot taken', 'error');
        return;
    }
    app.time = newTime;
    renderTodayAppointments();
    renderAllAppointments();
    showToast('Appointment updated', 'success');
}

function cancelAppointment(id) {
    const app = staffAppointments.find(a => a.id === id);
    if (!app) return;
    if (!checkCancellationRule(app.date)) {
        showToast('Can only cancel 1 day before', 'error');
        return;
    }
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;
    staffAppointments = staffAppointments.filter(a => a.id !== id);
    const idx = bookedSlots.indexOf(app.time);
    if (idx !== -1) bookedSlots.splice(idx, 1);
    updateStats();
    renderTodayAppointments();
    renderAllAppointments();
    showToast('Appointment cancelled: ' + reason, 'warning');
}

function editPatient(id) {
    showToast('Staff accounts can register patients but cannot edit patient records.', 'error');
}

function deletePatient(id) {
    showToast('Patient records are archived by authorized medical users, not deleted by staff.', 'error');
}

function searchAppointments() {
    const query = document.getElementById('searchAppointmentsInput').value.toLowerCase();
    const tbody = document.getElementById('allAppointmentsList');
    if (!query) {
        renderAllAppointments();
        return;
    }
    const filtered = staffAppointments.filter(a => a.patient.toLowerCase().includes(query) || a.doctor.toLowerCase().includes(query));
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No appointments found<\/td><\/tr>';
        return;
    }
    let html = '';
    for (let i = 0; i < filtered.length; i++) {
        const a = filtered[i];
        html += `
            <tr>
                <td>${a.date}<\/td>
                <td>${a.time}<\/td>
                <td>${escapeHtml(a.patient)}<\/td>
                <td>${a.doctor}<\/td>
                <td><span class="status-scheduled">${a.status}<\/span><\/td>
                <td><button class="btn-edit" onclick="editAppointment(${a.id})">Edit<\/button><button class="btn-cancel" onclick="cancelAppointment(${a.id})">Cancel<\/button><\/td>
             <\/tr>
        `;
    }
    tbody.innerHTML = html;
}

function searchPatientsList() {
    const query = document.getElementById('searchPatientsInput').value.toLowerCase();
    const tbody = document.getElementById('patientsList');
    if (!query) {
        renderPatients();
        return;
    }
    const filtered = staffPatients.filter(p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query));
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No patients found<\/td><\/tr>';
        return;
    }
    let html = '';
    for (let i = 0; i < filtered.length; i++) {
        const p = filtered[i];
        html += `
            <tr>
                <td>${p.id}<\/td>
                <td>${escapeHtml(p.name)}<\/td>
                <td>${p.age}<\/td>
                <td>${p.contact}<\/td>
                <td><span class="status-active">Registration only<\/span><\/td>
             <\/tr>
        `;
    }
    tbody.innerHTML = html;
}

function generateAppointmentsReport() {
    const byDoctor = {};
    const byDate = {};
    
    for (let i = 0; i < staffAppointments.length; i++) {
        const a = staffAppointments[i];
        byDoctor[a.doctor] = (byDoctor[a.doctor] || 0) + 1;
        byDate[a.date] = (byDate[a.date] || 0) + 1;
    }
    
    let doctorHtml = '';
    for (const doc in byDoctor) {
        const percentage = ((byDoctor[doc] / staffAppointments.length) * 100).toFixed(1);
        doctorHtml += `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e2e8f0;">
                <span><i class="fas fa-user-md" style="color:#0d9488;"></i> ${doc}</span>
                <span><strong>${byDoctor[doc]}</strong> appointments <span style="color:#64748b;">(${percentage}%)</span></span>
            </div>
        `;
    }
    
    let dateHtml = '';
    const sortedDates = Object.keys(byDate).sort().reverse();
    for (let i = 0; i < Math.min(sortedDates.length, 7); i++) {
        const date = sortedDates[i];
        dateHtml += `
            <div style="display:flex;justify-content:space-between;padding:6px 0;">
                <span>📅 ${date}</span>
                <span><strong>${byDate[date]}</strong> appointments</span>
            </div>
        `;
    }
    
    document.getElementById('reportResult').innerHTML = `
        <div style="background:white;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
                <h3 style="color:#0f172a;font-size:20px;margin:0;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-calendar-check" style="color:#0d9488;"></i> Appointments Report
                </h3>
                <p style="color:#64748b;font-size:13px;margin:8px 0 0;">Generated on ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
                <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                    <span style="font-size:28px;font-weight:700;color:#0d9488;">${staffAppointments.length}</span>
                    <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Total Appointments</p>
                </div>
                <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                    <span style="font-size:28px;font-weight:700;color:#0d9488;">${calculateStats().today}</span>
                    <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Today's Appointments</p>
                </div>
                <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                    <span style="font-size:28px;font-weight:700;color:#0d9488;">${calculateStats().week}</span>
                    <p style="font-size:12px;color:#64748b;margin:4px 0 0;">This Week</p>
                </div>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                <div>
                    <h4 style="color:#0f172a;font-size:16px;margin-bottom:16px;"><i class="fas fa-chart-pie"></i> By Doctor</h4>
                    <div style="background:#f8fafc;border-radius:12px;padding:16px;">
                        ${doctorHtml}
                        <div style="margin-top:12px;padding-top:8px;border-top:1px solid #e2e8f0;">
                            <div style="display:flex;justify-content:space-between;font-weight:600;">
                                <span>Total</span>
                                <span>${staffAppointments.length} appointments</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 style="color:#0f172a;font-size:16px;margin-bottom:16px;"><i class="fas fa-calendar-alt"></i> Recent Activity</h4>
                    <div style="background:#f8fafc;border-radius:12px;padding:16px;">
                        ${dateHtml}
                    </div>
                </div>
            </div>
            
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
                <button class="btn-primary" onclick="exportAppointmentsCSV()" style="padding:8px 20px;">
                    <i class="fas fa-download"></i> Export Report
                </button>
            </div>
        </div>
    `;
}

function generatePatientsReport() {
    const uniquePatients = new Set(staffAppointments.map(a => a.patientId)).size;
    const averageAge = staffPatients.reduce((sum, p) => sum + p.age, 0) / staffPatients.length;
    
    const genderCount = { Male: 0, Female: 0 };
    for (let i = 0; i < staffPatients.length; i++) {
        if (staffPatients[i].gender === 'Male') genderCount.Male++;
        else if (staffPatients[i].gender === 'Female') genderCount.Female++;
    }
    
    document.getElementById('reportResult').innerHTML = `
        <div style="background:white;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
                <h3 style="color:#0f172a;font-size:20px;margin:0;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-users" style="color:#0d9488;"></i> Patients Report
                </h3>
                <p style="color:#64748b;font-size:13px;margin:8px 0 0;">Generated on ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
                <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                    <span style="font-size:28px;font-weight:700;color:#0d9488;">${staffPatients.length}</span>
                    <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Total Patients</p>
                </div>
                <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                    <span style="font-size:28px;font-weight:700;color:#0d9488;">${uniquePatients}</span>
                    <p style="font-size:12px;color:#64748b;margin:4px 0 0;">With Appointments</p>
                </div>
                <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                    <span style="font-size:28px;font-weight:700;color:#0d9488;">${averageAge.toFixed(1)}</span>
                    <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Average Age</p>
                </div>
                <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                    <span style="font-size:28px;font-weight:700;color:#0d9488;">${genderCount.Male}:${genderCount.Female}</span>
                    <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Male:Female Ratio</p>
                </div>
            </div>
            
            <div style="margin-bottom:24px;">
                <h4 style="color:#0f172a;font-size:16px;margin-bottom:16px;"><i class="fas fa-list"></i> Patient Directory</h4>
                <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f1f5f9;">
                                <th style="padding:12px;text-align:left;">ID</th>
                                <th style="padding:12px;text-align:left;">Name</th>
                                <th style="padding:12px;text-align:left;">Age</th>
                                <th style="padding:12px;text-align:left;">Gender</th>
                                <th style="padding:12px;text-align:left;">Contact</th>
                                <th style="padding:12px;text-align:left;">Appointments</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${staffPatients.map(p => {
                                const appointmentCount = staffAppointments.filter(a => a.patientId === p.id).length;
                                return `
                                    <tr style="border-bottom:1px solid #e2e8f0;">
                                        <td style="padding:12px;">${p.id}</td>
                                        <td style="padding:12px;font-weight:500;">${escapeHtml(p.name)}</td>
                                        <td style="padding:12px;">${p.age}</td>
                                        <td style="padding:12px;">${p.gender}</td>
                                        <td style="padding:12px;">${p.contact}</td>
                                        <td style="padding:12px;"><span style="background:#ccfbf1;padding:2px 10px;border-radius:20px;">${appointmentCount}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
                <button class="btn-primary" onclick="exportPatientsCSV()" style="padding:8px 20px;">
                    <i class="fas fa-download"></i> Export Report
                </button>
            </div>
        </div>
    `;
}

function exportPatientsCSV() {
    const data = staffPatients.map(p => ({
        'Patient ID': p.id,
        'Name': p.name,
        'Age': p.age,
        'Gender': p.gender,
        'Contact': p.contact,
        'Email': p.email,
        'Address': p.address,
        'Appointments': staffAppointments.filter(a => a.patientId === p.id).length
    }));
    downloadCSV(data, 'patients_report');
}

function exportAppointmentsCSV() {
    const data = staffAppointments.map(a => ({
        Date: a.date,
        Time: a.time,
        Patient: a.patient,
        Doctor: a.doctor,
        Status: a.status
    }));
    downloadCSV(data, 'appointments_report');
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/app/login.html';
}

function checkAuthStaff() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const role = (user?.role || '').toUpperCase().replace('ROLE_', '');
    if (!user || role !== 'STAFF') {
        window.location.href = '/app/login.html';
        return null;
    }
    user.role = role;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuthStaff();
    if (user) {
        document.getElementById('userName').textContent = user.name || user.fullname || user.fullName || user.username;
    }
    
    updateStats();
    renderTodayAppointments();
    renderAllAppointments();
    
    document.getElementById('sidebarSearch').addEventListener('input', function(e) {
        const q = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.nav-item[data-page]');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.getAttribute('data-page') === 'dashboard') continue;
            if (item.innerText.toLowerCase().includes(q)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        }
    });
    
    document.getElementById('mobileMenuBtn').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
    const navItems = document.querySelectorAll('.nav-item');
    for (let i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            for (let j = 0; j < navItems.length; j++) {
                navItems[j].classList.remove('active');
            }
            this.classList.add('active');
            
            const pages = ['dashboardPage', 'appointmentsPage', 'patientsPage', 'reportsPage'];
            for (let k = 0; k < pages.length; k++) {
                const pageNode = document.getElementById(pages[k]);
                if (pageNode) pageNode.style.display = 'none';
            }
            const activePage = document.getElementById(`${page}Page`);
            if (activePage) activePage.style.display = 'block';
            
            const titles = {
                dashboard: 'Staff Dashboard',
                appointments: 'Appointments',
                patients: 'Patient Registration',
                reports: 'Reports'
            };
            document.getElementById('pageTitle').innerHTML = titles[page] || 'Staff Dashboard';
            
            if (page === 'appointments') renderAllAppointments();
            if (page === 'patients') renderPatients();
        });
    }
    
    document.getElementById('appointmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const patient = document.getElementById('appPatient').value;
        const doctor = document.getElementById('appDoctor').value;
        const date = document.getElementById('appDate').value;
        const time = document.getElementById('appTime').value;
        if (!patient || !doctor || !date || !time) {
            showToast('Fill all fields', 'error');
            return;
        }
        const validation = validateAppointmentDate(date);
        if (!validation.valid) {
            showToast(validation.message, 'error');
            return;
        }
        const formattedTime = formatTime(time);
        if (getBookedSlotsForDate(date, null).includes(formattedTime)) {
            showToast('Time slot taken', 'error');
            return;
        }
        const newApp = {
            id: nextAppointmentId++,
            date: date,
            time: formattedTime,
            patientId: `P00${staffPatients.length + 1}`,
            patient: patient,
            doctor: doctor,
            status: 'scheduled'
        };
        staffAppointments.push(newApp);
        bookedSlots.push(formattedTime);
        updateStats();
        renderTodayAppointments();
        renderAllAppointments();
        closeAppointmentModal();
        showToast('Appointment scheduled for ' + patient, 'success');
    });
    
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            if (!firstName || !lastName) {
                showToast('Enter first and last name', 'error');
                return;
            }
            let age = 0;
            const dob = document.getElementById('dob').value;
            if (dob) {
                const ageValidation = validateAge(dob);
                if (!ageValidation.valid) {
                    showToast(ageValidation.message, 'error');
                    return;
                }
                age = ageValidation.age;
            }
            const email = document.getElementById('email').value;
            if (email && !validateEmail(email)) {
                showToast('Invalid email', 'error');
                return;
            }
            const newPatient = {
                id: `P00${nextPatientId++}`,
                firstName: firstName,
                lastName: lastName,
                name: lastName + ', ' + firstName,
                age: age,
                contact: document.getElementById('contact').value,
                email: email,
                address: document.getElementById('address').value,
                gender: document.getElementById('gender').value
            };
            staffPatients.push(newPatient);
            updateStats();
            renderPatients();
            closePatientModal();
            showToast('Patient ' + newPatient.name + ' added', 'success');
        });
    }
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

window.editAppointment = editAppointment;
window.cancelAppointment = cancelAppointment;
window.editPatient = editPatient;
window.deletePatient = deletePatient;
window.openAppointmentModal = openAppointmentModal;
window.closeAppointmentModal = closeAppointmentModal;
window.openPatientModal = openPatientModal;
window.closePatientModal = closePatientModal;
window.searchAppointments = searchAppointments;
window.searchPatientsList = searchPatientsList;
window.generateAppointmentsReport = generateAppointmentsReport;
window.generatePatientsReport = generatePatientsReport;
window.exportAppointmentsCSV = exportAppointmentsCSV;
window.exportPatientsCSV = exportPatientsCSV;
