let currentUser = null;
let patients = [];
let appointments = [];
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
        [patients, appointments] = await Promise.all([
            api.getPatients(0, 500, ''),
            api.getAppointments()
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

function setupModalEventListeners() {
    document.getElementById('confirmYes')?.addEventListener('click', () => {
        document.getElementById('confirmationModal').style.display = 'none';
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });
    document.getElementById('confirmNo')?.addEventListener('click', () => {
        document.getElementById('confirmationModal').style.display = 'none';
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

function loadRecentAppointments() {
    const container = document.getElementById('recentAppointments');
    if (!container) return;
    const recent = [...appointments].sort((a, b) => new Date(b.appointmentDateTime) - new Date(a.appointmentDateTime)).slice(0, 10);
    container.innerHTML = recent.length ? recent.map(a => `
        <div class="history-item">
            <div class="history-info">
                <strong>${escapeHtml(a.patientName || a.patientId)}</strong>
                <br><small>${new Date(a.appointmentDateTime).toLocaleString()}</small>
            </div>
            <span class="status-badge status-${(a.status || '').toLowerCase()}">${escapeHtml(a.status)}</span>
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
        <div class="data-card">
            <div class="data-info">
                <h4>${escapeHtml(fullName(p))} <span style="color:#666;font-weight:normal;">(${escapeHtml(p.id)})</span></h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
                    <div><strong>Age:</strong> ${p.age ?? ''}</div>
                    <div><strong>Gender:</strong> ${escapeHtml(p.gender || '')}</div>
                    <div><strong>Contact:</strong> ${escapeHtml(p.phoneNumber || 'N/A')}</div>
                    <div><strong>Email:</strong> ${escapeHtml(p.email || 'N/A')}</div>
                </div>
                ${p.medicalHistory ? `<div><strong>Medical History:</strong> ${escapeHtml(p.medicalHistory.substring(0, 80))}${p.medicalHistory.length > 80 ? '...' : ''}</div>` : ''}
            </div>
            <div class="data-actions">
                <button class="btn-secondary" onclick="viewMedicalRecord('${p.id}')"><i class="fas fa-eye"></i> View Record</button>
                <button class="btn-primary" onclick="updateMedicalRecord('${p.id}')"><i class="fas fa-edit"></i> Update Record</button>
                <button class="btn-warning" onclick="archivePatient('${p.id}')"><i class="fas fa-archive"></i> Archive</button>
            </div>
        </div>
    `).join('') : '<div class="empty-state">No assigned patients found</div>';
}

function loadAppointments() {
    const filter = document.getElementById('appointmentFilter')?.value || 'today';
    const today = new Date().toDateString();
    let filtered = [...appointments];
    if (filter === 'today') filtered = appointments.filter(a => new Date(a.appointmentDateTime).toDateString() === today);
    if (filter === 'upcoming') filtered = appointments.filter(a => new Date(a.appointmentDateTime) > new Date());
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    container.innerHTML = filtered.length ? filtered.map(a => `
        <div class="data-card">
            <div class="data-info">
                <h4>${escapeHtml(a.patientName || a.patientId)}</h4>
                <p>Date: <strong>${new Date(a.appointmentDateTime).toLocaleString()}</strong></p>
                <p>Reason: ${escapeHtml(a.reason || 'No reason provided')}</p>
                <p>Status: <span class="status-badge status-${(a.status || '').toLowerCase()}">${escapeHtml(a.status)}</span></p>
            </div>
        </div>
    `).join('') : '<div class="empty-state">No appointments found</div>';
}

function loadMedicalRecords() {
    const container = document.getElementById('medicalRecordsList');
    if (!container) return;
    container.innerHTML = patients.length ? patients.map(p => `
        <div class="data-card">
            <h4>${escapeHtml(fullName(p))}</h4>
            <p><strong>Medical History:</strong> ${escapeHtml(p.medicalHistory || 'No history recorded')}</p>
            <p><strong>Previous Diagnoses:</strong> ${escapeHtml(p.previousDiagnoses || 'No diagnoses recorded')}</p>
        </div>
    `).join('') : '<div class="empty-state">No assigned medical records</div>';
}

function viewMedicalRecord(id) {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <div class="modal-header">
                <h3><i class="fas fa-file-medical"></i> Medical Record - ${escapeHtml(fullName(patient))}</h3>
                <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div style="padding:20px;">
                <p><strong>Patient ID:</strong> ${escapeHtml(patient.id)}</p>
                <p><strong>Medical History:</strong><br>${escapeHtml(patient.medicalHistory || 'No medical history recorded')}</p>
                <p><strong>Previous Diagnoses:</strong><br>${escapeHtml(patient.previousDiagnoses || 'No previous diagnoses recorded')}</p>
                <p><strong>Allergies:</strong> ${escapeHtml(patient.allergies || 'N/A')}</p>
                <p><strong>Current Medications:</strong> ${escapeHtml(patient.currentMedications || 'N/A')}</p>
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
    document.getElementById('updatePatientAddress').value = selectedPatient.address || '';
    document.getElementById('updatePatientMedicalHistory').value = selectedPatient.medicalHistory || '';
    document.getElementById('updatePatientPreviousDiagnoses').value = selectedPatient.previousDiagnoses || '';
    document.getElementById('updateCurrentDiagnosis').value = '';
    document.getElementById('updateTreatmentNotes').value = '';
    document.getElementById('patientModal').style.display = 'block';
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
            address: document.getElementById('updatePatientAddress').value.trim(),
            medicalHistory: document.getElementById('updatePatientMedicalHistory').value.trim(),
            previousDiagnoses
        });
        document.getElementById('patientModal').style.display = 'none';
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
    document.getElementById('confirmationModal').style.display = 'block';
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
    document.getElementById('reportResult').innerHTML = `<div class="report-section"><h3>Diagnosis Summary Report</h3><p>Assigned patients with diagnoses: <strong>${count}</strong></p></div>`;
}

function generateMedicationReport() {
    const count = patients.filter(p => p.currentMedications).length;
    document.getElementById('reportResult').innerHTML = `<div class="report-section"><h3>Medication Report</h3><p>Assigned patients with medications: <strong>${count}</strong></p></div>`;
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
