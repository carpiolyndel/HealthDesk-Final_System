let pendingUser = null;
let generatedOtp = null;
let otpExpiry = null;
let otpTimer = null;

const AUTH_STORAGE_KEYS = typeof STORAGE_KEYS !== 'undefined' ? STORAGE_KEYS : {
    CURRENT_USER: 'currentUser',
    TOKEN: 'token',
    THEME: 'theme'
};

function getCurrentUser() {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    if (stored) return JSON.parse(stored);
    return null;
}

function checkAuth(allowedRoles) {
    const user = getCurrentUser();
    
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        window.location.href = 'login.html';
        return null;
    }
    
    return user;
}

function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'login.html';
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
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function sendOtpEmail(email, otp, name) {
    console.log('📧 Sending OTP to:', email);
    console.log('🔐 OTP Code:', otp);
    
    if (email === 'admin@healthdesk.com' || email === 'doctor@healthdesk.com' || 
        email === 'nurse@healthdesk.com' || email === 'staff@healthdesk.com' ||
        !email || email === '') {
        showToast(`🔐 Your OTP is: ${otp}`, 'info');
        return true;
    }
    
    if (typeof emailjs !== 'undefined' && typeof EMAILJS_CONFIG !== 'undefined') {
        try {
            const templateParams = {
                to_name: name,
                otp_code: otp,
                to_email: email,
                current_year: new Date().getFullYear()
            };
            
            const response = await emailjs.send(
                EMAILJS_CONFIG.SERVICE_ID,
                EMAILJS_CONFIG.TEMPLATE_ID,
                templateParams,
                EMAILJS_CONFIG.PUBLIC_KEY
            );
            
            if (response.status === 200) {
                showToast(`✅ Code sent to ${email}`, 'success');
                return true;
            } else {
                showToast(`⚠️ Failed. Your OTP: ${otp}`, 'warning');
                return false;
            }
        } catch (error) {
            showToast(`⚠️ Cannot send. Your OTP: ${otp}`, 'warning');
            return false;
        }
    } else {
        showToast(`🔐 Your OTP is: ${otp}`, 'info');
        return true;
    }
}

function getDashboardUrl(role) {
    const dashboards = {
        ADMIN: 'admin.html',
        DOCTOR: 'doctor.html',
        NURSE: 'nurse.html',
        STAFF: 'staff.html'
    };
    return dashboards[role] || 'staff.html';
}

async function login(username, password) {
    console.log('🔐 Login attempt:', username);
    
    let systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    
    if (systemUsers.length === 0) {
        systemUsers = [
            { id: 1, username: 'admin', fullname: 'Admin User', name: 'Admin User', email: 'admin@healthdesk.com', role: 'ADMIN', status: 'Active', lastLogin: 'Never', createdAt: new Date().toISOString() },
            { id: 2, username: 'doctor', fullname: 'Dr. James Cruz', name: 'Dr. James Cruz', email: 'doctor@healthdesk.com', role: 'DOCTOR', status: 'Active', lastLogin: 'Never', createdAt: new Date().toISOString() },
            { id: 3, username: 'nurse', fullname: 'Anna Reyes', name: 'Anna Reyes', email: 'nurse@healthdesk.com', role: 'NURSE', status: 'Active', lastLogin: 'Never', createdAt: new Date().toISOString() },
            { id: 4, username: 'staff', fullname: 'Maria Santos', name: 'Maria Santos', email: 'staff@healthdesk.com', role: 'STAFF', status: 'Active', lastLogin: 'Never', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    }
    
    const user = systemUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        if (user.status !== 'Active') {
            showToast('Account is inactive. Please contact admin.', 'error');
            return { success: false, message: 'Account is inactive' };
        }
        
        pendingUser = {
            id: user.id,
            username: user.username,
            fullname: user.fullname || user.name,
            name: user.fullname || user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            password: user.password
        };
        
        generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        otpExpiry = Date.now() + 5 * 60 * 1000;
        
        await sendOtpEmail(user.email, generatedOtp, pendingUser.fullname);
        
        return { success: true, user: pendingUser, otp: generatedOtp };
    }
    
    showToast('Invalid username or password', 'error');
    return { success: false, message: 'Invalid username or password' };
}

function verifyOtp(enteredOtp) {
    if (!generatedOtp) {
        showToast('Please request OTP first', 'error');
        return { success: false, message: 'No OTP generated' };
    }
    
    if (Date.now() > otpExpiry) {
        showToast('OTP expired. Please request a new one.', 'error');
        return { success: false, message: 'OTP expired' };
    }
    
    if (enteredOtp === generatedOtp) {
        const userData = {
            id: pendingUser.id,
            username: pendingUser.username,
            role: pendingUser.role,
            name: pendingUser.fullname || pendingUser.name,
            fullname: pendingUser.fullname || pendingUser.name,
            email: pendingUser.email
        };
        localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
        
        const dashboard = getDashboardUrl(pendingUser.role);
        
        return { success: true, user: userData, dashboard: dashboard };
    }
    
    showToast('Invalid verification code', 'error');
    return { success: false, message: 'Invalid verification code' };
}

function resendOtp() {
    if (!pendingUser) {
        showToast('No pending login session', 'error');
        return false;
    }
    
    generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpExpiry = Date.now() + 5 * 60 * 1000;
    sendOtpEmail(pendingUser.email, generatedOtp, pendingUser.fullname);
    showToast('New verification code sent!', 'success');
    return true;
}

function startOtpTimer(onExpire) {
    const timerEl = document.getElementById('timerDisplay');
    if (!timerEl) return;
    
    if (otpTimer) clearInterval(otpTimer);
    
    otpTimer = setInterval(() => {
        const remaining = otpExpiry - Date.now();
        
        if (remaining <= 0) {
            clearInterval(otpTimer);
            timerEl.innerHTML = 'Code expired';
            timerEl.classList.add('expired');
            if (onExpire) onExpire();
        } else {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timerEl.innerHTML = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            timerEl.classList.remove('expired');
        }
    }, 1000);
}

window.login = login;
window.verifyOtp = verifyOtp;
window.resendOtp = resendOtp;
window.getCurrentUser = getCurrentUser;
window.checkAuth = checkAuth;
window.logout = logout;
window.showToast = showToast;

console.log('✅ auth.js loaded');
