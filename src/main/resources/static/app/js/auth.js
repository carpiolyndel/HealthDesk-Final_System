const AUTH_STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken'
};

function normalizeRole(role) {
    return (role || '').toUpperCase().replace('ROLE_', '');
}

function getCurrentUser() {
    try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
}

function clearAuthSession() {
    localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
}

function getDashboardUrl(role) {
    const dashboards = {
        ADMIN: 'admin.html',
        DOCTOR: 'doctor.html',
        NURSE: 'nurse.html',
        STAFF: 'staff.html'
    };
    return dashboards[normalizeRole(role)] || 'staff.html';
}

function checkAuth(allowedRoles) {
    const user = getCurrentUser();
    const role = normalizeRole(user?.role);
    const allowed = (allowedRoles || []).map(normalizeRole);

    if (!user || !getAuthToken()) {
        clearAuthSession();
        window.location.href = 'login.html';
        return null;
    }

    if (allowed.length && !allowed.includes(role)) {
        window.location.href = getDashboardUrl(role);
        return null;
    }

    user.role = role;
    return user;
}

function logout() {
    const finish = () => {
        clearAuthSession();
        window.location.href = 'login.html';
    };

    if (typeof api !== 'undefined' && typeof api.logout === 'function') {
        api.logout().finally(finish);
        return;
    }

    finish();
}

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const normalizedType = type === true ? 'error' : (type === false ? 'success' : type);
    const icon = normalizedType === 'success'
        ? 'fa-check-circle'
        : normalizedType === 'error'
            ? 'fa-exclamation-circle'
            : 'fa-info-circle';

    const toast = document.createElement('div');
    toast.className = `toast ${normalizedType}`;
    const text = document.createElement('span');
    text.textContent = message;
    toast.innerHTML = `<i class="fas ${icon}"></i> `;
    toast.appendChild(text);
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.getCurrentUser = getCurrentUser;
window.getAuthToken = getAuthToken;
window.clearAuthSession = clearAuthSession;
window.getDashboardUrl = getDashboardUrl;
window.checkAuth = checkAuth;
window.logout = logout;
window.showToast = showToast;
