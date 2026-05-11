let currentUser = null;
let patients = [];
let appointments = [];
let confirmCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuthDoctor();
    if (!user) return;

    loadUserData();
    loadPatients();
    loadAppointments();
    updateStats();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    setupEventListeners();
    setupModalEventListeners();
});

function checkAuthDoctor() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = '/app/login.html';
        return null;
    }
    const user = JSON.parse(userData);
    if (user.role !== 'DOCTOR') {
        window.location.href = '/app/login.html';
        return null;
    }
    return user;
}

function loadUserData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        if (userNameEl) userNameEl.textContent = currentUser.fullName;
        if (userRoleEl) userRoleEl.textContent = 'Physician';
    }
}

function setupModalEventListeners() {
    const confirmYes = document.getElementById('confirmYes');
    if (confirmYes) {
        confirmYes.onclick = () => {
            document.getElementById('confirmationModal').style.display = 'none';
            if (confirmCallback) {
                confirmCallback();
                confirmCallback = null;
            }
        };
    }
    
    const confirmNo = document.getElementById('confirmNo');
    if (confirmNo) {
        confirmNo.onclick = () => {
            document.getElementById('confirmationModal').style.display = 'none';
            confirmCallback = null;
        };
    }
    
    const closePatientModal = document.getElementById('closePatientModal');
    if (closePatientModal) {
        closePatientModal.onclick = () => {
            document.getElementById('patientModal').style.display = 'none';
        };
    }
    
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        };
    });
    
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

function showConfirmation(message, callback) {
    const modal = document.getElementById('confirmationModal');
    const confirmMessage = document.getElementById('confirmMessage');
    confirmMessage.textContent = message;
    confirmCallback = callback;
    modal.style.display = 'block';
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            switchPage(page);
        });
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    const patientForm = document.getElementById('patientForm');
    if (patientForm) patientForm.addEventListener('submit', updatePatientRecord);
}

function switchPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const pageEl = document.getElementById(`${page}Page`);
    const navItem = document.querySelector(`[data-page="${page}"]`);
    
    if (pageEl) pageEl.classList.add('active');
    if (navItem) navItem.classList.add('active');
    
    const titles = {
        dashboard: 'Doctor Dashboard',
        patients: 'My Patients',
        appointments: 'My Schedule',
        medical: 'Medical Records',
        reports: 'My Reports'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Doctor Dashboard';
    
    if (page === 'dashboard') updateStats();
    if (page === 'patients') loadPatients();
    if (page === 'appointments') loadAppointments();
    if (page === 'medical') loadMedicalRecords();
    if (page === 'reports') loadDoctorReports();
}

function getPatients() {
    const data = localStorage.getItem('patients');
    return data ? JSON.parse(data) : [];
}

function getAppointments() {
    const data = localStorage.getItem('appointments');
    return data ? JSON.parse(data) : [];
}

function savePatients(patientsData) {
    localStorage.setItem('patients', JSON.stringify(patientsData));
}

function saveAppointments(appointmentsData) {
    localStorage.setItem('appointments', JSON.stringify(appointmentsData));
}

function updateStats() {
    patients = getPatients();
    appointments = getAppointments();
    
    const activePatients = patients.filter(p => !p.archived);
    const patientCountEl = document.getElementById('patientCount');
    if (patientCountEl) patientCountEl.textContent = activePatients.length;
    
    const today = new Date().toDateString();
    const todayApps = appointments.filter(a => new Date(a.dateTime).toDateString() === today);
    const todayCountEl = document.getElementById('todayCount');
    if (todayCountEl) todayCountEl.textContent = todayApps.length;
    
    const rxCountEl = document.getElementById('rxCount');
    let totalRx = 0;
    activePatients.forEach(p => {
        if (p.currentMedications) {
            totalRx += (p.currentMedications.match(/Medication:/g) || []).length;
        }
    });
    if (rxCountEl) rxCountEl.textContent = totalRx;
    
    loadRecentAppointments();
}

