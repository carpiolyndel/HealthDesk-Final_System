// ============ ADMIN.JS - COMPLETE VERSION ============

let systemUsers = [];
let archivedUsers = [];
let guestInquiries = [];
let currentPage = 1;
let rowsPerPage = 10;
let currentFilter = '';
let currentInquiryFilter = 'all';
let usingBackend = false;
let inquiryPollingInterval = null;

const ADMIN_PAGE_STORAGE_KEY = 'adminCurrentPage';
const ADMIN_PAGE_NAMES = ['dashboard', 'users', 'archive', 'reports', 'contact'];
const APP_TIME_ZONE = 'Asia/Manila';
const APP_DATE_TIME_FORMAT = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: APP_TIME_ZONE
};

function formatAppDateTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
        return value || new Date().toLocaleString('en-US', APP_DATE_TIME_FORMAT);
    }
    return date.toLocaleString('en-US', APP_DATE_TIME_FORMAT);
}

function getSavedAdminPage() {
    const hashPage = window.location.hash ? window.location.hash.slice(1) : '';
    if (ADMIN_PAGE_NAMES.includes(hashPage)) {
        return hashPage;
    }
    const storedPage = localStorage.getItem(ADMIN_PAGE_STORAGE_KEY);
    if (ADMIN_PAGE_NAMES.includes(storedPage)) {
        return storedPage;
    }
    return 'dashboard';
}

function setSavedAdminPage(page) {
    if (!ADMIN_PAGE_NAMES.includes(page)) return;
    localStorage.setItem(ADMIN_PAGE_STORAGE_KEY, page);
    window.history.replaceState(null, '', `#${page}`);
}

function activateAdminPage(page) {
    if (!ADMIN_PAGE_NAMES.includes(page)) {
        page = 'dashboard';
    }

    document.querySelectorAll('.nav-item[data-page]').forEach(nav => nav.classList.toggle('active', nav.dataset.page === page));
    document.querySelectorAll('.page-content').forEach(content => content.classList.toggle('active', content.id === `${page}Page`));

    const titles = {
        dashboard: 'Dashboard',
        users: 'User Management',
        archive: 'Archive',
        reports: 'Reports',
        contact: 'Contact Inquiries'
    };
    document.getElementById('pageTitle').innerText = titles[page] || 'Dashboard';
    setSavedAdminPage(page);

    if (page === 'users') renderUsers();
    if (page === 'archive') renderArchive();
    if (page === 'dashboard') renderRecentUsersTable();
    if (page === 'contact') renderInquiries();
    if (page === 'reports') {
        const reportResult = document.getElementById('reportResult');
        if (reportResult) reportResult.classList.add('empty');
    }
}

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

function normalizeUser(user) {
    return {
        id: user.id,
        username: user.username,
        fullname: user.fullName || user.fullname || user.name || '',
        name: user.fullName || user.fullname || user.name || '',
        email: user.email || '',
        role: (user.role || 'STAFF').toUpperCase(),
        licenseNumber: user.licenseNumber || '',
        employeeId: user.employeeId || '',
        status: user.status || 'Active',
        password: user.password || '',
        lastLogin: user.lastLogin || 'Never',
        createdAt: user.createdAt || new Date().toISOString()
    };
}

function normalizeInquiry(inquiry) {
    const receivedAt = inquiry.receivedAt || inquiry.timestamp || inquiry.date;
    return {
        id: inquiry.id || Date.now(),
        name: inquiry.name || 'Guest Visitor',
        email: inquiry.email || '',
        phone: inquiry.phone || '',
        subject: inquiry.subject || 'General Inquiry',
        message: inquiry.message || '',
        source: inquiry.source || 'guest',
        status: inquiry.status || 'pending',
        date: receivedAt ? formatAppDateTime(receivedAt) : formatAppDateTime(),
        receivedAt: receivedAt || new Date().toISOString(),
        replyMessage: inquiry.replyMessage || '',
        repliedAt: inquiry.repliedAt || '',
        repliedBy: inquiry.repliedBy || ''
    };
}

