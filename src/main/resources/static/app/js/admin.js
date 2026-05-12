// ============ ADMIN.JS - COMPLETE VERSION ============

let systemUsers = [];
let archivedUsers = [];
let guestInquiries = [];
let currentPage = 1;
let rowsPerPage = 10;
let currentFilter = '';
let currentInquiryFilter = 'all';
let usingBackend = false;

// ============ UTILITY FUNCTIONS ============

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

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentUser() {
    const stored = localStorage.getItem('currentUser');
    if (stored) return JSON.parse(stored);
    return null;
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user || user.role !== 'ADMIN' || (typeof api !== 'undefined' && !api.getToken())) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function defaultPasswordForRole(role, username) {
    const normalizedRole = (role || '').toUpperCase();
    const normalizedUsername = (username || '').toLowerCase();
    if (normalizedUsername === 'admin' || normalizedRole === 'ADMIN') return 'admin123';
    if (normalizedUsername === 'doctor' || normalizedRole === 'DOCTOR') return 'doctor123';
    if (normalizedUsername === 'nurse' || normalizedRole === 'NURSE') return 'nurse123';
    if (normalizedUsername === 'staff' || normalizedRole === 'STAFF') return 'staff123';
    return '';
}

function normalizeUser(user) {
    return {
        id: user.id,
        username: user.username,
        fullname: user.fullname || user.name || '',
        name: user.fullname || user.name || '',
        email: user.email || '',
        role: (user.role || 'STAFF').toUpperCase(),
        status: user.status || 'Active',
        password: user.password || defaultPasswordForRole(user.role, user.username),
        lastLogin: user.lastLogin || 'Never',
        createdAt: user.createdAt || new Date().toISOString()
    };
}

// ============ DATA LOADING ============

