document.addEventListener('DOMContentLoaded', async () => {
    await loadClinicInfo();
    await loadClinicHours();
    setupMobileMenu();
    setupScrollEffects();
});

async function loadClinicInfo() {
    const info = await GuestAPI.getClinicInfo();
    if (info) {
        if (document.getElementById('clinicAddress')) {
            document.getElementById('clinicAddress').textContent = info.address || 'Cawayan, Catarman, Northern Samar';
        }
        if (document.getElementById('clinicPhone')) {
            document.getElementById('clinicPhone').textContent = info.phone || '(02) 8123 4567';
        }
        if (document.getElementById('clinicEmail')) {
            document.getElementById('clinicEmail').textContent = info.email || 'clinic@healthdesk.com';
        }
    }
}

async function loadClinicHours() {
    const hours = await GuestAPI.getClinicHours();
    if (hours) {
        if (document.getElementById('hoursWeekday')) {
            document.getElementById('hoursWeekday').textContent = hours.monday_friday || '8:00 AM - 5:00 PM';
        }
        if (document.getElementById('hoursSaturday')) {
            document.getElementById('hoursSaturday').textContent = hours.saturday || '9:00 AM - 12:00 PM';
        }
        if (document.getElementById('hoursSunday')) {
            document.getElementById('hoursSunday').textContent = hours.sunday || 'Closed';
        }
    }
}

function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu && hamburger.dataset.menuReady !== 'true') {
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
}

function setupScrollEffects() {
    const header = document.getElementById('header');
    if (header && header.dataset.scrollReady !== 'true') {
        header.dataset.scrollReady = 'true';
        const updateHeader = () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        };

        updateHeader();
        window.addEventListener('scroll', updateHeader);
    }
}
