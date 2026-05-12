let staffAppointments = [];
let staffPatients = [];
let doctors = [];

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function normalizeRole(user) {
    return (user?.role || '').toUpperCase().replace('ROLE_', '');
}

function requireStaff() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || normalizeRole(user) !== 'STAFF' || !api.getToken()) {
        window.location.href = '/app/login.html';
        return null;
    }
    return user;
}

function patientName(patient) {
    return `${patient.lastName || ''}, ${patient.firstName || ''}`.replace(/^,\s*/, '').trim() || patient.id;
}

function formatDateTime(value) {
    const date = new Date(value);
    return {
        date: date.toISOString().split('T')[0],
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}

function calculateStats() {
    const today = getToday();
    const todayCount = staffAppointments.filter(a => formatDateTime(a.appointmentDateTime).date === today).length;
    const weekFromNow = new Date(Date.now() + 7 * 86400000);
    const weekCount = staffAppointments.filter(a => {
        const date = new Date(a.appointmentDateTime);
        return date >= new Date() && date <= weekFromNow;
    }).length;
    return { today: todayCount, week: weekCount, patients: staffPatients.length, slots: Math.max(0, 12 - todayCount) };
}

function updateStats() {
    const stats = calculateStats();
    document.getElementById('todayCount').textContent = stats.today;
    document.getElementById('weekCount').textContent = stats.week;
    document.getElementById('patientCount').textContent = stats.patients;
    document.getElementById('slotCount').textContent = stats.slots;
}

async function loadData() {
    [staffPatients, staffAppointments, doctors] = await Promise.all([
        api.getPatients(0, 500, ''),
        api.getAppointments(),
        fetch('/api/public/doctors').then(r => r.json())
    ]);
    populatePatientOptions();
    populateDoctorOptions();
    updateStats();
    renderTodayAppointments();
    renderAllAppointments();
    renderPatients();
}

function populatePatientOptions() {
    const select = document.getElementById('appPatient');
    if (!select) return;
    select.innerHTML = '<option value="">Select patient</option>' + staffPatients.map(p =>
        `<option value="${p.id}">${escapeHtml(patientName(p))} (${escapeHtml(p.id)})</option>`
    ).join('');
}

function populateDoctorOptions() {
    const select = document.getElementById('appDoctor');
    if (!select) return;
    select.innerHTML = '<option value="">Select doctor</option>' + doctors.map(d =>
        `<option value="${d.id}">${escapeHtml(d.name)}</option>`
    ).join('');
}

function appointmentRow(a, includeDate) {
    const dt = formatDateTime(a.appointmentDateTime);
    const status = (a.status || '').toLowerCase();
    return `
        <tr>
            ${includeDate ? `<td>${dt.date}</td>` : ''}
            <td>${dt.time}</td>
            <td>${escapeHtml(a.patientName || a.patientId)}</td>
            <td>${escapeHtml(a.doctorName || a.doctorId)}</td>
            <td><span class="status-scheduled">${escapeHtml(status || 'scheduled')}</span></td>
            <td>
                <button class="btn-edit" onclick="rescheduleAppointment('${a.id}')">Reschedule</button>
                <button class="btn-cancel" onclick="cancelAppointment('${a.id}')">Cancel</button>
            </td>
        </tr>
    `;
}

function renderTodayAppointments() {
    const tbody = document.getElementById('appointmentsList');
    if (!tbody) return;
    const today = getToday();
    const todayApps = staffAppointments.filter(a => formatDateTime(a.appointmentDateTime).date === today);
    tbody.innerHTML = todayApps.length
        ? todayApps.map(a => appointmentRow(a, false)).join('')
        : '<tr><td colspan="6" style="text-align:center;">No appointments today</td></tr>';
}

function renderAllAppointments(list = staffAppointments) {
    const tbody = document.getElementById('allAppointmentsList');
    if (!tbody) return;
    tbody.innerHTML = list.length
        ? list.map(a => appointmentRow(a, true)).join('')
        : '<tr><td colspan="6" style="text-align:center;">No appointments found</td></tr>';
}

function renderPatients(list = staffPatients) {
    const tbody = document.getElementById('patientsList');
    if (!tbody) return;
    tbody.innerHTML = list.length ? list.map(p => `
        <tr>
            <td>${escapeHtml(p.id)}</td>
            <td><strong>${escapeHtml(patientName(p))}</strong></td>
            <td>${p.age ?? ''}</td>
            <td>${escapeHtml(p.phoneNumber || '')}</td>
            <td><span class="status-active">Registration only</span></td>
        </tr>
    `).join('') : '<tr><td colspan="5" style="text-align:center;">No patients found</td></tr>';
}

function openAppointmentModal() {
    populatePatientOptions();
    populateDoctorOptions();
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

function validateAppointmentDate(date) {
    if (!date) return { valid: false, message: 'Date is required' };
    if (date <= getToday()) return { valid: false, message: 'Appointment must be at least 1 day ahead' };
    return { valid: true };
}

function validateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 0 || age > 150) return { valid: false, message: 'Invalid date of birth' };
    return { valid: true, age };
}