async function loadData() {
    const storedUsers = localStorage.getItem('systemUsers');
    const storedArchived = localStorage.getItem('archivedUsers');
    const storedInquiries = localStorage.getItem('guestInquiries');
    
    if (typeof api !== 'undefined' && api.getToken()) {
        try {
            systemUsers = (await api.getUsers(0, 500, '')).map(normalizeUser);
            localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
        } catch (error) {
            showToast(error.message, 'error');
            systemUsers = storedUsers ? JSON.parse(storedUsers).map(normalizeUser) : [];
        }
    } else if (storedUsers) {
        systemUsers = JSON.parse(storedUsers).map(normalizeUser);
    } else {
        systemUsers = [
            { id: 1, username: 'admin', fullname: 'Admin User', name: 'Admin User', email: 'admin@healthdesk.com', role: 'ADMIN', status: 'Active', password: 'admin123', lastLogin: new Date().toLocaleDateString(), createdAt: new Date().toISOString() },
            { id: 2, username: 'doctor', fullname: 'Dr. James Cruz', name: 'Dr. James Cruz', email: 'doctor@healthdesk.com', role: 'DOCTOR', status: 'Active', password: 'doctor123', lastLogin: new Date().toLocaleDateString(), createdAt: new Date().toISOString() },
            { id: 3, username: 'nurse', fullname: 'Anna Reyes', name: 'Anna Reyes', email: 'nurse@healthdesk.com', role: 'NURSE', status: 'Active', password: 'nurse123', lastLogin: new Date().toLocaleDateString(), createdAt: new Date().toISOString() },
            { id: 4, username: 'staff', fullname: 'Maria Santos', name: 'Maria Santos', email: 'staff@healthdesk.com', role: 'STAFF', status: 'Active', password: 'staff123', lastLogin: new Date().toLocaleDateString(), createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    }
    
    if (storedArchived) {
        archivedUsers = JSON.parse(storedArchived);
    } else {
        archivedUsers = [];
        localStorage.setItem('archivedUsers', JSON.stringify(archivedUsers));
    }
    
    if (storedInquiries) {
        guestInquiries = JSON.parse(storedInquiries);
    } else {
        guestInquiries = [];
        localStorage.setItem('guestInquiries', JSON.stringify(guestInquiries));
    }
}

function saveToStorage() {
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    localStorage.setItem('archivedUsers', JSON.stringify(archivedUsers));
    localStorage.setItem('guestInquiries', JSON.stringify(guestInquiries));
}

// ============ DASHBOARD FUNCTIONS ============

function updateStats() {
    document.getElementById('totalUsers').textContent = systemUsers.length;
    document.getElementById('totalDoctors').textContent = systemUsers.filter(u => u.role === 'DOCTOR').length;
    document.getElementById('totalNurses').textContent = systemUsers.filter(u => u.role === 'NURSE').length;
    document.getElementById('totalStaff').textContent = systemUsers.filter(u => u.role === 'STAFF').length;
}

function renderRecentUsersTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    let filtered = [...systemUsers];
    if (currentFilter) {
        filtered = filtered.filter(u =>
            u.username.toLowerCase().includes(currentFilter) ||
            u.fullname.toLowerCase().includes(currentFilter) ||
            (u.email && u.email.toLowerCase().includes(currentFilter)) ||
            (u.role && u.role.toLowerCase().includes(currentFilter)) ||
            (u.status && u.status.toLowerCase().includes(currentFilter))
        );
    }
    const start = (currentPage - 1) * rowsPerPage;
    const pageUsers = filtered.slice(start, start + rowsPerPage);
    
    if (pageUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No users found</td></tr>';
    } else {
        tbody.innerHTML = pageUsers.map(u => `
            <tr>
                <td>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(u.fullname)}</td>
                <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
                <td class="status-${u.status.toLowerCase()}">${u.status}</td>
            </tr>
        `).join('');
    }
    
    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    let paginationHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    document.getElementById('pagination').innerHTML = paginationHtml;
}

function goToPage(page) { 
    currentPage = page; 
    renderRecentUsersTable(); 
}

function initCharts() {
    new Chart(document.getElementById('areaChart'), {
        type: 'line',
        data: { 
            labels: ['Week1', 'Week2', 'Week3', 'Week4'], 
            datasets: [{ 
                label: 'New Users', 
                data: [5, 8, 12, 6], 
                borderColor: '#0d9488', 
                fill: true, 
                backgroundColor: 'rgba(13,148,136,0.1)' 
            }] 
        }
    });
    
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: { 
            labels: ['Admin', 'Doctor', 'Nurse', 'Staff'], 
            datasets: [{ 
                label: 'Users by Role', 
                data: [
                    systemUsers.filter(u => u.role === 'ADMIN').length,
                    systemUsers.filter(u => u.role === 'DOCTOR').length,
                    systemUsers.filter(u => u.role === 'NURSE').length,
                    systemUsers.filter(u => u.role === 'STAFF').length
                ], 
                backgroundColor: '#0d9488' 
            }] 
        }
    });
}

// ============ USER MANAGEMENT ============