function loadRecentAppointments() {
    appointments = getAppointments();
    
    const recentApps = appointments
        .sort((a, b) => new Date(b.createdAt || b.dateTime) - new Date(a.createdAt || a.dateTime))
        .slice(0, 10);
    
    const container = document.getElementById('recentAppointments');
    if (!container) return;
    
    if (recentApps.length === 0) {
        container.innerHTML = '<div class="empty-state">No recent appointments</div>';
        return;
    }
    
    container.innerHTML = recentApps.map(a => `
        <div class="history-item">
            <div class="history-info">
                <strong>${escapeHtml(a.patientName)}</strong> - ${escapeHtml(a.service || 'General Consultation')}
                <br><small>on ${new Date(a.dateTime).toLocaleDateString()} at ${new Date(a.dateTime).toLocaleTimeString()}</small>
            </div>
            <div class="history-status">
                <span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span>
            </div>
        </div>
    `).join('');
}

function loadPatients() {
    patients = getPatients();
    const activePatients = patients.filter(p => !p.archived);
    const searchTerm = (document.getElementById('searchPatientsInput')?.value || '').toLowerCase();
    const filtered = activePatients.filter(p => 
        p.fullName.toLowerCase().includes(searchTerm) || 
        (p.patientId && p.patientId.toLowerCase().includes(searchTerm))
    );
    
    const container = document.getElementById('patientsList');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No patients found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(p => `
        <div class="data-card">
            <div class="data-info">
                <h4>${escapeHtml(p.fullName)} <span style="color: #666; font-weight: normal;">(${escapeHtml(p.patientId || 'N/A')})</span></h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                    <div><strong>Age:</strong> ${p.age} years</div>
                    <div><strong>Gender:</strong> ${escapeHtml(p.gender)}</div>
                    <div><strong>Contact:</strong> ${escapeHtml(p.contact || 'N/A')}</div>
                    <div><strong>Last Updated:</strong> ${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Never'}</div>
                </div>
                ${p.medicalHistory ? `<div style="margin-top: 10px;"><strong>Medical History:</strong> ${escapeHtml(p.medicalHistory.substring(0, 80))}${p.medicalHistory.length > 80 ? '...' : ''}</div>` : ''}
            </div>
            <div class="data-actions">
                <button class="btn-secondary" onclick="viewMedicalRecord(${p.id})">
                    <i class="fas fa-eye"></i> View Record
                </button>
                <button class="btn-primary" onclick="updateMedicalRecord(${p.id})">
                    <i class="fas fa-edit"></i> Update Record
                </button>
                <button class="btn-warning" onclick="archivePatient(${p.id})">
                    <i class="fas fa-archive"></i> Archive
                </button>
            </div>
        </div>
    `).join('');
}

function archivePatient(id) {
    showConfirmation('Archive this patient? Archived patients can still be viewed but cannot be edited.', () => {
        const patientsData = getPatients();
        const patient = patientsData.find(p => p.id === id);
        
        if (patient) {
            patient.archived = true;
            patient.archivedAt = new Date().toISOString();
            savePatients(patientsData);
            loadPatients();
            showToast(`Patient ${patient.fullName} has been archived`, false);
        }
    });
}

function loadAppointments() {
    appointments = getAppointments();
    const filter = document.getElementById('appointmentFilter')?.value || 'today';
    
    let filtered = [...appointments];
    const today = new Date().toDateString();
    
    if (filter === 'today') {
        filtered = appointments.filter(a => new Date(a.dateTime).toDateString() === today);
    } else if (filter === 'upcoming') {
        filtered = appointments.filter(a => new Date(a.dateTime) > new Date());
    }
    
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No appointments found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(a => `
        <div class="data-card">
            <div class="data-info">
                <h4>${escapeHtml(a.patientName)}</h4>
                <p>Service: <strong>${escapeHtml(a.service || 'General Consultation')}</strong></p>
                <p>📅 ${new Date(a.dateTime).toLocaleString()}</p>
                <p>Reason: ${escapeHtml(a.reason || 'No reason provided')}</p>
                <p>Status: <span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></p>
            </div>
            <div class="data-actions">
                ${a.status === 'SCHEDULED' ? `<button class="btn-primary" onclick="startConsultation(${a.id})"><i class="fas fa-stethoscope"></i> Start Consultation</button>` : ''}
                ${a.status === 'IN_PROGRESS' ? `<button class="btn-success" onclick="completeConsultation(${a.id})"><i class="fas fa-check-circle"></i> Complete Consultation</button>` : ''}
                ${a.status === 'COMPLETED' ? `<span class="status-badge status-completed">Completed</span>` : ''}
            </div>
        </div>
    `).join('');
}

function loadMedicalRecords() {
    const container = document.getElementById('medicalRecordsList');
    if (container) {
        container.innerHTML = '<div class="empty-state">Select a patient from "My Patients" to view medical records</div>';
    }
}

