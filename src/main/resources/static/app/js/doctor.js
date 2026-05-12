let currentUser = null;
let patients = [];
let appointments = [];
let nurses = [];
let selectedPatient = null;
let confirmCallback = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireDoctor();
    if (!user) return;
    currentUser = user;
    loadUserData();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    setupEventListeners();
    setupModalEventListeners();
    await refreshDoctorData();
});

function requireDoctor() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const role = (user?.role || '').toUpperCase().replace('ROLE_', '');
    if (!user || role !== 'DOCTOR' || !api.getToken()) {
        window.location.href = '/app/login.html';
        return null;
    }
    user.role = role;
    return user;
}

async function refreshDoctorData() {
    try {
        [patients, appointments, nurses] = await Promise.all([
            api.getPatients(0, 500, ''),
            api.getAppointments(),
            loadNurses()
        ]);
        updateStats();
        loadPatients();
        loadAppointments();
        loadRecentAppointments();
    } catch (error) {
        showToast(error.message, true);
    }
}

function fullName(patient) {
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.id;
}

function loadUserData() {
    document.getElementById('userName').textContent = currentUser.fullName || currentUser.fullname || currentUser.name || currentUser.username;
    document.getElementById('userRole').textContent = 'Physician';
}

async function loadNurses() {
    try {
        return await api.getNurses();
    } catch (error) {
        console.warn('Unable to load nurses:', error);
        return [];
    }
}

function renderNurseOptions(selectedId = '') {
    const select = document.getElementById('updateAssignedNurse');
    if (!select) return;
    select.innerHTML = '<option value="">No nurse assigned</option>' + nurses.map(nurse => `
        <option value="${escapeHtml(nurse.id)}" ${nurse.id === selectedId ? 'selected' : ''}>
            ${escapeHtml(nurse.name || nurse.email || nurse.id)}
        </option>
    `).join('');
}

function setupModalEventListeners() {
    document.getElementById('confirmYes')?.addEventListener('click', () => {
        document.getElementById('confirmationModal').classList.remove('active');
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });
    document.getElementById('confirmNo')?.addEventListener('click', () => {
        document.getElementById('confirmationModal').classList.remove('active');
        confirmCallback = null;
    });
    document.getElementById('patientForm')?.addEventListener('submit', updatePatientRecord);
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(item.dataset.page);
        });
    });
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

function switchPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`${page}Page`)?.classList.add('active');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    const titles = {
        dashboard: 'Doctor Dashboard',
        patients: 'My Patients',
        appointments: 'My Schedule',
        medical: 'Medical Records',
        reports: 'My Reports'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'Doctor Dashboard';
    if (page === 'reports') loadDoctorReports();
    if (page === 'medical') loadMedicalRecords();
}