function renderUsers() {
    const tbody = document.getElementById('usersList');
    if (!tbody) return;
    
    if (systemUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = systemUsers.map(u => `
        <tr>
            <td>${escapeHtml(u.username)}</td>
            <td>${escapeHtml(u.fullname)}</td>
            <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
            <td class="status-${u.status.toLowerCase()}">${u.status}</td>
            <td><span style="font-family:monospace;">••••••••</span></td>
            <td>
                <button class="btn-edit" onclick="editUser(${u.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-archive" onclick="archiveUser(${u.id})"><i class="fas fa-archive"></i> Archive</button>
                <button class="btn-danger" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i> Delete</button>
                <button class="btn-warning" onclick="openResetPasswordModal(${u.id})"><i class="fas fa-key"></i> Reset</button>
            </td>
        </tr>
    `).join('');
}

function renderArchive() {
    const tbody = document.getElementById('archiveList');
    if (!tbody) return;
    
    if (archivedUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No archived users</td></tr>';
        return;
    }
    
    tbody.innerHTML = archivedUsers.map(u => `
        <tr>
            <td>${escapeHtml(u.username)}</td>
            <td>${escapeHtml(u.fullname)}</td>
            <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
            <td>${u.archivedDate || 'Unknown'}</td>
            <td><button class="btn-danger" onclick="permanentDelete(${u.id})"><i class="fas fa-trash"></i> Delete</button></td>
        </tr>
    `).join('');
}

function openUserModal() {
    document.getElementById('userId').value = '';
    document.getElementById('username').value = '';
    document.getElementById('fullname').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('password').value = '';
    document.getElementById('passwordHint').innerHTML = '<i class="fas fa-info-circle"></i> Required for new user (min 6 characters)';
    document.getElementById('modalTitle').innerText = 'Add New User';
    document.getElementById('role').value = 'STAFF';
    document.getElementById('status').value = 'Active';
    document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function editUser(id) {
    const u = systemUsers.find(u => u.id === id);
    if (u) {
        document.getElementById('userId').value = u.id;
        document.getElementById('username').value = u.username;
        document.getElementById('fullname').value = u.fullname;
        document.getElementById('userEmail').value = u.email || '';
        document.getElementById('password').value = '';
        document.getElementById('passwordHint').innerHTML = '<i class="fas fa-info-circle"></i> Leave blank to keep current password';
        document.getElementById('modalTitle').innerText = 'Edit User';
        document.getElementById('role').value = u.role;
        document.getElementById('status').value = u.status;
        document.getElementById('userModal').classList.add('active');
    }
}

function backendUserToLocal(user, password, status = 'Active') {
    return normalizeUser({
        id: user.id,
        username: user.username,
        fullname: user.fullName || user.fullname || user.name,
        name: user.fullName || user.fullname || user.name,
        email: user.email,
        role: user.role,
        status,
        password,
        lastLogin: 'Never',
        createdAt: new Date().toISOString()
    });
}

async function saveUser() {
    const id = document.getElementById('userId').value;
    const username = document.getElementById('username').value.trim();
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const status = document.getElementById('status').value;
    
    if (!username || !fullname) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (email && !validateEmail(email)) {
        showToast('Invalid email format', 'error');
        return;
    }
    
    if (id) {
        // EDIT EXISTING USER
        const index = systemUsers.findIndex(u => String(u.id) === String(id));
        if (index !== -1) {
            if (typeof api !== 'undefined' && api.getToken()) {
                try {
                    const saved = await api.updateUser(id, {
                        username,
                        fullName: fullname,
                        email,
                        password: password || undefined,
                        role: role.toUpperCase()
                    });
                    systemUsers[index] = {
                        ...systemUsers[index],
                        ...backendUserToLocal(saved, password || systemUsers[index].password, status)
                    };
                    showToast('User updated in database successfully', 'success');
                } catch (error) {
                    showToast(error.message, 'error');
                    return;
                }
            } else {
            systemUsers[index] = { 
                ...systemUsers[index], 
                username, 
                fullname: fullname,
                name: fullname,
                email, 
                role, 
                status,
                password: password || systemUsers[index].password
            };
            showToast('User updated successfully', 'success');
            }
        }
    } else {
        // CREATE NEW USER
        if (!password) {
            showToast('Password is required for new user', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Check if username already exists
        if (systemUsers.some(u => u.username === username)) {
            showToast(`Username "${username}" already exists!`, 'error');
            return;
        }
        
        if (typeof api !== 'undefined' && api.getToken()) {
            try {
                const saved = await api.createUser({
                    username,
                    fullName: fullname,
                    email,
                    password,
                    role: role.toUpperCase()
                });
                systemUsers.push(backendUserToLocal(saved, password, status));
                showToast(`User "${username}" saved to database successfully!`, 'success');
            } catch (error) {
                showToast(error.message, 'error');
                return;
            }
        } else {
            showToast('Please login again as admin so the app can save users to the database.', 'error');
            return;
        }
    }
    
    saveToStorage();
    updateStats();
    renderUsers();
    renderRecentUsersTable();
    closeUserModal();
}

// ============ PASSWORD RESET ============

function openResetPasswordModal(id) {
    const user = systemUsers.find(u => u.id === id);
    if (user) {
        document.getElementById('resetUserId').value = user.id;
        document.getElementById('resetUserName').value = user.username;
        document.getElementById('resetPasswordModal').classList.add('active');
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('passwordMatchError').innerHTML = '';
    }
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').classList.remove('active');
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordMatchError').innerHTML = '';
}

function resetPassword() {
    const userId = parseInt(document.getElementById('resetUserId').value);
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword) {
        document.getElementById('passwordMatchError').innerHTML = 'Please enter a new password';
        return;
    }
    if (newPassword !== confirmPassword) {
        document.getElementById('passwordMatchError').innerHTML = 'Passwords do not match';
        return;
    }
    if (newPassword.length < 6) {
        document.getElementById('passwordMatchError').innerHTML = 'Password must be at least 6 characters';
        return;
    }
    
    const index = systemUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
        systemUsers[index].password = newPassword;
        saveToStorage();
        showToast(`Password reset for "${systemUsers[index].username}"`, 'success');
        closeResetPasswordModal();
        renderUsers();
    }
}

// ============ ARCHIVE & DELETE ============

async function archiveUser(id) {
    const u = systemUsers.find(u => u.id === id);
    if (u && confirm(`Archive user "${u.username}"?`)) {
        if (typeof api !== 'undefined' && api.getToken()) {
            try {
                await api.archiveUser(id);
                await loadData();
            } catch (error) {
                showToast(error.message, 'error');
                return;
            }
        } else {
            systemUsers = systemUsers.filter(u => u.id !== id);
            archivedUsers.push({
                ...u,
                archivedDate: new Date().toISOString().split('T')[0]
            });
        }
        saveToStorage();
        updateStats();
        renderUsers();
        renderArchive();
        renderRecentUsersTable();
        showToast(`User "${u.username}" archived`, 'success');
    }
}

async function deleteUser(id) {
    const u = systemUsers.find(u => u.id === id);
    if (u && confirm(`Permanently delete "${u.username}"? This cannot be undone.`)) {
        if (typeof api !== 'undefined' && api.getToken()) {
            try {
                await api.deleteUser(id);
                await loadData();
            } catch (error) {
                showToast(error.message, 'error');
                return;
            }
        } else {
            systemUsers = systemUsers.filter(u => u.id !== id);
        }
        saveToStorage();
        updateStats();
        renderUsers();
        renderRecentUsersTable();
        showToast(`User "${u.username}" deleted permanently`, 'success');
    }
}

function permanentDelete(id) {
    const u = archivedUsers.find(u => u.id === id);
    if (u && confirm(`Permanently delete "${u.username}" from archive?`)) {
        archivedUsers = archivedUsers.filter(u => u.id !== id);
        saveToStorage();
        renderArchive();
        showToast(`User "${u.username}" removed from archive`, 'success');
    }
}

// ============ SEARCH FUNCTIONS ============

function searchUsers() {
    const query = document.getElementById('searchUsersInput').value.toLowerCase();
    const tbody = document.getElementById('usersList');
    
    if (!query) { 
        renderUsers(); 
        return; 
    }
    
    const filtered = systemUsers.filter(u => 
        u.username.toLowerCase().includes(query) || 
        u.fullname.toLowerCase().includes(query) || 
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.role && u.role.toLowerCase().includes(query)) ||
        (u.status && u.status.toLowerCase().includes(query))
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td>${escapeHtml(u.username)}</td>
            <td>${escapeHtml(u.fullname)}</td>
            <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
            <td class="status-${u.status.toLowerCase()}">${u.status}</td>
            <td><span style="font-family:monospace;">••••••••</span></td>
            <td>
                <button class="btn-edit" onclick="editUser(${u.id})">Edit</button>
                <button class="btn-archive" onclick="archiveUser(${u.id})">Archive</button>
                <button class="btn-danger" onclick="deleteUser(${u.id})">Delete</button>
                <button class="btn-warning" onclick="openResetPasswordModal(${u.id})">Reset</button>
            </td>
        </tr>
    `).join('');
}

function searchArchive() {
    const query = document.getElementById('searchArchiveInput').value.toLowerCase();
    const tbody = document.getElementById('archiveList');
    
    if (!query) { 
        renderArchive(); 
        return; 
    }
    
    const filtered = archivedUsers.filter(u => 
        u.username.toLowerCase().includes(query) || 
        u.fullname.toLowerCase().includes(query) || 
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.role && u.role.toLowerCase().includes(query))
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No archived users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td>${escapeHtml(u.username)}</td>
            <td>${escapeHtml(u.fullname)}</td>
            <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
            <td>${u.archivedDate || 'Unknown'}</td>
            <td><button class="btn-danger" onclick="permanentDelete(${u.id})">Delete</button></td>
        </tr>
    `).join('');
}

function searchRecentUsers() {
    currentFilter = document.getElementById('tableSearch').value.toLowerCase();
    currentPage = 1;
    renderRecentUsersTable();
}

function changeEntries() {
    rowsPerPage = parseInt(document.getElementById('entriesSelect').value);
    currentPage = 1;
    renderRecentUsersTable();
}

// ============ CONTACT INQUIRIES ============

function renderInquiries() {
    const container = document.getElementById('inquiriesList');
    const noInquiriesDiv = document.getElementById('noInquiries');
    if (!container) return;
    
    let filtered = [...guestInquiries];
    if (currentInquiryFilter !== 'all') {
        filtered = filtered.filter(i => i.status === currentInquiryFilter);
    }
    
    if (filtered.length === 0) {
        container.style.display = 'none';
        if (noInquiriesDiv) noInquiriesDiv.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    if (noInquiriesDiv) noInquiriesDiv.style.display = 'none';
    
    container.innerHTML = filtered.map(inquiry => `
        <div class="inquiry-card">
            <div class="inquiry-header">
                <div class="inquiry-name">
                    <i class="fas fa-user"></i> ${escapeHtml(inquiry.name)} 
                    <span class="inquiry-status status-${inquiry.status === 'replied' ? 'replied' : 'pending'}">
                        ${inquiry.status === 'replied' ? 'Replied' : 'Pending'}
                    </span>
                </div>
                <div class="inquiry-date"><i class="fas fa-calendar"></i> ${inquiry.date}</div>
            </div>
            <div class="inquiry-subject"><i class="fas fa-tag"></i> ${escapeHtml(inquiry.subject || 'General Inquiry')}</div>
            <div class="inquiry-message">${escapeHtml(inquiry.message)}</div>
            <div class="inquiry-contact">
                <span><i class="fas fa-envelope"></i> ${escapeHtml(inquiry.email)}</span>
                ${inquiry.phone ? `<span><i class="fas fa-phone"></i> ${escapeHtml(inquiry.phone)}</span>` : ''}
            </div>
            ${inquiry.replyMessage ? `
                <div class="inquiry-reply" style="margin-top: 12px; padding: 10px; background: #dcfce7; border-radius: 8px;">
                    <strong><i class="fas fa-reply"></i> Admin Reply:</strong>
                    <p style="margin-top: 5px; font-size: 13px;">${escapeHtml(inquiry.replyMessage)}</p>
                    <small style="color: #666;">Replied on: ${inquiry.repliedAt}</small>
                </div>
            ` : ''}
            <div style="display: flex; gap: 8px; margin-top: 12px;">
                ${inquiry.status !== 'replied' ? `
                    <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="openReplyModal(${inquiry.id}, '${escapeHtml(inquiry.name)}', '${escapeHtml(inquiry.email)}', '${escapeHtml(inquiry.message).replace(/'/g, "\\'")}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                ` : ''}
                <button class="btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="deleteInquiry(${inquiry.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openReplyModal(inquiryId, guestName, guestEmail, guestMessage) {
    const modal = document.getElementById('replyModal');
    document.getElementById('replyInquiryId').value = inquiryId;
    document.getElementById('replyToName').value = guestName;
    document.getElementById('replyToEmail').value = guestEmail;
    document.getElementById('replyOriginalMessage').value = guestMessage;
    document.getElementById('replyMessage').value = '';
    modal.classList.add('active');
}

function closeReplyModal() {
    document.getElementById('replyModal').classList.remove('active');
}

function sendReply() {
    const inquiryId = parseInt(document.getElementById('replyInquiryId').value);
    const guestName = document.getElementById('replyToName').value;
    const guestEmail = document.getElementById('replyToEmail').value;
    const replyMessage = document.getElementById('replyMessage').value.trim();
    
    if (!replyMessage) {
        showToast('Please enter a reply message', 'error');
        return;
    }
    
    const adminUser = getCurrentUser();
    const adminName = adminUser ? (adminUser.name || adminUser.fullname || 'Admin') : 'HealthDesk Admin';
    
    console.log('========================================');
    console.log('📧 SENDING REPLY EMAIL (DEMO MODE)');
    console.log('To:', guestEmail);
    console.log('Subject: Re: HealthDesk Inquiry');
    console.log(`Message: 
Dear ${guestName},

Thank you for contacting HealthDesk Clinic.

${replyMessage}

Best regards,
${adminName}
HealthDesk Clinic
Cawayan, Catarman, Northern Samar
Phone: 09486729942
Email: healthdesk.info1@gmail.com`);
    console.log('========================================');
    
    const index = guestInquiries.findIndex(i => i.id === inquiryId);
    if (index !== -1) {
        guestInquiries[index].status = 'replied';
        guestInquiries[index].repliedAt = new Date().toLocaleString();
        guestInquiries[index].replyMessage = replyMessage;
        guestInquiries[index].repliedBy = adminName;
        saveToStorage();
        renderInquiries();
        showToast(`Reply sent to ${guestEmail} (Demo - check console for email content)`, 'success');
    }
    
    closeReplyModal();
}

function deleteInquiry(id) {
    if (confirm('Delete this inquiry?')) {
        guestInquiries = guestInquiries.filter(i => i.id !== id);
        saveToStorage();
        renderInquiries();
        showToast('Inquiry deleted', 'success');
    }
}

// ============ REPORTS ============

function generateUserReport() {
    document.getElementById('reportResult').innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h3><i class="fas fa-users"></i> User Report</h3>
                <p>Summary of system users and account activity for administrators.</p>
            </div>
            <div class="stats-cards">
                <div class="stat-item">
                    <div class="stat-number">${systemUsers.length}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${systemUsers.filter(u => u.role === 'ADMIN').length}</div>
                    <div class="stat-label">Admins</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${systemUsers.filter(u => u.role === 'DOCTOR').length}</div>
                    <div class="stat-label">Doctors</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${systemUsers.filter(u => u.role === 'NURSE').length}</div>
                    <div class="stat-label">Nurses</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${systemUsers.filter(u => u.role === 'STAFF').length}</div>
                    <div class="stat-label">Staff</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${archivedUsers.length}</div>
                    <div class="stat-label">Archived Users</div>
                </div>
            </div>
            <div class="role-distribution">
                <div class="role-item">
                    <span>Guest Inquiries</span>
                    <strong>${guestInquiries.length}</strong>
                </div>
                <div class="role-item">
                    <span>Active System Since</span>
                    <strong>March 6, 2026</strong>
                </div>
            </div>
            <div class="report-actions">
                <button class="btn-primary" onclick="exportUserReport()"><i class="fas fa-download"></i> Export CSV</button>
            </div>
        </div>
    `;
}

function generateActivityReport() {
    const activeUsers = systemUsers.filter(u => u.status === 'Active').length;
    const inactiveUsers = systemUsers.filter(u => u.status === 'Inactive').length;
    const pendingInquiries = guestInquiries.filter(i => i.status === 'pending').length;
    const repliedInquiries = guestInquiries.filter(i => i.status === 'replied').length;
    
    document.getElementById('reportResult').innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h3><i class="fas fa-chart-line"></i> Activity Report</h3>
                <p>Activity overview for users and guest interactions across the system.</p>
            </div>
            <div class="stats-cards">
                <div class="stat-item">
                    <div class="stat-number">${activeUsers}</div>
                    <div class="stat-label">Active Users</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${inactiveUsers}</div>
                    <div class="stat-label">Inactive Users</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${pendingInquiries}</div>
                    <div class="stat-label">Pending Inquiries</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${repliedInquiries}</div>
                    <div class="stat-label">Replied Inquiries</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${archivedUsers.length}</div>
                    <div class="stat-label">Archived Records</div>
                </div>
            </div>
            <div class="role-distribution">
                <div class="role-item">
                    <span>System Uptime</span>
                    <strong>Stable</strong>
                </div>
                <div class="role-item">
                    <span>Data Refresh</span>
                    <strong>Live</strong>
                </div>
            </div>
            <div class="report-actions">
                <button class="btn-primary" onclick="printSection('reportResult')"><i class="fas fa-print"></i> Print Current Report</button>
            </div>
        </div>
    `;
}

function exportUserReport() {
    const data = systemUsers.map(u => ({ 
        Username: u.username, 
        Name: u.fullname, 
        Email: u.email, 
        Role: u.role, 
        Status: u.status,
        Created: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'
    }));
    
    if (data.length === 0) {
        showToast('No data to export', 'error');
        return;
    }
    
    let csv = Object.keys(data[0]).join(',') + '\n';
    csv += data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported successfully', 'success');
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', async function() {
    const user = checkAuth();
    if (user) {
        document.getElementById('userName').textContent = user.name || user.fullname;
    }
    
    await loadData();
    updateStats();
    renderUsers();
    renderArchive();
    renderRecentUsersTable();
    renderInquiries();
    initCharts();
    
    // Event Listeners
    document.getElementById('addUserBtn')?.addEventListener('click', openUserModal);
    document.getElementById('closeUserModalBtn')?.addEventListener('click', closeUserModal);
    document.getElementById('cancelUserBtn')?.addEventListener('click', closeUserModal);
    document.getElementById('closeResetModalBtn')?.addEventListener('click', closeResetPasswordModal);
    document.getElementById('cancelResetBtn')?.addEventListener('click', closeResetPasswordModal);
    document.getElementById('resetPasswordForm')?.addEventListener('submit', (e) => { e.preventDefault(); resetPassword(); });
    document.getElementById('searchUsersBtn')?.addEventListener('click', searchUsers);
    document.getElementById('searchArchiveBtn')?.addEventListener('click', searchArchive);
    document.getElementById('userReportBtn')?.addEventListener('click', generateUserReport);
    document.getElementById('activityReportBtn')?.addEventListener('click', generateActivityReport);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('userForm')?.addEventListener('submit', (e) => { e.preventDefault(); saveUser(); });
    document.getElementById('entriesSelect')?.addEventListener('change', changeEntries);
    document.getElementById('tableSearch')?.addEventListener('input', searchRecentUsers);
    document.getElementById('closeReplyModalBtn')?.addEventListener('click', closeReplyModal);
    document.getElementById('cancelReplyBtn')?.addEventListener('click', closeReplyModal);
    document.getElementById('sendReplyBtn')?.addEventListener('click', sendReply);
    
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
            document.getElementById(`${page}Page`).classList.add('active');
            
            const titles = { 
                dashboard: 'Dashboard', 
                users: 'User Management', 
                archive: 'Archive', 
                reports: 'Reports', 
                contact: 'Contact Inquiries' 
            };
            document.getElementById('pageTitle').innerText = titles[page] || 'Dashboard';
            
            if (page === 'users') renderUsers();
            if (page === 'archive') renderArchive();
            if (page === 'dashboard') renderRecentUsersTable();
            if (page === 'contact') renderInquiries();
        });
    });
    
    // Inquiry filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentInquiryFilter = this.dataset.filter;
            renderInquiries();
        });
    });
});

window.goToPage = goToPage;
window.editUser = editUser;
window.archiveUser = archiveUser;
window.deleteUser = deleteUser;
window.permanentDelete = permanentDelete;
window.exportUserReport = exportUserReport;
window.openResetPasswordModal = openResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;
window.resetPassword = resetPassword;
window.deleteInquiry = deleteInquiry;
window.openReplyModal = openReplyModal;
window.closeReplyModal = closeReplyModal;
window.sendReply = sendReply;
window.searchUsers = searchUsers;
window.searchArchive = searchArchive;