function loadDoctorReports() {
    const patientsData = getPatients();
    const appointmentsData = getAppointments();
    const activePatients = patientsData.filter(p => !p.archived);
    
    const totalPatients = activePatients.length;
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const newPatients = activePatients.filter(p => {
        const created = new Date(p.createdAt);
        return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;
    
    const docTotalPatientsEl = document.getElementById('docTotalPatients');
    const docNewPatientsEl = document.getElementById('docNewPatients');
    if (docTotalPatientsEl) docTotalPatientsEl.textContent = totalPatients;
    if (docNewPatientsEl) docNewPatientsEl.textContent = newPatients;
    
    const doctorAppointments = appointmentsData.filter(a => a.doctorName === currentUser?.fullName);
    
    const docTotalAppointmentsEl = document.getElementById('docTotalAppointments');
    const docCompletedAppointmentsEl = document.getElementById('docCompletedAppointments');
    const docCancelledAppointmentsEl = document.getElementById('docCancelledAppointments');
    const docPendingAppointmentsEl = document.getElementById('docPendingAppointments');
    
    if (docTotalAppointmentsEl) docTotalAppointmentsEl.textContent = doctorAppointments.length;
    if (docCompletedAppointmentsEl) docCompletedAppointmentsEl.textContent = doctorAppointments.filter(a => a.status === 'COMPLETED').length;
    if (docCancelledAppointmentsEl) docCancelledAppointmentsEl.textContent = doctorAppointments.filter(a => a.status === 'CANCELLED').length;
    if (docPendingAppointmentsEl) docPendingAppointmentsEl.textContent = doctorAppointments.filter(a => a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS').length;
    
    const updatedRecords = activePatients.filter(p => p.updatedAt).length;
    const updatedThisMonth = activePatients.filter(p => {
        if (!p.updatedAt) return false;
        const updated = new Date(p.updatedAt);
        return updated.getMonth() === thisMonth && updated.getFullYear() === thisYear;
    }).length;
    
    const docTotalRecordsEl = document.getElementById('docTotalRecords');
    const docUpdatedRecordsEl = document.getElementById('docUpdatedRecords');
    if (docTotalRecordsEl) docTotalRecordsEl.textContent = updatedRecords;
    if (docUpdatedRecordsEl) docUpdatedRecordsEl.textContent = updatedThisMonth;
    
    const serviceCount = {};
    doctorAppointments.forEach(a => {
        const service = a.service || 'General Consultation';
        serviceCount[service] = (serviceCount[service] || 0) + 1;
    });
    
    let topService = '-';
    let maxCount = 0;
    for (const [service, count] of Object.entries(serviceCount)) {
        if (count > maxCount) {
            maxCount = count;
            topService = service;
        }
    }
    
    const docTopServiceEl = document.getElementById('docTopService');
    if (docTopServiceEl) docTopServiceEl.textContent = topService;
    
    const monthCount = {};
    doctorAppointments.forEach(a => {
        const date = new Date(a.dateTime);
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthCount[monthYear] = (monthCount[monthYear] || 0) + 1;
    });
    
    let activeMonth = '-';
    let maxMonthCount = 0;
    for (const [month, count] of Object.entries(monthCount)) {
        if (count > maxMonthCount) {
            maxMonthCount = count;
            activeMonth = month;
        }
    }
    
    const docActiveMonthEl = document.getElementById('docActiveMonth');
    if (docActiveMonthEl) docActiveMonthEl.textContent = activeMonth;
}

function viewMedicalRecord(id) {
    patients = getPatients();
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3><i class="fas fa-file-medical"></i> Medical Record - ${escapeHtml(patient.fullName)}</h3>
                <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><strong>Patient ID:</strong> ${escapeHtml(patient.patientId || 'N/A')}</div>
                    <div><strong>Age:</strong> ${patient.age} years</div>
                    <div><strong>Gender:</strong> ${escapeHtml(patient.gender)}</div>
                    <div><strong>Contact:</strong> ${escapeHtml(patient.contact || 'N/A')}</div>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Address:</strong><br>
                    ${escapeHtml(patient.address || 'N/A')}
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Medical History:</strong><br>
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-line;">
                        ${escapeHtml(patient.medicalHistory || 'No medical history recorded')}
                    </div>
                </div>
                <div>
                    <strong>Previous Diagnoses & Treatments:</strong><br>
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-line; max-height: 200px; overflow-y: auto;">
                        ${escapeHtml(patient.previousDiagnoses || 'No previous diagnoses recorded')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function updateMedicalRecord(id) {
    patients = getPatients();
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    
    document.getElementById('updatePatientName').value = patient.fullName || '';
    document.getElementById('updatePatientAge').value = patient.age || '';
    document.getElementById('updatePatientGender').value = patient.gender || '';
    document.getElementById('updatePatientContact').value = patient.contact || '';
    document.getElementById('updatePatientAddress').value = patient.address || '';
    document.getElementById('updatePatientMedicalHistory').value = patient.medicalHistory || '';
    document.getElementById('updatePatientPreviousDiagnoses').value = patient.previousDiagnoses || '';
    document.getElementById('updateCurrentDiagnosis').value = '';
    document.getElementById('updateTreatmentNotes').value = '';
    
    document.getElementById('patientForm').dataset.patientId = id;
    document.getElementById('patientModal').style.display = 'block';
}

function updatePatientRecord(e) {
    e.preventDefault();
    
    const patientId = parseInt(e.target.dataset.patientId);
    patients = getPatients();
    const patient = patients.find(p => p.id === patientId);
    
    if (!patient) {
        showToast('Patient not found!', true);
        return;
    }
    
    const fullName = document.getElementById('updatePatientName').value.trim();
    const age = parseInt(document.getElementById('updatePatientAge').value);
    const gender = document.getElementById('updatePatientGender').value;
    const contact = document.getElementById('updatePatientContact').value.trim();
    const address = document.getElementById('updatePatientAddress').value.trim();
    const medicalHistory = document.getElementById('updatePatientMedicalHistory').value.trim();
    const previousDiagnoses = document.getElementById('updatePatientPreviousDiagnoses').value.trim();
    const currentDiagnosis = document.getElementById('updateCurrentDiagnosis').value.trim();
    const treatmentNotes = document.getElementById('updateTreatmentNotes').value.trim();
    
    if (!fullName || !age || !gender || !contact) {
        showToast('Please fill all required fields', true);
        return;
    }
    
    patient.fullName = fullName;
    patient.age = age;
    patient.gender = gender;
    patient.contact = contact;
    patient.address = address;
    patient.medicalHistory = medicalHistory;
    patient.updatedAt = new Date().toISOString();
    
    if (currentDiagnosis || treatmentNotes) {
        const newEntry = `\n[${new Date().toLocaleDateString()}] Diagnosis: ${currentDiagnosis}${treatmentNotes ? ` - Treatment: ${treatmentNotes}` : ''}`;
        patient.previousDiagnoses = (patient.previousDiagnoses || '') + newEntry;
    }
    
    savePatients(patients);
    
    document.getElementById('patientModal').style.display = 'none';
    document.getElementById('patientForm').reset();
    
    loadPatients();
    
    showToast('Patient record updated successfully!', false);
}

function startConsultation(id) {
    const appointmentsData = getAppointments();
    const appointment = appointmentsData.find(a => a.id === id);
    
    if (appointment) {
        appointment.status = 'IN_PROGRESS';
        saveAppointments(appointmentsData);
        loadAppointments();
        showToast(`Started consultation for ${appointment.patientName}`, false);
    }
}

function completeConsultation(id) {
    showConfirmation('Mark this consultation as completed?', () => {
        const appointmentsData = getAppointments();
        const appointment = appointmentsData.find(a => a.id === id);
        
        if (appointment) {
            appointment.status = 'COMPLETED';
            saveAppointments(appointmentsData);
            loadAppointments();
            updateStats();
            showToast(`Consultation completed for ${appointment.patientName}`, false);
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateDateTime() {
    const dateTimeEl = document.getElementById('currentDateTime');
    if (dateTimeEl) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        dateTimeEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/app/login.html';
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast ' + (isError ? 'error' : 'success');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function searchPatients() {
    const searchTerm = document.getElementById('searchPatientsInput')?.value.toLowerCase() || '';
    patients = getPatients();
    const activePatients = patients.filter(p => !p.archived);
    
    const filtered = activePatients.filter(p => 
        p.firstName?.toLowerCase().includes(searchTerm) || 
        p.lastName?.toLowerCase().includes(searchTerm) ||
        (p.id && p.id.toLowerCase().includes(searchTerm)) ||
        (p.email && p.email.toLowerCase().includes(searchTerm))
    );
    
    const container = document.getElementById('patientsList');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No patients found matching your search</div>';
        return;
    }
    
    container.innerHTML = filtered.map(p => `
        <div class="data-card">
            <div class="data-info">
                <h4>${escapeHtml(p.firstName + ' ' + p.lastName)} <span style="color: #666; font-weight: normal;">(${escapeHtml(p.id || 'N/A')})</span></h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                    <div><strong>Age:</strong> ${p.age} years</div>
                    <div><strong>Gender:</strong> ${escapeHtml(p.gender)}</div>
                    <div><strong>Contact:</strong> ${escapeHtml(p.phoneNumber || 'N/A')}</div>
                    <div><strong>Email:</strong> ${escapeHtml(p.email || 'N/A')}</div>
                </div>
                ${p.medicalHistory ? `<div style="margin-top: 10px;"><strong>Medical History:</strong> ${escapeHtml(p.medicalHistory.substring(0, 80))}${p.medicalHistory.length > 80 ? '...' : ''}</div>` : ''}
            </div>
            <div class="data-actions">
                <button class="btn-secondary" onclick="viewMedicalRecord('${p.id}')">
                    <i class="fas fa-eye"></i> View Record
                </button>
                <button class="btn-primary" onclick="openMedicalModal('${p.id}')">
                    <i class="fas fa-edit"></i> Update Medical
                </button>
                <button class="btn-warning" onclick="openPrescriptionModal('${p.id}')">
                    <i class="fas fa-prescription-bottle"></i> Prescription
                </button>
            </div>
        </div>
    `).join('');
}

function openMedicalModal(patientId) {
    patients = getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    document.getElementById('modalPatientId').value = patientId;
    document.getElementById('medicalPatientName').value = (patient.firstName || '') + ' ' + (patient.lastName || '');
    document.getElementById('diagnosisInput').value = '';
    document.getElementById('historyInput').value = patient.medicalHistory || '';
    document.getElementById('medicationsInput').value = patient.currentMedications || '';
    document.getElementById('allergiesInput').value = patient.allergies || '';
    
    document.getElementById('medicalModal').style.display = 'block';
}

function closeMedicalModal() {
    document.getElementById('medicalModal').style.display = 'none';
    document.getElementById('medicalForm').reset();
}

function saveMedicalRecord() {
    const patientId = document.getElementById('modalPatientId').value;
    const diagnosis = document.getElementById('diagnosisInput').value.trim();
    const history = document.getElementById('historyInput').value.trim();
    const medications = document.getElementById('medicationsInput').value.trim();
    const allergies = document.getElementById('allergiesInput').value.trim();
    
    if (!patientId) {
        showToast('Error: Patient not found', true);
        return;
    }
    
    patients = getPatients();
    const patient = patients.find(p => p.id === patientId);
    
    if (!patient) {
        showToast('Error: Patient not found', true);
        return;
    }
    
    patient.medicalHistory = history;
    patient.currentMedications = medications;
    patient.allergies = allergies;
    patient.updatedAt = new Date().toISOString();
    
    if (diagnosis) {
        const newEntry = `\n[${new Date().toLocaleDateString()}] ${diagnosis}`;
        patient.previousDiagnoses = (patient.previousDiagnoses || '') + newEntry;
    }
    
    savePatients(patients);
    closeMedicalModal();
    loadPatients();
    showToast('Medical record updated successfully!', false);
}

function openPrescriptionModal(patientId) {
    patients = getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    document.getElementById('rxPatientId').value = patientId;
    document.getElementById('rxPatientName').value = (patient.firstName || '') + ' ' + (patient.lastName || '');
    document.getElementById('medName').value = '';
    document.getElementById('dosage').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('instructions').value = '';
    
    document.getElementById('prescriptionModal').style.display = 'block';
}

function closePrescriptionModal() {
    document.getElementById('prescriptionModal').style.display = 'none';
    document.getElementById('prescriptionForm').reset();
}

function savePrescription() {
    const patientId = document.getElementById('rxPatientId').value;
    const medName = document.getElementById('medName').value.trim();
    const dosage = document.getElementById('dosage').value.trim();
    const duration = document.getElementById('duration').value.trim();
    const instructions = document.getElementById('instructions').value.trim();
    
    if (!medName) {
        showToast('Please enter medication name', true);
        return;
    }
    
    patients = getPatients();
    const patient = patients.find(p => p.id === patientId);
    
    if (!patient) {
        showToast('Error: Patient not found', true);
        return;
    }
    
    const prescription = `\n[${new Date().toLocaleDateString()}] Medication: ${medName}, Dosage: ${dosage}, Duration: ${duration}${instructions ? ', Instructions: ' + instructions : ''}`;
    patient.currentMedications = (patient.currentMedications || '') + prescription;
    patient.updatedAt = new Date().toISOString();
    
    savePatients(patients);
    closePrescriptionModal();
    loadPatients();
    showToast(`Prescription for "${medName}" added successfully!`, false);
}

function generateDiagnosisReport() {
    patients = getPatients();
    const activePatients = patients.filter(p => !p.archived);
    
    const diagnosisCount = {};
    activePatients.forEach(p => {
        if (p.previousDiagnoses) {
            const diagnoses = p.previousDiagnoses.split('\n').filter(d => d.includes('Diagnosis:'));
            diagnoses.forEach(d => {
                const diagnosis = d.split('Diagnosis:')[1]?.trim() || 'Unknown';
                diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
            });
        }
    });
    
    let html = `
        <div class="report-section">
            <h3><i class="fas fa-stethoscope"></i> Diagnosis Summary Report</h3>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Doctor:</strong> ${currentUser?.fullName || 'Unknown'}</p>
            <table class="report-table" style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: #0d9488; color: white;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Diagnosis</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Count</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const sortedDiagnoses = Object.entries(diagnosisCount).sort((a, b) => b[1] - a[1]);
    if (sortedDiagnoses.length === 0) {
        html += '<tr><td colspan="2" style="padding: 10px; text-align: center; border: 1px solid #ddd;">No diagnoses recorded</td></tr>';
    } else {
        sortedDiagnoses.forEach(([diagnosis, count]) => {
            html += `
                <tr style="border: 1px solid #ddd;">
                    <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(diagnosis)}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${count}</td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table></div>';
    
    document.getElementById('reportResult').innerHTML = html;
    showToast('Diagnosis report generated successfully!', false);
}

function generateMedicationReport() {
    patients = getPatients();
    const activePatients = patients.filter(p => !p.archived);
    
    const medicationCount = {};
    activePatients.forEach(p => {
        if (p.currentMedications) {
            const meds = p.currentMedications.split('\n').filter(m => m.includes('Medication:'));
            meds.forEach(m => {
                const medMatch = m.match(/Medication:\s*([^,]+)/);
                if (medMatch) {
                    const med = medMatch[1].trim();
                    medicationCount[med] = (medicationCount[med] || 0) + 1;
                }
            });
        }
    });
    
    let html = `
        <div class="report-section">
            <h3><i class="fas fa-prescription-bottle"></i> Medication Report</h3>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Doctor:</strong> ${currentUser?.fullName || 'Unknown'}</p>
            <table class="report-table" style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: #0d9488; color: white;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Medication</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Prescribed</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const sortedMeds = Object.entries(medicationCount).sort((a, b) => b[1] - a[1]);
    if (sortedMeds.length === 0) {
        html += '<tr><td colspan="2" style="padding: 10px; text-align: center; border: 1px solid #ddd;">No medications prescribed</td></tr>';
    } else {
        sortedMeds.forEach(([med, count]) => {
            html += `
                <tr style="border: 1px solid #ddd;">
                    <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(med)}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${count}</td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table></div>';
    
    document.getElementById('reportResult').innerHTML = html;
    showToast('Medication report generated successfully!', false);
}

function printSection(sectionId) {
    const printWindow = window.open('', '_blank');
    const content = document.getElementById(sectionId).innerHTML;
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HealthDesk Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .report-section { page-break-after: always; }
                h3 { color: #0d9488; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background: #0d9488; color: white; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

window.viewMedicalRecord = viewMedicalRecord;
window.updateMedicalRecord = updateMedicalRecord;
window.startConsultation = startConsultation;
window.completeConsultation = completeConsultation;
window.archivePatient = archivePatient;
window.searchPatients = searchPatients;
window.openMedicalModal = openMedicalModal;
window.closeMedicalModal = closeMedicalModal;
window.saveMedicalRecord = saveMedicalRecord;
window.openPrescriptionModal = openPrescriptionModal;
window.closePrescriptionModal = closePrescriptionModal;
window.savePrescription = savePrescription;
window.generateDiagnosisReport = generateDiagnosisReport;
window.generateMedicationReport = generateMedicationReport;
window.printSection = printSection;
