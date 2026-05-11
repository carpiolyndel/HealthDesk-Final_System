let nursePatients = [
    { id: 'P001', name: 'Carpio, Lyndel J.', age: 22, diagnosis: 'Hypertension', bp: '130/85', temp: '36.5', weight: '65', hr: '78', lastVisit: new Date().toISOString().split('T')[0] },
    { id: 'P002', name: 'Balanquit, Junel M.', age: 23, diagnosis: 'Diabetes Type 2', bp: '120/80', temp: '36.8', weight: '68', hr: '72', lastVisit: new Date().toISOString().split('T')[0] },
    { id: 'P003', name: 'Balansag, Geraldine R.', age: 22, diagnosis: 'Respiratory Infection', bp: '125/82', temp: '38.2', weight: '62', hr: '88', lastVisit: new Date().toISOString().split('T')[0] },
    { id: 'P004', name: 'Colele, Shella Mae E.', age: 23, diagnosis: 'Arthritis', bp: '140/90', temp: '36.5', weight: '60', hr: '75', lastVisit: new Date().toISOString().split('T')[0] },
    { id: 'P005', name: 'Senobio, Denzel', age: 22, diagnosis: 'Migraine', bp: '118/78', temp: '36.5', weight: '70', hr: '70', lastVisit: new Date().toISOString().split('T')[0] },
    { id: 'P006', name: 'Dizon, Judy Marie A.', age: 23, diagnosis: 'Allergy', bp: '115/75', temp: '36.6', weight: '58', hr: '74', lastVisit: new Date().toISOString().split('T')[0] }
];

let vitalsUpdatedToday = 0;
let currentPatient = null;

function updateStats() {
    const assignedCount = document.getElementById('assignedCount');
    const vitalsToday = document.getElementById('vitalsToday');
    const todayAppointments = document.getElementById('todayAppointments');
    
    if (assignedCount) assignedCount.textContent = nursePatients.length;
    if (vitalsToday) vitalsToday.textContent = vitalsUpdatedToday;
    
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = nursePatients.filter(p => p.lastVisit === today).length;
    if (todayAppointments) todayAppointments.textContent = todayVisits;
}

