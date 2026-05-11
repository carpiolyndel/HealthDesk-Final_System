function showNotification(message, type) {
    const existingNotification = document.querySelector('.notification-overlay');
    if (existingNotification) existingNotification.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 9999; display: flex;
        align-items: center; justify-content: center;
    `;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: white; border-radius: 20px; padding: 32px;
        min-width: 320px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease;
    `;
    
    const iconColor = type === 'success' ? '#10b981' : '#ef4444';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}" style="font-size: 48px; color: ${iconColor}; margin-bottom: 16px;"></i>
        <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">${type === 'success' ? 'Success!' : 'Error!'}</h3>
        <p style="color: #64748b;">${message}</p>
        <button onclick="this.closest('.notification-overlay').remove()" style="
            margin-top: 20px; padding: 10px 28px; background: #2563eb; color: white;
            border: none; border-radius: 10px; cursor: pointer; font-weight: 500;
        ">OK</button>
    `;
    
    overlay.appendChild(notification);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        if (overlay && overlay.parentNode) overlay.remove();
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    setupSharedMobileMenu();
    setupSharedHeaderScroll();
});

function setupSharedMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (!hamburger || !navMenu || hamburger.dataset.menuReady === 'true') {
        return;
    }

    hamburger.dataset.menuReady = 'true';
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

function setupSharedHeaderScroll() {
    const header = document.getElementById('header');

    if (!header || header.dataset.scrollReady === 'true') {
        return;
    }

    header.dataset.scrollReady = 'true';
    const updateHeader = () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader);
}
