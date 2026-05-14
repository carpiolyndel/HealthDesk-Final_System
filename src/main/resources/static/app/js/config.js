const API_CONFIG = {
    BASE_URL: window.HEALTHDESK_API_BASE_URL || '/api',
    TIMEOUT: 30000,
    VERSION: '1.0.0'
};

const ROLES = {
    ADMIN: 'ADMIN',
    DOCTOR: 'DOCTOR',
    NURSE: 'NURSE',
    STAFF: 'STAFF',
    GUEST: 'GUEST'
};

const APPOINTMENT_STATUS = {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    PENDING: 'PENDING'
};

const STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    TOKEN: 'token',
    THEME: 'theme'
};