function updateStats() {
    const today = new Date().toDateString();
    const todayApps = appointments.filter(a => new Date(a.appointmentDateTime).toDateString() === today);
    const rxCount = patients.reduce((sum, p) => sum + ((p.currentMedications || '').match(/Medication:/g) || []).length, 0);
    setText('patientCount', patients.length);
    setText('docTotalPatients', patients.length);
    setText('todayCount', todayApps.length);
    setText('rxCount', rxCount);
    setText('docTotalAppointments', appointments.length);
    setText('docCompletedAppointments', appointments.filter(a => a.status === 'COMPLETED').length);
    setText('docCancelledAppointments', appointments.filter(a => a.status === 'CANCELLED').length);
    setText('docPendingAppointments', appointments.filter(a => ['SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS'].includes(a.status)).length);
    setText('docTotalRecords', patients.filter(p => p.medicalHistory || p.previousDiagnoses).length);
    setText('docUpdatedRecords', patients.filter(p => p.medicalHistory || p.previousDiagnoses).length);
    setText('docNewPatients', patients.length);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
    const date = parseDate(value);
    if (!date) return 'No schedule';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(value) {
    const date = parseDate(value);
    if (!date) return 'No date';
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(value) {
    const date = parseDate(value);
    if (!date) return 'No time';
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDatePart(value, part) {
    const date = parseDate(value);
    if (!date) return part === 'day' ? '--' : 'TBA';
    if (part === 'day') return date.toLocaleDateString('en-US', { day: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatStatus(status) {
    return String(status || 'SCHEDULED').replace(/_/g, ' ');
}

function loadRecentAppointments() {
    const container = document.getElementById('recentAppointments');
    if (!container) return;
    const recent = [...appointments].sort((a, b) => new Date(b.appointmentDateTime) - new Date(a.appointmentDateTime)).slice(0, 10);
    container.innerHTML = recent.length ? recent.map(a => `
        <div class="clinic-list-item">
            <div class="clinic-list-icon"><i class="fas fa-calendar-day"></i></div>
            <div class="clinic-list-main">
                <strong>${escapeHtml(a.patientName || a.patientId)}</strong>
                <small>${formatDateTime(a.appointmentDateTime)}</small>
            </div>
            <span class="clinic-status status-${(a.status || '').toLowerCase()}">${formatStatus(a.status)}</span>
        </div>
    `).join('') : '<div class="empty-state">No recent appointments</div>';
}

function loadPatients() {
    const searchTerm = (document.getElementById('searchPatientsInput')?.value || '').toLowerCase();
    const filtered = patients.filter(p =>
        fullName(p).toLowerCase().includes(searchTerm) ||
        (p.id || '').toLowerCase().includes(searchTerm)
    );
    const container = document.getElementById('patientsList');
    if (!container) return;
    container.innerHTML = filtered.length ? filtered.map(p => `
        <article class="doctor-patient-card">
            <div class="patient-card-header">
                <div>
                    <h4>${escapeHtml(fullName(p))}</h4>
                    <span class="patient-id">${escapeHtml(p.id)}</span>
                </div>
                <span class="clinic-status status-active">Active</span>
            </div>
            <div class="patient-meta-grid">
                <div><span>Age</span><strong>${p.age ?? 'N/A'}</strong></div>
                <div><span>Gender</span><strong>${escapeHtml(p.gender || 'N/A')}</strong></div>
                <div><span>Contact</span><strong>${escapeHtml(p.phoneNumber || 'N/A')}</strong></div>
                <div><span>Email</span><strong>${escapeHtml(p.email || 'N/A')}</strong></div>
                <div><span>Assigned Nurse</span><strong>${escapeHtml(p.assignedNurseName || 'Not assigned')}</strong></div>
            </div>
            ${p.medicalHistory ? `<div class="patient-note"><strong>Medical History</strong><p>${escapeHtml(p.medicalHistory.substring(0, 100))}${p.medicalHistory.length > 100 ? '...' : ''}</p></div>` : ''}
            <div class="patient-card-actions">
                <button class="btn-secondary" onclick="viewMedicalRecord('${p.id}')"><i class="fas fa-eye"></i> View Record</button>
                <button class="btn-primary" onclick="updateMedicalRecord('${p.id}')"><i class="fas fa-edit"></i> Update Record</button>
                <button class="btn-warning" onclick="archivePatient('${p.id}')"><i class="fas fa-archive"></i> Archive</button>
            </div>
        </article>
    `).join('') : '<div class="empty-state">No assigned patients found</div>';
}

function loadAppointments() {
    const filter = document.getElementById('appointmentFilter')?.value || 'upcoming';
    const today = new Date().toDateString();
    let filtered = [...appointments].sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime));
    if (filter === 'today') filtered = appointments.filter(a => new Date(a.appointmentDateTime).toDateString() === today);
    if (filter === 'upcoming') {
        filtered = appointments
            .filter(a => new Date(a.appointmentDateTime) >= new Date())
            .filter(a => !['COMPLETED', 'CANCELLED'].includes((a.status || '').toUpperCase()))
            .sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime));
    }
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    container.innerHTML = filtered.length ? `
        <div class="schedule-list">
            ${filtered.map(a => `
                <article class="schedule-card">
                    <div class="schedule-date-box">
                        <span>${formatDatePart(a.appointmentDateTime, 'day')}</span>
                        <strong>${formatDatePart(a.appointmentDateTime, 'month')}</strong>
                    </div>
                    <div class="schedule-details">
                        <div class="schedule-title-row">
                            <h4>${escapeHtml(a.patientName || a.patientId)}</h4>
                            <span class="clinic-status status-${(a.status || '').toLowerCase()}">${formatStatus(a.status)}</span>
                        </div>
                        <div class="schedule-meta">
                            <span><i class="fas fa-clock"></i> ${formatTime(a.appointmentDateTime)}</span>
                            <span><i class="fas fa-calendar"></i> ${formatDate(a.appointmentDateTime)}</span>
                        </div>
                        <p><strong>Reason:</strong> ${escapeHtml(a.reason || 'No reason provided')}</p>
                    </div>
                </article>
            `).join('')}
        </div>
    ` : '<div class="empty-state">No appointments found</div>';
}

function loadMedicalRecords() {
    const container = document.getElementById('medicalRecordsList');
    if (!container) return;
    container.innerHTML = patients.length ? `
        <div class="medical-record-grid">
            ${patients.map(p => `
                <article class="medical-summary-card">
                    <div class="medical-summary-header">
                        <div class="medical-icon"><i class="fas fa-file-medical-alt"></i></div>
                        <div>
                            <h4>${escapeHtml(fullName(p))}</h4>
                            <span>${escapeHtml(p.id)}</span>
                        </div>
                    </div>
                    <div class="medical-summary-body">
                        <div>
                            <span>Medical History</span>
                            <p>${escapeHtml(p.medicalHistory || 'No history recorded')}</p>
                        </div>
                        <div>
                            <span>Previous Diagnoses</span>
                            <p>${escapeHtml(p.previousDiagnoses || 'No diagnoses recorded')}</p>
                        </div>
                    </div>
                    <button class="btn-secondary" onclick="viewMedicalRecord('${p.id}')"><i class="fas fa-eye"></i> Open Record</button>
                </article>
            `).join('')}
        </div>
    ` : '<div class="empty-state">No assigned medical records</div>';
}

function viewMedicalRecord(id) {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.classList.add('active');
    modal.innerHTML = `
        <div class="modal-content medical-record-modal">
            <div class="modal-header">
                <h3><i class="fas fa-file-medical"></i> Medical Record</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="record-patient-banner">
                    <div class="medical-icon"><i class="fas fa-user-injured"></i></div>
                    <div>
                        <h4>${escapeHtml(fullName(patient))}</h4>
                        <span>Patient ID: ${escapeHtml(patient.id)}</span>
                    </div>
                </div>
                <div class="record-detail-grid">
                    <div class="record-detail-item full">
                        <span>Medical History</span>
                        <p>${escapeHtml(patient.medicalHistory || 'No medical history recorded')}</p>
                    </div>
                    <div class="record-detail-item full">
                        <span>Previous Diagnoses</span>
                        <p>${escapeHtml(patient.previousDiagnoses || 'No previous diagnoses recorded')}</p>
                    </div>
                    <div class="record-detail-item">
                        <span>Allergies</span>
                        <p>${escapeHtml(patient.allergies || 'N/A')}</p>
                    </div>
                    <div class="record-detail-item">
                        <span>Current Medications</span>
                        <p>${escapeHtml(patient.currentMedications || 'N/A')}</p>
                    </div>
                    <div class="record-detail-item full">
                        <span>Assigned Nurse</span>
                        <p>${escapeHtml(patient.assignedNurseName || 'Not assigned')}</p>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function updateMedicalRecord(id) {
    selectedPatient = patients.find(p => p.id === id);
    if (!selectedPatient) return;
    document.getElementById('updatePatientName').value = fullName(selectedPatient);
    document.getElementById('updatePatientAge').value = selectedPatient.age || '';
    document.getElementById('updatePatientGender').value = selectedPatient.gender || '';
    document.getElementById('updatePatientContact').value = selectedPatient.phoneNumber || '';
    renderNurseOptions(selectedPatient.assignedNurseId || '');
    document.getElementById('updatePatientAddress').value = selectedPatient.address || '';
    document.getElementById('updatePatientMedicalHistory').value = selectedPatient.medicalHistory || '';
    document.getElementById('updatePatientPreviousDiagnoses').value = selectedPatient.previousDiagnoses || '';
    document.getElementById('updateCurrentDiagnosis').value = '';
    document.getElementById('updateTreatmentNotes').value = '';
    document.getElementById('patientModal').classList.add('active');
}

async function updatePatientRecord(e) {
    e.preventDefault();
    if (!selectedPatient) return;
    const currentDiagnosis = document.getElementById('updateCurrentDiagnosis').value.trim();
    const treatmentNotes = document.getElementById('updateTreatmentNotes').value.trim();
    let previousDiagnoses = document.getElementById('updatePatientPreviousDiagnoses').value.trim();
    if (currentDiagnosis || treatmentNotes) {
        previousDiagnoses += `\n[${new Date().toLocaleDateString()}] Diagnosis: ${currentDiagnosis}${treatmentNotes ? ` - Treatment: ${treatmentNotes}` : ''}`;
    }
    try {
        await api.updatePatient(selectedPatient.id, {
            ...selectedPatient,
            firstName: selectedPatient.firstName,
            lastName: selectedPatient.lastName,
            age: parseInt(document.getElementById('updatePatientAge').value, 10),
            gender: document.getElementById('updatePatientGender').value,
            phoneNumber: document.getElementById('updatePatientContact').value.trim(),
            assignedNurseId: document.getElementById('updateAssignedNurse')?.value || null,
            address: document.getElementById('updatePatientAddress').value.trim(),
            medicalHistory: document.getElementById('updatePatientMedicalHistory').value.trim(),
            previousDiagnoses
        });
        document.getElementById('patientModal').classList.remove('active');
        await refreshDoctorData();
        showToast('Patient record updated successfully!', false);
    } catch (error) {
        showToast(error.message, true);
    }
}

function archivePatient(id) {
    showConfirmation('Archive this patient record?', async () => {
        try {
            await api.archivePatient(id);
            await refreshDoctorData();
            showToast('Patient archived', false);
        } catch (error) {
            showToast(error.message, true);
        }
    });
}

function showConfirmation(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirmationModal').classList.add('active');
}

function searchPatients() {
    loadPatients();
}

function loadDoctorReports() {
    updateStats();
    setText('docTopService', 'General Consultation');
    setText('docActiveMonth', new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
}

function generateDiagnosisReport() {
    const count = patients.filter(p => p.previousDiagnoses).length;
    const withHistory = patients.filter(p => p.medicalHistory).length;
    const reportResult = document.getElementById('reportResult');
    reportResult.classList.remove('empty');
    reportResult.innerHTML = `
        <div class="report-dashboard">
            <div class="report-header">
                <h3><i class="fas fa-stethoscope"></i> Diagnosis Summary Report</h3>
                <p>Clinical documentation summary for assigned patients.</p>
            </div>
            <div class="report-kpi-grid">
                <div class="report-kpi-card"><span>Assigned Patients</span><strong>${patients.length}</strong><small>Under your care</small></div>
                <div class="report-kpi-card"><span>With Diagnoses</span><strong>${count}</strong><small>Previous diagnoses recorded</small></div>
                <div class="report-kpi-card"><span>With History</span><strong>${withHistory}</strong><small>Medical history documented</small></div>
            </div>
            <div class="report-detail-card">
                <h4><i class="fas fa-file-medical-alt"></i> Documentation Coverage</h4>
                <div class="report-list">
                    <div class="report-list-row"><span>Diagnosis completion</span><strong>${patients.length ? Math.round((count / patients.length) * 100) : 0}%</strong></div>
                    <div class="report-list-row"><span>History completion</span><strong>${patients.length ? Math.round((withHistory / patients.length) * 100) : 0}%</strong></div>
                </div>
            </div>
        </div>
    `;
}

function generateMedicationReport() {
    const count = patients.filter(p => p.currentMedications).length;
    const allergies = patients.filter(p => p.allergies).length;
    const reportResult = document.getElementById('reportResult');
    reportResult.classList.remove('empty');
    reportResult.innerHTML = `
        <div class="report-dashboard">
            <div class="report-header">
                <h3><i class="fas fa-pills"></i> Medication Report</h3>
                <p>Medication and allergy documentation summary for assigned patients.</p>
            </div>
            <div class="report-kpi-grid">
                <div class="report-kpi-card"><span>Assigned Patients</span><strong>${patients.length}</strong><small>Total clinical load</small></div>
                <div class="report-kpi-card"><span>With Medication</span><strong>${count}</strong><small>Current medications recorded</small></div>
                <div class="report-kpi-card"><span>With Allergies</span><strong>${allergies}</strong><small>Allergy notes available</small></div>
            </div>
            <div class="report-detail-card">
                <h4><i class="fas fa-prescription-bottle-alt"></i> Medication Coverage</h4>
                <div class="report-list">
                    <div class="report-list-row"><span>Medication completion</span><strong>${patients.length ? Math.round((count / patients.length) * 100) : 0}%</strong></div>
                    <div class="report-list-row"><span>Allergy completion</span><strong>${patients.length ? Math.round((allergies / patients.length) * 100) : 0}%</strong></div>
                </div>
            </div>
        </div>
    `;
}

function updateDateTime() {
    const el = document.getElementById('currentDateTime');
    if (el) el.textContent = new Date().toLocaleString();
}

function logout() {
    api.logout().finally(() => window.location.href = '/app/login.html');
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast ' + (isError ? 'error' : 'success');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

window.viewMedicalRecord = viewMedicalRecord;
window.updateMedicalRecord = updateMedicalRecord;
window.archivePatient = archivePatient;
window.searchPatients = searchPatients;
window.loadAppointments = loadAppointments;
window.generateDiagnosisReport = generateDiagnosisReport;
window.generateMedicationReport = generateMedicationReport;
window.logout = logout;
