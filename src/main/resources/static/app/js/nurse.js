let nursePatients = [];
let appointments = [];
let vitalsUpdatedToday = 0;
let currentPatient = null;

async function loadNurseData() {
    [nursePatients, appointments] = await Promise.all([
        api.getPatients(0, 500, ''),
        api.getTodayAppointments()
    ]);
    updateStats();
    renderPatients();
}

function requireNurse() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const role = (user?.role || '').toUpperCase().replace('ROLE_', '');
    if (!user || role !== 'NURSE' || !api.getToken()) {
        window.location.href = '/app/login.html';
        return null;
    }
    return user;
}

function fullName(patient) {
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.id;
}

function updateStats() {
    setText('assignedCount', nursePatients.length);
    setText('vitalsToday', vitalsUpdatedToday);
    setText('todayAppointments', appointments.length);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderPatients(list = nursePatients) {
    const container = document.getElementById('patientsList');
    if (!container) return;
    container.innerHTML = list.length ? list.map(p => `
        <article class="nurse-patient-card">
            <div class="nurse-patient-header">
                <div class="patient-avatar"><i class="fas fa-user-injured"></i></div>
                <div>
                    <h4>${escapeHtml(fullName(p))}</h4>
                    <span class="patient-id">${escapeHtml(p.id)}</span>
                </div>
            </div>
            <div class="nurse-patient-meta">
                <div><span>Gender</span><strong>${escapeHtml(p.gender || 'N/A')}</strong></div>
                <div><span>Age</span><strong>${p.age ?? 'N/A'}</strong></div>
                <div><span>Contact</span><strong>${escapeHtml(p.phoneNumber || 'N/A')}</strong></div>
                <div><span>Doctor</span><strong>${escapeHtml(p.assignedDoctorName || 'N/A')}</strong></div>
            </div>
            <div class="nurse-history-note">
                <span><i class="fas fa-notes-medical"></i> Medical History</span>
                <p>${escapeHtml((p.medicalHistory || 'No notes').substring(0, 140))}</p>
            </div>
            <button class="btn-primary nurse-action-btn" onclick="openVitalsModal('${p.id}')">
                <i class="fas fa-heartbeat"></i> Update Vitals
            </button>
        </article>
    `).join('') : '<div class="empty-state">No assigned patients found</div>';
}

function openVitalsModal(id) {
    currentPatient = nursePatients.find(p => p.id === id);
    if (!currentPatient) return;
    setValue('vitalPatientId', currentPatient.id);
    setValue('vitalPatientName', fullName(currentPatient));
    setValue('bpInput', '');
    setValue('tempInput', '');
    setValue('weightInput', '');
    setValue('hrInput', '');
    document.getElementById('vitalsModal')?.classList.add('active');
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function closeVitalsModal() {
    document.getElementById('vitalsModal')?.classList.remove('active');
    document.getElementById('vitalsForm')?.reset();
    currentPatient = null;
}

async function saveVitals() {
    if (!currentPatient) return;
    const bp = document.getElementById('bpInput').value.trim();
    const temp = document.getElementById('tempInput').value.trim();
    const weight = document.getElementById('weightInput').value.trim();
    const hr = document.getElementById('hrInput').value.trim();
    if (!bp && !temp && !weight && !hr) {
        showToast('Enter at least one vital sign', 'error');
        return;
    }
    const note = `[${new Date().toLocaleString()}] Vitals: BP ${bp || 'N/A'}, Temp ${temp || 'N/A'} C, Weight ${weight || 'N/A'} kg, HR ${hr || 'N/A'} bpm`;
    try {
        const savedName = fullName(currentPatient);
        await api.updatePatient(currentPatient.id, {
            ...currentPatient,
            medicalHistory: `${currentPatient.medicalHistory || ''}\n${note}`.trim()
        });
        vitalsUpdatedToday++;
        closeVitalsModal();
        await loadNurseData();
        showToast(`Vitals updated for ${savedName}`, 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function searchPatients() {
    const query = (document.getElementById('searchPatientsInput')?.value || '').toLowerCase();
    const filtered = nursePatients.filter(p =>
        fullName(p).toLowerCase().includes(query) ||
        (p.id || '').toLowerCase().includes(query)
    );
    renderPatients(query ? filtered : nursePatients);
}

function generateVitalsReport() {
    const reportResult = document.getElementById('reportResult');
    const withHistory = nursePatients.filter(p => p.medicalHistory).length;
    reportResult.classList.remove('empty');
    reportResult.innerHTML = `
        <div class="report-dashboard">
            <div class="report-header">
                <h3><i class="fas fa-heartbeat"></i> Vitals Summary Report</h3>
                <p>Care team summary for assigned patient vital sign updates.</p>
            </div>
            <div class="report-kpi-grid">
                <div class="report-kpi-card"><span>Assigned Patients</span><strong>${nursePatients.length}</strong><small>Total patient load</small></div>
                <div class="report-kpi-card"><span>Updated Today</span><strong>${vitalsUpdatedToday}</strong><small>Vitals saved this session</small></div>
                <div class="report-kpi-card"><span>With Notes</span><strong>${withHistory}</strong><small>Patients with clinical notes</small></div>
            </div>
            <div class="report-detail-card">
                <h4><i class="fas fa-clipboard-check"></i> Vitals Workflow</h4>
                <div class="report-list">
                    <div class="report-list-row"><span>Blood pressure</span><strong>Tracked</strong></div>
                    <div class="report-list-row"><span>Temperature</span><strong>Tracked</strong></div>
                    <div class="report-list-row"><span>Weight and heart rate</span><strong>Tracked</strong></div>
                </div>
            </div>
        </div>
    `;
}

function generatePatientReport() {
    const reportResult = document.getElementById('reportResult');
    const withContact = nursePatients.filter(p => p.phoneNumber || p.email).length;
    reportResult.classList.remove('empty');
    reportResult.innerHTML = `
        <div class="report-dashboard">
            <div class="report-header">
                <h3><i class="fas fa-users"></i> Patient Activity Report</h3>
                <p>Assigned patient activity and care coordination overview.</p>
            </div>
            <div class="report-kpi-grid">
                <div class="report-kpi-card"><span>Assigned Patients</span><strong>${nursePatients.length}</strong><small>Active assignment list</small></div>
                <div class="report-kpi-card"><span>Today Appointments</span><strong>${appointments.length}</strong><small>Appointments due today</small></div>
                <div class="report-kpi-card"><span>With Contact</span><strong>${withContact}</strong><small>Reachable patient records</small></div>
            </div>
            <div class="report-detail-card">
                <h4><i class="fas fa-user-nurse"></i> Nurse Coverage</h4>
                <div class="report-list">
                    <div class="report-list-row"><span>Care role</span><strong>Vitals and monitoring</strong></div>
                    <div class="report-list-row"><span>Patient records</span><strong>Assigned only</strong></div>
                </div>
            </div>
        </div>
    `;
}

function logout() {
    api.logout().finally(() => window.location.href = '/app/login.html');
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function showToast(message, type) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${escapeHtml(message)}`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', async function() {
    const user = requireNurse();
    if (!user) return;
    setText('userName', user.name || user.fullname || user.username);
    try {
        await loadNurseData();
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
        document.getElementById('sidebar')?.classList.toggle('active');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            ['dashboardPage', 'patientsPage', 'reportsPage'].forEach(id => {
                const node = document.getElementById(id);
                if (node) node.style.display = 'none';
            });
            document.getElementById(`${page}Page`).style.display = 'block';
            const titles = { dashboard: 'Nurse Dashboard', patients: 'Assigned Patients', reports: 'Patient Reports' };
            setText('pageTitle', titles[page] || 'Nurse Dashboard');
        });
    });
});

window.openVitalsModal = openVitalsModal;
window.closeVitalsModal = closeVitalsModal;
window.searchPatients = searchPatients;
window.generateVitalsReport = generateVitalsReport;
window.generatePatientReport = generatePatientReport;
window.saveVitals = saveVitals;
window.logout = logout;