async function rescheduleAppointment(id) {
    const newDate = prompt('New date (YYYY-MM-DD):');
    const newTime = prompt('New time (HH:mm):');
    const reason = prompt('Reason for reschedule:') || 'Schedule adjustment';
    if (!newDate || !newTime) return;
    const validation = validateAppointmentDate(newDate);
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return;
    }
    try {
        await api.rescheduleAppointment(id, newDate, newTime, reason);
        await loadData();
        showToast('Appointment rescheduled', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function cancelAppointment(id) {
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;
    try {
        await api.cancelAppointment(id, reason);
        await loadData();
        showToast('Appointment cancelled', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function searchAppointments() {
    const query = document.getElementById('searchAppointmentsInput').value.toLowerCase();
    const filtered = staffAppointments.filter(a =>
        (a.patientName || '').toLowerCase().includes(query) ||
        (a.doctorName || '').toLowerCase().includes(query) ||
        (a.patientId || '').toLowerCase().includes(query)
    );
    renderAllAppointments(query ? filtered : staffAppointments);
}

function searchPatientsList() {
    const query = document.getElementById('searchPatientsInput').value.toLowerCase();
    const filtered = staffPatients.filter(p =>
        patientName(p).toLowerCase().includes(query) ||
        (p.id || '').toLowerCase().includes(query)
    );
    renderPatients(query ? filtered : staffPatients);
}

function generateAppointmentsReport() {
    const reportResult = document.getElementById('reportResult');
    const stats = calculateStats();
    const scheduled = staffAppointments.filter(a => (a.status || '').toUpperCase() === 'SCHEDULED').length;
    const completed = staffAppointments.filter(a => (a.status || '').toUpperCase() === 'COMPLETED').length;
    const cancelled = staffAppointments.filter(a => (a.status || '').toUpperCase() === 'CANCELLED').length;
    reportResult.classList.remove('empty');
    reportResult.innerHTML = `
        <div class="report-dashboard">
            <div class="report-header">
                <h3><i class="fas fa-calendar-check"></i> Appointments Report</h3>
                <p>Operational summary of clinic appointment scheduling.</p>
            </div>
            <div class="report-kpi-grid">
                <div class="report-kpi-card"><span>Total</span><strong>${staffAppointments.length}</strong><small>All scheduled records</small></div>
                <div class="report-kpi-card"><span>Today</span><strong>${stats.today}</strong><small>Appointments for today</small></div>
                <div class="report-kpi-card"><span>This Week</span><strong>${stats.week}</strong><small>Upcoming within 7 days</small></div>
                <div class="report-kpi-card"><span>Open Slots</span><strong>${stats.slots}</strong><small>Estimated availability today</small></div>
            </div>
            <div class="report-detail-grid">
                <div class="report-detail-card">
                    <h4><i class="fas fa-clipboard-list"></i> Status Breakdown</h4>
                    <div class="report-list">
                        <div class="report-list-row"><span>Scheduled</span><strong>${scheduled}</strong></div>
                        <div class="report-list-row"><span>Completed</span><strong>${completed}</strong></div>
                        <div class="report-list-row"><span>Cancelled</span><strong>${cancelled}</strong></div>
                    </div>
                </div>
                <div class="report-detail-card">
                    <h4><i class="fas fa-user-md"></i> Doctors Available</h4>
                    <div class="report-list">
                        <div class="report-list-row"><span>Listed doctors</span><strong>${doctors.length}</strong></div>
                        <div class="report-list-row"><span>Registered patients</span><strong>${staffPatients.length}</strong></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generatePatientsReport() {
    const reportResult = document.getElementById('reportResult');
    const withContact = staffPatients.filter(p => p.phoneNumber || p.email).length;
    const withDoctor = staffPatients.filter(p => p.assignedDoctorName || p.assignedDoctorId).length;
    reportResult.classList.remove('empty');
    reportResult.innerHTML = `
        <div class="report-dashboard">
            <div class="report-header">
                <h3><i class="fas fa-users"></i> Patient Registration Report</h3>
                <p>Registration-only overview. Medical notes remain hidden from staff accounts.</p>
            </div>
            <div class="report-kpi-grid">
                <div class="report-kpi-card"><span>Total Patients</span><strong>${staffPatients.length}</strong><small>Registered records</small></div>
                <div class="report-kpi-card"><span>With Contact</span><strong>${withContact}</strong><small>Phone or email available</small></div>
                <div class="report-kpi-card"><span>Assigned Doctor</span><strong>${withDoctor}</strong><small>Clinical owner set</small></div>
            </div>
            <div class="report-detail-card">
                <h4><i class="fas fa-shield-alt"></i> Staff Access Note</h4>
                <div class="report-list">
                    <div class="report-list-row"><span>Medical history visibility</span><strong>Restricted</strong></div>
                    <div class="report-list-row"><span>Registration workflow</span><strong>Enabled</strong></div>
                </div>
            </div>
        </div>
    `;
}

function exportAppointmentsCSV() {}
function exportPatientsCSV() {}
function editPatient() { showToast('Staff cannot edit medical records.', 'error'); }
function deletePatient() { showToast('Patient records are archived by authorized medical users.', 'error'); }

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function logout() {
    api.logout().finally(() => window.location.href = '/app/login.html');
}

document.addEventListener('DOMContentLoaded', async function() {
    const user = requireStaff();
    if (!user) return;
    document.getElementById('userName').textContent = user.name || user.fullname || user.username;

    try {
        await loadData();
    } catch (error) {
        showToast(error.message, 'error');
    }

    document.getElementById('sidebarSearch')?.addEventListener('input', function(e) {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            if (item.getAttribute('data-page') === 'dashboard') return;
            item.style.display = item.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
        });
    });

    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            ['dashboardPage', 'appointmentsPage', 'patientsPage', 'reportsPage'].forEach(id => {
                const node = document.getElementById(id);
                if (node) node.style.display = 'none';
            });
            document.getElementById(`${page}Page`).style.display = 'block';
            const titles = { dashboard: 'Staff Dashboard', appointments: 'Appointments', patients: 'Patient Registration', reports: 'Reports' };
            document.getElementById('pageTitle').textContent = titles[page] || 'Staff Dashboard';
        });
    });

    document.getElementById('appointmentForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const patientId = document.getElementById('appPatient').value;
        const doctorId = document.getElementById('appDoctor').value;
        const date = document.getElementById('appDate').value;
        const time = document.getElementById('appTime').value;
        const reason = document.getElementById('appReason').value.trim();
        const validation = validateAppointmentDate(date);
        if (!patientId || !doctorId || !time) {
            showToast('Fill all fields', 'error');
            return;
        }
        if (!validation.valid) {
            showToast(validation.message, 'error');
            return;
        }
        try {
            await api.createAppointment({
                patientId,
                doctorId,
                appointmentDateTime: `${date}T${time}:00`,
                reason
            });
            closeAppointmentModal();
            await loadData();
            showToast('Appointment scheduled', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    document.getElementById('patientForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const dob = document.getElementById('dob').value;
        let age = 0;
        if (dob) {
            const ageValidation = validateAge(dob);
            if (!ageValidation.valid) {
                showToast(ageValidation.message, 'error');
                return;
            }
            age = ageValidation.age;
        }
        try {
            await api.createPatient({
                firstName,
                lastName,
                age,
                gender: document.getElementById('gender').value,
                phoneNumber: document.getElementById('contact').value.trim(),
                email: document.getElementById('email').value.trim(),
                address: document.getElementById('address').value.trim()
            });
            closePatientModal();
            await loadData();
            showToast('Patient registered', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

window.openAppointmentModal = openAppointmentModal;
window.closeAppointmentModal = closeAppointmentModal;
window.openPatientModal = openPatientModal;
window.closePatientModal = closePatientModal;
window.searchAppointments = searchAppointments;
window.searchPatientsList = searchPatientsList;
window.generateAppointmentsReport = generateAppointmentsReport;
window.generatePatientsReport = generatePatientsReport;
window.rescheduleAppointment = rescheduleAppointment;
window.cancelAppointment = cancelAppointment;
window.logout = logout;