function mergeInquiries(localInquiries, backendInquiries) {
    const byId = new Map();
    [...backendInquiries, ...localInquiries].forEach((inquiry) => {
        const normalized = normalizeInquiry(inquiry);
        byId.set(String(normalized.id), {
            ...byId.get(String(normalized.id)),
            ...normalized
        });
    });
    return Array.from(byId.values()).sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
}

async function fetchBackendInquiries() {
    try {
        const response = await fetch(`${API_BASE_URL}/public/customer-inquiries`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function inquiriesChanged(oldList, newList) {
    if (oldList.length !== newList.length) return true;
    for (let i = 0; i < newList.length; i += 1) {
        if (String(oldList[i]?.id) !== String(newList[i]?.id)) return true;
        if (String(oldList[i]?.status) !== String(newList[i]?.status)) return true;
    }
    return false;
}

async function refreshGuestInquiries() {
    const storedInquiries = JSON.parse(localStorage.getItem('guestInquiries') || '[]');
    const backendInquiries = await fetchBackendInquiries();
    const merged = mergeInquiries(storedInquiries, backendInquiries);
    const hasChanges = inquiriesChanged(guestInquiries, merged);
    guestInquiries = merged;
    localStorage.setItem('guestInquiries', JSON.stringify(guestInquiries));

    if (hasChanges) {
        renderInquiries();
    }
    return guestInquiries;
}

function startInquiryPolling() {
    if (inquiryPollingInterval) {
        clearInterval(inquiryPollingInterval);
    }
    inquiryPollingInterval = setInterval(async () => {
        await refreshGuestInquiries();
    }, 15000);
}

async function sendBackendInquiryReply(inquiryId, replyMessage, repliedBy) {
    const response = await fetch(`${API_BASE_URL}/public/customer-inquiries/${encodeURIComponent(inquiryId)}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyMessage, repliedBy })
    });
    if (!response.ok) {
        throw new Error('Unable to save reply to database.');
    }
    return response.json();
}

async function deleteBackendInquiry(inquiryId) {
    const response = await fetch(`${API_BASE_URL}/public/customer-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error('Unable to delete inquiry from database.');
    }
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
        systemUsers = [];
        localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    }
    
    if (storedArchived) {
        archivedUsers = JSON.parse(storedArchived);
    } else {
        archivedUsers = [];
        localStorage.setItem('archivedUsers', JSON.stringify(archivedUsers));
    }
    
    const localInquiries = storedInquiries ? JSON.parse(storedInquiries) : [];
    const backendInquiries = await fetchBackendInquiries();
    guestInquiries = mergeInquiries(localInquiries, backendInquiries);
    localStorage.setItem('guestInquiries', JSON.stringify(guestInquiries));
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

function sameId(left, right) {
    return String(left) === String(right);
}

function safeActionId(id) {
    return JSON.stringify(String(id));
}

function userMatchesQuery(user, query) {
    const haystack = [
        user.username,
        user.fullname,
        user.name,
        user.email,
        user.role,
        user.status,
        user.licenseNumber,
        user.employeeId
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
}

function credentialValue(user) {
    return user.licenseNumber || user.employeeId || '';
}

function updateCredentialField() {
    const role = (document.getElementById('role')?.value || 'staff').toUpperCase();
    const label = document.getElementById('credentialLabel');
    const input = document.getElementById('credentialNumber');
    const hint = document.getElementById('credentialHint');
    if (!label || !input || !hint) return;

    if (role === 'DOCTOR' || role === 'NURSE') {
        label.textContent = 'Professional License No. *';
        input.placeholder = role === 'DOCTOR' ? 'Example: PRC-MD-1234567' : 'Example: PRC-RN-1234567';
        input.required = true;
        hint.textContent = `Required to verify legitimate ${role.toLowerCase()} account.`;
        return;
    }

    if (role === 'STAFF') {
        label.textContent = 'Staff Employee ID *';
        input.placeholder = 'Example: STAFF-2026-001';
        input.required = true;
        hint.textContent = 'Required to verify legitimate staff account.';
        return;
    }

    label.textContent = 'Admin Credential / Employee ID';
    input.placeholder = 'Optional internal admin credential';
    input.required = false;
    hint.textContent = 'Optional for administrator accounts.';
}

function renderUserRows(users) {
    if (!users.length) {
        return '<tr><td colspan="7" style="text-align:center;">No users found</td></tr>';
    }

    return users.map(u => {
        const id = escapeHtml(String(u.id || ''));
        return `
            <tr>
                <td>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(u.fullname)}</td>
                <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
                <td><span class="credential-badge">${escapeHtml(credentialValue(u) || 'Not set')}</span></td>
                <td class="status-${u.status.toLowerCase()}">${u.status}</td>
                <td><span class="password-mask">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span></td>
                <td>
                    <div class="user-actions">
                        <button type="button" class="btn-edit" data-user-action="edit" data-user-id="${id}"><i class="fas fa-edit"></i> Edit</button>
                        <button type="button" class="btn-archive" data-user-action="archive" data-user-id="${id}"><i class="fas fa-archive"></i> Archive</button>
                        <button type="button" class="btn-danger" data-user-action="delete" data-user-id="${id}"><i class="fas fa-trash"></i> Delete</button>
                        <button type="button" class="btn-warning" data-user-action="reset" data-user-id="${id}"><i class="fas fa-key"></i> Reset</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderUsers() {
    const tbody = document.getElementById('usersList');
    if (!tbody) return;
    tbody.innerHTML = renderUserRows(systemUsers);
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
            <td><button class="btn-danger" onclick="permanentDelete(${safeActionId(u.id)})"><i class="fas fa-trash"></i> Delete</button></td>
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
    document.getElementById('credentialNumber').value = '';
    updateCredentialField();
    document.getElementById('status').value = 'Active';
    document.getElementById('userModal').classList.add('active');
    // Ensure mobile sidebar overlay/scroll-lock is removed so modal can scroll
    document.body.classList.remove('sidebar-open');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function editUser(id) {
    const u = systemUsers.find(u => sameId(u.id, id));
    if (u) {
        document.getElementById('userId').value = u.id;
        document.getElementById('username').value = u.username;
        document.getElementById('fullname').value = u.fullname;
        document.getElementById('userEmail').value = u.email || '';
        document.getElementById('password').value = '';
        document.getElementById('passwordHint').innerHTML = '<i class="fas fa-info-circle"></i> Leave blank to keep current password';
        document.getElementById('modalTitle').innerText = 'Edit User';
        document.getElementById('role').value = u.role;
        document.getElementById('credentialNumber').value = credentialValue(u);
        updateCredentialField();
        document.getElementById('status').value = u.status;
        document.getElementById('userModal').classList.add('active');
    } else {
        showToast('User record was not found. Please refresh the user list.', 'error');
    }
}

function backendUserToLocal(user, status = 'Active') {
    return normalizeUser({
        id: user.id,
        username: user.username,
        fullname: user.fullName || user.fullname || user.name,
        name: user.fullName || user.fullname || user.name,
        email: user.email,
        role: user.role,
        licenseNumber: user.licenseNumber,
        employeeId: user.employeeId,
        status,
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
    const normalizedRole = role.toUpperCase();
    const credentialNumber = document.getElementById('credentialNumber').value.trim();
    const status = document.getElementById('status').value;
    
    if (!username || !fullname) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (email && !validateEmail(email)) {
        showToast('Invalid email format', 'error');
        return;
    }

    if ((normalizedRole === 'DOCTOR' || normalizedRole === 'NURSE') && !credentialNumber) {
        showToast('Professional license number is required for doctors and nurses', 'error');
        return;
    }

    if (normalizedRole === 'STAFF' && !credentialNumber) {
        showToast('Employee ID is required for staff users', 'error');
        return;
    }

    const credentialPayload = {
        licenseNumber: ['DOCTOR', 'NURSE'].includes(normalizedRole) ? credentialNumber : '',
        employeeId: ['STAFF', 'ADMIN'].includes(normalizedRole) ? credentialNumber : ''
    };
    
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
                        role: normalizedRole,
                        ...credentialPayload
                    });
                    systemUsers[index] = {
                        ...systemUsers[index],
                        ...backendUserToLocal(saved, status)
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
                licenseNumber: credentialPayload.licenseNumber,
                employeeId: credentialPayload.employeeId,
                status
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
                    role: normalizedRole,
                    ...credentialPayload
                });
                systemUsers.push(backendUserToLocal(saved, status));
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
    const user = systemUsers.find(u => sameId(u.id, id));
    if (user) {
        document.getElementById('resetUserId').value = user.id;
        document.getElementById('resetUserName').value = user.username;
        document.getElementById('resetPasswordModal').classList.add('active');
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('passwordMatchError').innerHTML = '';
    } else {
        showToast('User record was not found. Please refresh the user list.', 'error');
    }
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').classList.remove('active');
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordMatchError').innerHTML = '';
}

async function resetPassword() {
    const userId = document.getElementById('resetUserId').value;
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
    
    const index = systemUsers.findIndex(u => sameId(u.id, userId));
    if (index !== -1) {
        if (typeof api !== 'undefined' && api.getToken()) {
            try {
                await api.resetUserPassword(userId, newPassword);
            } catch (error) {
                showToast(error.message, 'error');
                return;
            }
        } else {
            showToast('Please login again as admin so the app can reset passwords in the database.', 'error');
            return;
        }
        saveToStorage();
        showToast(`Password reset for "${systemUsers[index].username}"`, 'success');
        closeResetPasswordModal();
        renderUsers();
    }
}

// ============ ARCHIVE & DELETE ============

async function archiveUser(id) {
    const u = systemUsers.find(u => sameId(u.id, id));
    if (!u) {
        showToast('User record was not found. Please refresh the user list.', 'error');
        return;
    }
    const confirmed = await confirmAction({
        title: 'Archive User',
        message: `Archive user "${u.username}"? You can still review archived records later.`,
        confirmText: 'Archive',
        danger: false
    });
    if (confirmed) {
        if (typeof api !== 'undefined' && api.getToken()) {
            try {
                await api.archiveUser(id);
                await loadData();
            } catch (error) {
                showToast(error.message, 'error');
                return;
            }
        } else {
            systemUsers = systemUsers.filter(u => !sameId(u.id, id));
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
    const u = systemUsers.find(u => sameId(u.id, id));
    if (!u) {
        showToast('User record was not found. Please refresh the user list.', 'error');
        return;
    }
    const confirmed = await confirmAction({
        title: 'Delete User Permanently',
        message: `Permanently delete "${u.username}"? This cannot be undone.`,
        confirmText: 'Delete',
        danger: true
    });
    if (confirmed) {
        if (typeof api !== 'undefined' && api.getToken()) {
            try {
                await api.deleteUser(id);
                await loadData();
            } catch (error) {
                showToast(error.message, 'error');
                return;
            }
        } else {
            systemUsers = systemUsers.filter(u => !sameId(u.id, id));
        }
        saveToStorage();
        updateStats();
        renderUsers();
        renderRecentUsersTable();
        showToast(`User "${u.username}" deleted permanently`, 'success');
    }
}

async function permanentDelete(id) {
    const u = archivedUsers.find(u => sameId(u.id, id));
    if (!u) {
        showToast('Archived user was not found.', 'error');
        return;
    }
    const confirmed = await confirmAction({
        title: 'Delete Archived User',
        message: `Permanently delete "${u.username}" from archive? This cannot be undone.`,
        confirmText: 'Delete',
        danger: true
    });
    if (confirmed) {
        archivedUsers = archivedUsers.filter(u => !sameId(u.id, id));
        saveToStorage();
        renderArchive();
        showToast(`User "${u.username}" removed from archive`, 'success');
    }
}

// ============ SEARCH FUNCTIONS ============

function searchUsers() {
    const query = document.getElementById('searchUsersInput').value.trim().toLowerCase();
    const tbody = document.getElementById('usersList');
    if (!tbody) return;
    tbody.innerHTML = renderUserRows(query ? systemUsers.filter(u => userMatchesQuery(u, query)) : systemUsers);
}

function handleUserActionClick(event) {
    const button = event.target.closest('[data-user-action]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const id = button.dataset.userId;
    const action = button.dataset.userAction;
    if (!id) {
        showToast('This user has no valid ID. Please refresh or reload users from the database.', 'error');
        return;
    }

    if (action === 'edit') editUser(id);
    if (action === 'archive') archiveUser(id);
    if (action === 'delete') deleteUser(id);
    if (action === 'reset') openResetPasswordModal(id);
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
            <td><button class="btn-danger" onclick="permanentDelete(${safeActionId(u.id)})">Delete</button></td>
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
    
    container.innerHTML = filtered.map(inquiry => {
        const id = escapeHtml(String(inquiry.id || ''));
        return `
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
                    <button type="button" class="btn-primary" data-inquiry-action="reply" data-inquiry-id="${id}" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                ` : ''}
                <button type="button" class="btn-danger" data-inquiry-action="delete" data-inquiry-id="${id}" style="padding: 6px 12px; font-size: 12px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    }).join('');
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

function openReplyModalById(inquiryId) {
    const inquiry = guestInquiries.find(i => sameId(i.id, inquiryId));
    if (!inquiry) {
        showToast('Inquiry was not found. Please refresh the inquiry list.', 'error');
        return;
    }
    openReplyModal(inquiry.id, inquiry.name, inquiry.email, inquiry.message);
}

function handleInquiryActionClick(event) {
    const button = event.target.closest('[data-inquiry-action]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const id = button.dataset.inquiryId;
    const action = button.dataset.inquiryAction;
    if (!id) {
        showToast('This inquiry has no valid ID. Please refresh the page.', 'error');
        return;
    }

    if (action === 'reply') openReplyModalById(id);
    if (action === 'delete') deleteInquiry(id);
}

function closeReplyModal() {
    document.getElementById('replyModal').classList.remove('active');
}

async function sendReply() {
    const inquiryId = document.getElementById('replyInquiryId').value;
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
    
    const index = guestInquiries.findIndex(i => sameId(i.id, inquiryId));
    if (index !== -1) {
        try {
            const savedReply = await sendBackendInquiryReply(inquiryId, replyMessage, adminName);
            guestInquiries[index] = normalizeInquiry(savedReply);
        } catch (error) {
            guestInquiries[index].status = 'replied';
            guestInquiries[index].repliedAt = new Date().toLocaleString();
            guestInquiries[index].replyMessage = replyMessage;
            guestInquiries[index].repliedBy = adminName;
            showToast(`${error.message} Saved locally for this browser.`, 'error');
        }
        saveToStorage();
        renderInquiries();
        showToast(`Reply saved for ${guestEmail || guestName}`, 'success');
    }
    
    closeReplyModal();
}

async function deleteInquiry(id) {
    const confirmed = await confirmAction({
        title: 'Delete Inquiry',
        message: 'Delete this guest inquiry from the admin inbox?',
        confirmText: 'Delete',
        danger: true
    });
    if (confirmed) {
        try {
            await deleteBackendInquiry(id);
        } catch (error) {
            showToast(`${error.message} Removed locally for this browser.`, 'error');
        }
        guestInquiries = guestInquiries.filter(i => !sameId(i.id, id));
        saveToStorage();
        renderInquiries();
        showToast('Inquiry deleted', 'success');
    }
}

// ============ REPORTS ============

function generateUserReport() {
    const reportResult = document.getElementById('reportResult');
    reportResult.classList.remove('empty');
    reportResult.innerHTML = `
        <div class="report-dashboard">
            <div class="report-header">
                <h3><i class="fas fa-users"></i> User Report</h3>
                <p>Summary of system users and account activity for administrators.</p>
            </div>
            <div class="report-kpi-grid">
                <div class="report-kpi-card"><span>Total Users</span><strong>${systemUsers.length}</strong><small>Active system accounts</small></div>
                <div class="report-kpi-card"><span>Admins</span><strong>${systemUsers.filter(u => u.role === 'ADMIN').length}</strong><small>Administration accounts</small></div>
                <div class="report-kpi-card"><span>Doctors</span><strong>${systemUsers.filter(u => u.role === 'DOCTOR').length}</strong><small>Physician accounts</small></div>
                <div class="report-kpi-card"><span>Nurses</span><strong>${systemUsers.filter(u => u.role === 'NURSE').length}</strong><small>Nursing accounts</small></div>
                <div class="report-kpi-card"><span>Staff</span><strong>${systemUsers.filter(u => u.role === 'STAFF').length}</strong><small>Front desk accounts</small></div>
                <div class="report-kpi-card"><span>Archived</span><strong>${archivedUsers.length}</strong><small>Archived users</small></div>
            </div>
            <div class="report-detail-grid">
                <div class="report-detail-card">
                    <h4><i class="fas fa-id-badge"></i> Account Overview</h4>
                    <div class="report-list">
                        <div class="report-list-row"><span>Guest inquiries</span><strong>${guestInquiries.length}</strong></div>
                        <div class="report-list-row"><span>System status</span><strong>Active</strong></div>
                    </div>
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
    
    const reportResult = document.getElementById('reportResult');
    reportResult.classList.remove('empty');
    reportResult.innerHTML = `
        <div class="report-dashboard">
            <div class="report-header">
                <h3><i class="fas fa-chart-line"></i> Activity Report</h3>
                <p>Activity overview for users and guest interactions across the system.</p>
            </div>
            <div class="report-kpi-grid">
                <div class="report-kpi-card"><span>Active Users</span><strong>${activeUsers}</strong><small>Enabled accounts</small></div>
                <div class="report-kpi-card"><span>Inactive Users</span><strong>${inactiveUsers}</strong><small>Disabled accounts</small></div>
                <div class="report-kpi-card"><span>Pending Inquiries</span><strong>${pendingInquiries}</strong><small>Waiting for reply</small></div>
                <div class="report-kpi-card"><span>Replied Inquiries</span><strong>${repliedInquiries}</strong><small>Handled messages</small></div>
                <div class="report-kpi-card"><span>Archived Records</span><strong>${archivedUsers.length}</strong><small>Archived accounts</small></div>
            </div>
            <div class="report-detail-grid">
                <div class="report-detail-card">
                    <h4><i class="fas fa-server"></i> System Overview</h4>
                    <div class="report-list">
                        <div class="report-list-row"><span>System uptime</span><strong>Stable</strong></div>
                        <div class="report-list-row"><span>Data refresh</span><strong>Live</strong></div>
                    </div>
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
        Credential: credentialValue(u) || 'Not set',
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
    startInquiryPolling();
    
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
    document.getElementById('role')?.addEventListener('change', updateCredentialField);
    updateCredentialField();
    document.getElementById('entriesSelect')?.addEventListener('change', changeEntries);
    document.getElementById('tableSearch')?.addEventListener('input', searchRecentUsers);
    document.getElementById('closeReplyModalBtn')?.addEventListener('click', closeReplyModal);
    document.getElementById('cancelReplyBtn')?.addEventListener('click', closeReplyModal);
    document.getElementById('sendReplyBtn')?.addEventListener('click', sendReply);
    document.getElementById('usersList')?.addEventListener('click', handleUserActionClick);
    document.getElementById('inquiriesList')?.addEventListener('click', handleInquiryActionClick);
    document.getElementById('searchUsersInput')?.addEventListener('input', searchUsers);
    document.getElementById('searchUsersInput')?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.currentTarget.value = '';
            searchUsers();
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            searchUsers();
        }
    });
    setupResponsiveSidebar();
    
    // Sidebar navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (!page || !ADMIN_PAGE_NAMES.includes(page)) return;
            activateAdminPage(page);
        });
    });
    activateAdminPage(getSavedAdminPage());
    document.body.classList.add('app-ready');
    
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
