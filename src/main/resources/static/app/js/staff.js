let staffAppointments = [];
let staffPatients = [];
let doctors = [];

const STAFF_PAGE_STORAGE_KEY = 'staffCurrentPage';
const STAFF_PAGE_NAMES = ['dashboard', 'appointments', 'patients', 'reports'];

function getSavedStaffPage() {
    const hashPage = window.location.hash ? window.location.hash.slice(1) : '';
    if (STAFF_PAGE_NAMES.includes(hashPage)) return hashPage;
    const storedPage = localStorage.getItem(STAFF_PAGE_STORAGE_KEY);
    return STAFF_PAGE_NAMES.includes(storedPage) ? storedPage : 'dashboard';
}

function setSavedStaffPage(page) {
    if (!STAFF_PAGE_NAMES.includes(page)) return;
    localStorage.setItem(STAFF_PAGE_STORAGE_KEY, page);
    window.history.replaceState(null, '', `#${page}`);
}

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
    return `${patient.lastName || ''}, ${patient.firstName || ''}`.replace(/^,\s*/, '').trim() || displayPatientId(patient.id);
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
        fetch(`${API_BASE_URL}/public/doctors`).then(r => r.json())
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
        `<option value="${p.id}">${escapeHtml(patientName(p))} (${escapeHtml(displayPatientId(p.id))})</option>`
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
            <td>${escapeHtml(a.patientName || displayPatientId(a.patientId))}</td>
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
            <td><span class="patient-id-short" title="${escapeHtml(p.id)}">${escapeHtml(displayPatientId(p.id))}</span></td>
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

function findAppointment(id) {
    return staffAppointments.find(a => String(a.id) === String(id));
}

function appointmentSummaryMarkup(appointment) {
    if (!appointment) return '<p class="summary-muted">Appointment details unavailable.</p>';
    const dt = formatDateTime(appointment.appointmentDateTime);
    return `
        <div class="summary-row"><span>Patient</span><strong>${escapeHtml(appointment.patientName || displayPatientId(appointment.patientId) || 'Patient')}</strong></div>
        <div class="summary-row"><span>Doctor</span><strong>${escapeHtml(appointment.doctorName || appointment.doctorId || 'Doctor')}</strong></div>
        <div class="summary-row"><span>Current Schedule</span><strong>${escapeHtml(dt.date)} at ${escapeHtml(dt.time)}</strong></div>
    `;
}

function openRescheduleModal(id) {
    const appointment = findAppointment(id);
    const dt = appointment ? formatDateTime(appointment.appointmentDateTime) : { date: '', time: '' };
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    document.getElementById('rescheduleId').value = id;
    document.getElementById('rescheduleDate').value = dt.date;
    document.getElementById('rescheduleDate').min = tomorrow;
    document.getElementById('rescheduleTime').value = dt.time ? toTimeInputValue(appointment.appointmentDateTime) : '';
    document.getElementById('rescheduleReason').value = '';
    document.getElementById('rescheduleSummary').innerHTML = appointmentSummaryMarkup(appointment);
    document.getElementById('rescheduleModal').classList.add('active');
}

function closeRescheduleModal() {
    document.getElementById('rescheduleModal')?.classList.remove('active');
    document.getElementById('rescheduleForm')?.reset();
}

function toTimeInputValue(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function rescheduleAppointment(id) {
    openRescheduleModal(id);
}

function openCancelAppointmentModal(id) {
    const appointment = findAppointment(id);
    document.getElementById('cancelAppointmentId').value = id;
    document.getElementById('cancelAppointmentReason').value = '';
    document.getElementById('cancelAppointmentSummary').innerHTML = appointmentSummaryMarkup(appointment);
    document.getElementById('cancelAppointmentModal').classList.add('active');
}

function closeCancelAppointmentModal() {
    document.getElementById('cancelAppointmentModal')?.classList.remove('active');
    document.getElementById('cancelAppointmentForm')?.reset();
}

function cancelAppointment(id) {
    openCancelAppointmentModal(id);
}

function searchAppointments() {
    const query = document.getElementById('searchAppointmentsInput').value.toLowerCase();
    const filtered = staffAppointments.filter(a =>
        (a.patientName || '').toLowerCase().includes(query) ||
        (a.doctorName || '').toLowerCase().includes(query) ||
        (a.patientId || '').toLowerCase().includes(query) ||
        displayPatientId(a.patientId).toLowerCase().includes(query)
    );
    renderAllAppointments(query ? filtered : staffAppointments);
}

function searchPatientsList() {
    const query = document.getElementById('searchPatientsInput').value.toLowerCase();
    const filtered = staffPatients.filter(p =>
        patientName(p).toLowerCase().includes(query) ||
        (p.id || '').toLowerCase().includes(query) ||
        displayPatientId(p.id).toLowerCase().includes(query)
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

function switchStaffPage(page) {
    if (!STAFF_PAGE_NAMES.includes(page)) page = 'dashboard';
    document.querySelectorAll('.nav-item[data-page]').forEach(nav => {
        nav.classList.toggle('active', nav.getAttribute('data-page') === page);
    });
    STAFF_PAGE_NAMES.forEach(name => {
        const node = document.getElementById(`${name}Page`);
        if (!node) return;
        node.classList.toggle('active', name === page);
        node.style.display = name === page ? 'block' : '';
    });
    const titles = { dashboard: 'Staff Dashboard', appointments: 'Appointments', patients: 'Patient Registration', reports: 'Reports' };
    document.getElementById('pageTitle').textContent = titles[page] || 'Staff Dashboard';
    setSavedStaffPage(page);
}

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

    setupResponsiveSidebar();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            switchStaffPage(page);
        });
    });
    switchStaffPage(getSavedStaffPage());
    document.body.classList.add('app-ready');

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

    document.getElementById('rescheduleForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('rescheduleId').value;
        const newDate = document.getElementById('rescheduleDate').value;
        const newTime = document.getElementById('rescheduleTime').value;
        const reason = document.getElementById('rescheduleReason').value.trim() || 'Schedule adjustment';
        const validation = validateAppointmentDate(newDate);

        if (!id || !newTime) {
            showToast('Please select a valid date and time', 'error');
            return;
        }
        if (!validation.valid) {
            showToast(validation.message, 'error');
            return;
        }

        try {
            await api.rescheduleAppointment(id, newDate, newTime, reason);
            closeRescheduleModal();
            await loadData();
            showToast('Appointment rescheduled', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    document.getElementById('cancelAppointmentForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('cancelAppointmentId').value;
        const reason = document.getElementById('cancelAppointmentReason').value.trim();

        if (!id || !reason) {
            showToast('Please enter a cancellation reason', 'error');
            return;
        }

        try {
            await api.cancelAppointment(id, reason);
            closeCancelAppointmentModal();
            await loadData();
            showToast('Appointment cancelled', 'success');
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
window.openRescheduleModal = openRescheduleModal;
window.closeRescheduleModal = closeRescheduleModal;
window.openCancelAppointmentModal = openCancelAppointmentModal;
window.closeCancelAppointmentModal = closeCancelAppointmentModal;
window.openPatientModal = openPatientModal;
window.closePatientModal = closePatientModal;
window.searchAppointments = searchAppointments;
window.searchPatientsList = searchPatientsList;
window.generateAppointmentsReport = generateAppointmentsReport;
window.generatePatientsReport = generatePatientsReport;
window.rescheduleAppointment = rescheduleAppointment;
window.cancelAppointment = cancelAppointment;
window.logout = logout;