function renderPatients() {
    const container = document.getElementById('patientsList');
    if (!container) return;
    
    if (nursePatients.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">No patients found</p>';
        return;
    }
    
    let html = '';
    for (let i = 0; i < nursePatients.length; i++) {
        const p = nursePatients[i];
        html += `
            <div class="patient-card" style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:16px;transition:all 0.3s;">
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                    <span style="font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(p.name)}</span>
                    <span style="background:#f1f5f9;padding:4px 10px;border-radius:20px;font-size:12px;color:#64748b;">${p.id}</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;">
                    <div style="text-align:center;padding:8px;background:#f1f5f9;border-radius:8px;">
                        <span style="font-size:11px;color:#64748b;">BP</span>
                        <div style="font-size:16px;font-weight:700;color:#0d9488;">${escapeHtml(p.bp)}</div>
                    </div>
                    <div style="text-align:center;padding:8px;background:#f1f5f9;border-radius:8px;">
                        <span style="font-size:11px;color:#64748b;">Temp</span>
                        <div style="font-size:16px;font-weight:700;color:#0d9488;">${escapeHtml(p.temp)}°C</div>
                    </div>
                    <div style="text-align:center;padding:8px;background:#f1f5f9;border-radius:8px;">
                        <span style="font-size:11px;color:#64748b;">Weight</span>
                        <div style="font-size:16px;font-weight:700;color:#0d9488;">${escapeHtml(p.weight)} kg</div>
                    </div>
                </div>
                <div style="margin:8px 0;"><i class="fas fa-stethoscope" style="color:#0d9488;"></i> <strong>Diagnosis:</strong> ${escapeHtml(p.diagnosis)}</div>
                <div style="margin:8px 0;"><i class="fas fa-heartbeat" style="color:#0d9488;"></i> <strong>Heart Rate:</strong> ${escapeHtml(p.hr)} bpm</div>
                <div style="margin:8px 0;"><i class="fas fa-calendar" style="color:#0d9488;"></i> <strong>Last Visit:</strong> ${p.lastVisit}</div>
                <button class="btn-primary" style="width:100%;margin-top:12px;" onclick="openVitalsModal('${p.id}')">Update Vitals</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

function openVitalsModal(id) {
    currentPatient = nursePatients.find(p => p.id === id);
    if (currentPatient) {
        const patientIdEl = document.getElementById('vitalPatientId');
        const patientNameEl = document.getElementById('vitalPatientName');
        const bpEl = document.getElementById('bpInput');
        const tempEl = document.getElementById('tempInput');
        const weightEl = document.getElementById('weightInput');
        const hrEl = document.getElementById('hrInput');
        const modal = document.getElementById('vitalsModal');
        
        if (patientIdEl) patientIdEl.value = currentPatient.id;
        if (patientNameEl) patientNameEl.value = currentPatient.name;
        if (bpEl) bpEl.value = currentPatient.bp;
        if (tempEl) tempEl.value = currentPatient.temp;
        if (weightEl) weightEl.value = currentPatient.weight;
        if (hrEl) hrEl.value = currentPatient.hr;
        if (modal) modal.classList.add('active');
    }
}

function closeVitalsModal() {
    const modal = document.getElementById('vitalsModal');
    const form = document.getElementById('vitalsForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
    currentPatient = null;
}

function saveVitals() {
    if (!currentPatient) return;
    
    const bpInput = document.getElementById('bpInput');
    const tempInput = document.getElementById('tempInput');
    const weightInput = document.getElementById('weightInput');
    const hrInput = document.getElementById('hrInput');
    
    if (bpInput && bpInput.value) currentPatient.bp = bpInput.value;
    if (tempInput && tempInput.value) currentPatient.temp = tempInput.value;
    if (weightInput && weightInput.value) currentPatient.weight = weightInput.value;
    if (hrInput && hrInput.value) currentPatient.hr = hrInput.value;
    
    currentPatient.lastVisit = new Date().toISOString().split('T')[0];
    vitalsUpdatedToday++;
    
    updateStats();
    renderPatients();
    closeVitalsModal();
    showToast('Vitals updated for ' + currentPatient.name, 'success');
}

function searchPatients() {
    const queryInput = document.getElementById('searchPatientsInput');
    const query = queryInput ? queryInput.value.toLowerCase() : '';
    
    if (!query) {
        renderPatients();
        return;
    }
    
    const filtered = nursePatients.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.id.toLowerCase().includes(query)
    );
    
    const container = document.getElementById('patientsList');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">No patients found</p>';
        return;
    }
    
    let html = '';
    for (let i = 0; i < filtered.length; i++) {
        const p = filtered[i];
        html += `
            <div class="patient-card" style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:16px;transition:all 0.3s;">
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                    <span style="font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(p.name)}</span>
                    <span style="background:#f1f5f9;padding:4px 10px;border-radius:20px;font-size:12px;color:#64748b;">${p.id}</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;">
                    <div style="text-align:center;padding:8px;background:#f1f5f9;border-radius:8px;">
                        <span style="font-size:11px;color:#64748b;">BP</span>
                        <div style="font-size:16px;font-weight:700;color:#0d9488;">${escapeHtml(p.bp)}</div>
                    </div>
                    <div style="text-align:center;padding:8px;background:#f1f5f9;border-radius:8px;">
                        <span style="font-size:11px;color:#64748b;">Temp</span>
                        <div style="font-size:16px;font-weight:700;color:#0d9488;">${escapeHtml(p.temp)}°C</div>
                    </div>
                    <div style="text-align:center;padding:8px;background:#f1f5f9;border-radius:8px;">
                        <span style="font-size:11px;color:#64748b;">Weight</span>
                        <div style="font-size:16px;font-weight:700;color:#0d9488;">${escapeHtml(p.weight)} kg</div>
                    </div>
                </div>
                <div style="margin:8px 0;"><i class="fas fa-stethoscope" style="color:#0d9488;"></i> <strong>Diagnosis:</strong> ${escapeHtml(p.diagnosis)}</div>
                <div style="margin:8px 0;"><i class="fas fa-heartbeat" style="color:#0d9488;"></i> <strong>Heart Rate:</strong> ${escapeHtml(p.hr)} bpm</div>
                <button class="btn-primary" style="width:100%;margin-top:12px;" onclick="openVitalsModal('${p.id}')">Update Vitals</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

function generateVitalsReport() {
    let totalBP = 0;
    let totalTemp = 0;
    let totalWeight = 0;
    let totalHR = 0;
    
    for (let i = 0; i < nursePatients.length; i++) {
        totalBP += parseInt(nursePatients[i].bp.split('/')[0]);
        totalTemp += parseFloat(nursePatients[i].temp);
        totalWeight += parseFloat(nursePatients[i].weight);
        totalHR += parseFloat(nursePatients[i].hr);
    }
    
    const avgBP = totalBP / nursePatients.length;
    const avgTemp = totalTemp / nursePatients.length;
    const avgWeight = totalWeight / nursePatients.length;
    const avgHR = totalHR / nursePatients.length;
    
    const reportDiv = document.getElementById('reportResult');
    if (reportDiv) {
        reportDiv.innerHTML = `
            <div style="background:white;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <div style="border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
                    <h3 style="color:#0f172a;font-size:20px;margin:0;display:flex;align-items:center;gap:10px;">
                        <i class="fas fa-heartbeat" style="color:#0d9488;"></i> Vitals Summary Report
                    </h3>
                    <p style="color:#64748b;font-size:13px;margin:8px 0 0;">Generated on ${new Date().toLocaleString()}</p>
                </div>
                
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
                    <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                        <span style="font-size:28px;font-weight:700;color:#0d9488;">${nursePatients.length}</span>
                        <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Total Patients</p>
                    </div>
                    <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                        <span style="font-size:28px;font-weight:700;color:#0d9488;">${avgBP.toFixed(0)}</span>
                        <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Avg Systolic BP</p>
                    </div>
                    <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                        <span style="font-size:28px;font-weight:700;color:#0d9488;">${avgTemp.toFixed(1)}°C</span>
                        <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Avg Temperature</p>
                    </div>
                    <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                        <span style="font-size:28px;font-weight:700;color:#0d9488;">${avgWeight.toFixed(1)}</span>
                        <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Avg Weight (kg)</p>
                    </div>
                </div>
                
                <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
                    <h4 style="color:#0f172a;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-chart-line" style="color:#0d9488;"></i> Key Metrics
                    </h4>
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                        <div><span style="color:#64748b;">Average Heart Rate:</span> <strong style="color:#0f172a;">${avgHR.toFixed(0)} bpm</strong></div>
                        <div><span style="color:#64748b;">Vitals Updated Today:</span> <strong style="color:#0f172a;">${vitalsUpdatedToday}</strong></div>
                        <div><span style="color:#64748b;">Most Common Diagnosis:</span> <strong style="color:#0f172a;">${getMostCommonDiagnosis()}</strong></div>
                        <div><span style="color:#64748b;">Patient Age Range:</span> <strong style="color:#0f172a;">22-23 years</strong></div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color:#0f172a;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-list" style="color:#0d9488;"></i> Detailed Patient Vitals
                    </h4>
                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f1f5f9;">
                                    <th style="padding:12px;text-align:left;font-size:13px;color:#0f172a;">Patient ID</th>
                                    <th style="padding:12px;text-align:left;font-size:13px;color:#0f172a;">Name</th>
                                    <th style="padding:12px;text-align:left;font-size:13px;color:#0f172a;">BP</th>
                                    <th style="padding:12px;text-align:left;font-size:13px;color:#0f172a;">Temp</th>
                                    <th style="padding:12px;text-align:left;font-size:13px;color:#0f172a;">Weight</th>
                                    <th style="padding:12px;text-align:left;font-size:13px;color:#0f172a;">HR</th>
                                    <th style="padding:12px;text-align:left;font-size:13px;color:#0f172a;">Last Visit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${nursePatients.map(p => `
                                    <tr style="border-bottom:1px solid #e2e8f0;">
                                        <td style="padding:12px;font-size:13px;">${p.id}</td>
                                        <td style="padding:12px;font-size:13px;font-weight:500;">${p.name}</td>
                                        <td style="padding:12px;font-size:13px;">${p.bp}</td>
                                        <td style="padding:12px;font-size:13px;">${p.temp}°C</td>
                                        <td style="padding:12px;font-size:13px;">${p.weight} kg</td>
                                        <td style="padding:12px;font-size:13px;">${p.hr} bpm</td>
                                        <td style="padding:12px;font-size:13px;">${p.lastVisit}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
                    <button class="btn-primary" onclick="exportVitalsReport()" style="padding:8px 20px;">
                        <i class="fas fa-download"></i> Export Report
                    </button>
                </div>
            </div>
        `;
    }
}

function getMostCommonDiagnosis() {
    const diagnosisCount = {};
    for (let i = 0; i < nursePatients.length; i++) {
        const diag = nursePatients[i].diagnosis;
        diagnosisCount[diag] = (diagnosisCount[diag] || 0) + 1;
    }
    let maxCount = 0;
    let mostCommon = '';
    for (const diag in diagnosisCount) {
        if (diagnosisCount[diag] > maxCount) {
            maxCount = diagnosisCount[diag];
            mostCommon = diag;
        }
    }
    return mostCommon || 'N/A';
}

function generatePatientReport() {
    const today = new Date().toISOString().split('T')[0];
    const activeToday = nursePatients.filter(p => p.lastVisit === today).length;
    const last7Days = nursePatients.filter(p => new Date(p.lastVisit) > new Date(Date.now() - 7 * 86400000)).length;
    
    const reportDiv = document.getElementById('reportResult');
    if (reportDiv) {
        reportDiv.innerHTML = `
            <div style="background:white;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <div style="border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
                    <h3 style="color:#0f172a;font-size:20px;margin:0;display:flex;align-items:center;gap:10px;">
                        <i class="fas fa-users" style="color:#0d9488;"></i> Patient Activity Report
                    </h3>
                    <p style="color:#64748b;font-size:13px;margin:8px 0 0;">Generated on ${new Date().toLocaleString()}</p>
                </div>
                
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
                    <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                        <span style="font-size:28px;font-weight:700;color:#0d9488;">${nursePatients.length}</span>
                        <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Total Patients</p>
                    </div>
                    <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                        <span style="font-size:28px;font-weight:700;color:#0d9488;">${activeToday}</span>
                        <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Visited Today</p>
                    </div>
                    <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
                        <span style="font-size:28px;font-weight:700;color:#0d9488;">${last7Days}</span>
                        <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Last 7 Days</p>
                    </div>
                </div>
                
                <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
                    <h4 style="color:#0f172a;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-chart-pie" style="color:#0d9488;"></i> Activity Summary
                    </h4>
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                        <div><span style="color:#64748b;">Active Percentage:</span> <strong style="color:#0f172a;">${Math.round((activeToday / nursePatients.length) * 100)}%</strong></div>
                        <div><span style="color:#64748b;">7-Day Activity:</span> <strong style="color:#0f172a;">${Math.round((last7Days / nursePatients.length) * 100)}%</strong></div>
                        <div><span style="color:#64748b;">Vitals Updated Today:</span> <strong style="color:#0f172a;">${vitalsUpdatedToday}</strong></div>
                        <div><span style="color:#64748b;">Average Age:</span> <strong style="color:#0f172a;">${(nursePatients.reduce((sum,p)=>sum+p.age,0)/nursePatients.length).toFixed(1)} years</strong></div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color:#0f172a;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-list-alt" style="color:#0d9488;"></i> Patient Directory
                    </h4>
                    ${nursePatients.map(p => `
                        <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:12px;border-left:3px solid #0d9488;">
                            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;margin-bottom:8px;">
                                <strong style="color:#0f172a;">${p.id} - ${p.name}</strong>
                                <span style="background:#e2e8f0;padding:2px 8px;border-radius:20px;font-size:11px;color:#64748b;">Last Visit: ${p.lastVisit}</span>
                            </div>
                            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px;">
                                <span style="font-size:13px;"><i class="fas fa-stethoscope"></i> ${p.diagnosis}</span>
                                <span style="font-size:13px;"><i class="fas fa-heartbeat"></i> HR: ${p.hr} bpm</span>
                                <span style="font-size:13px;"><i class="fas fa-tachometer-alt"></i> BP: ${p.bp}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
                    <button class="btn-primary" onclick="exportPatientReport()" style="padding:8px 20px;">
                        <i class="fas fa-download"></i> Export Report
                    </button>
                </div>
            </div>
        `;
    }
}

function exportVitalsReport() {
    const data = nursePatients.map(p => ({
        'Patient ID': p.id,
        'Name': p.name,
        'Age': p.age,
        'Diagnosis': p.diagnosis,
        'Blood Pressure': p.bp,
        'Temperature': p.temp + '°C',
        'Weight': p.weight + ' kg',
        'Heart Rate': p.hr + ' bpm',
        'Last Visit': p.lastVisit
    }));
    downloadCSV(data, 'vitals_report');
}

function exportPatientReport() {
    const data = nursePatients.map(p => ({
        'Patient ID': p.id,
        'Name': p.name,
        'Age': p.age,
        'Diagnosis': p.diagnosis,
        'Last Visit': p.lastVisit
    }));
    downloadCSV(data, 'patient_activity_report');
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'NURSE') {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
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
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if (user) {
        const userNameSpan = document.getElementById('userName');
        if (userNameSpan) userNameSpan.textContent = user.name;
    }
    
    updateStats();
    renderPatients();
    
    const sidebarSearch = document.getElementById('sidebarSearch');
    if (sidebarSearch) {
        sidebarSearch.addEventListener('input', function(e) {
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
    }
    
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('active');
        });
    }
    
    const searchInput = document.getElementById('searchPatientsInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchPatients();
        });
    }
    
    const navItems = document.querySelectorAll('.nav-item');
    for (let i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            for (let j = 0; j < navItems.length; j++) {
                navItems[j].classList.remove('active');
            }
            this.classList.add('active');
            
            const dashboardPage = document.getElementById('dashboardPage');
            const patientsPage = document.getElementById('patientsPage');
            const reportsPage = document.getElementById('reportsPage');
            const pageTitle = document.getElementById('pageTitle');
            
            if (dashboardPage) dashboardPage.style.display = 'none';
            if (patientsPage) patientsPage.style.display = 'none';
            if (reportsPage) reportsPage.style.display = 'none';
            
            if (page === 'dashboard' && dashboardPage) dashboardPage.style.display = 'block';
            if (page === 'patients' && patientsPage) patientsPage.style.display = 'block';
            if (page === 'reports' && reportsPage) reportsPage.style.display = 'block';
            
            if (pageTitle) {
                if (page === 'dashboard') pageTitle.innerText = 'Nurse Dashboard';
                else if (page === 'patients') pageTitle.innerText = 'Assigned Patients';
                else if (page === 'reports') pageTitle.innerText = 'Patient Reports';
            }
            
            if (page === 'patients') renderPatients();
        });
    }
});

window.openVitalsModal = openVitalsModal;
window.closeVitalsModal = closeVitalsModal;
window.searchPatients = searchPatients;
window.generateVitalsReport = generateVitalsReport;
window.generatePatientReport = generatePatientReport;
window.logout = logout;
window.exportVitalsReport = exportVitalsReport;
window.exportPatientReport = exportPatientReport;