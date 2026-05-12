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
        <div class="patient-card" style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;gap:12px;">
                <span style="font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(fullName(p))}</span>
                <span style="background:#f1f5f9;padding:4px 10px;border-radius:20px;font-size:12px;color:#64748b;">${escapeHtml(p.id)}</span>
            </div>
            <div style="margin:8px 0;"><i class="fas fa-venus-mars" style="color:#0d9488;"></i> <strong>Gender:</strong> ${escapeHtml(p.gender || 'N/A')}</div>
            <div style="margin:8px 0;"><i class="fas fa-calendar" style="color:#0d9488;"></i> <strong>Age:</strong> ${p.age ?? 'N/A'}</div>
            <div style="margin:8px 0;"><i class="fas fa-notes-medical" style="color:#0d9488;"></i> <strong>History:</strong> ${escapeHtml((p.medicalHistory || 'No notes').substring(0, 120))}</div>
            <button class="btn-primary" style="width:100%;margin-top:12px;" onclick="openVitalsModal('${p.id}')">Update Vitals</button>
        </div>
    `).join('') : '<p style="text-align:center;padding:40px;">No assigned patients found</p>';
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
    document.getElementById('reportResult').innerHTML = `
        <div style="background:white;border-radius:12px;padding:24px;">
            <h3><i class="fas fa-heartbeat" style="color:#0d9488;"></i> Vitals Summary Report</h3>
            <p>Assigned patients: <strong>${nursePatients.length}</strong></p>
            <p>Vitals updated today: <strong>${vitalsUpdatedToday}</strong></p>
        </div>
    `;
}

function generatePatientReport() {
    document.getElementById('reportResult').innerHTML = `
        <div style="background:white;border-radius:12px;padding:24px;">
            <h3><i class="fas fa-users" style="color:#0d9488;"></i> Patient Activity Report</h3>
            <p>Assigned patients: <strong>${nursePatients.length}</strong></p>
            <p>Today's appointments: <strong>${appointments.length}</strong></p>
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
