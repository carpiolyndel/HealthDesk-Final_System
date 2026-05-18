document.addEventListener('DOMContentLoaded', async () => {
    await loadClinicInfo();
    await loadClinicHours();
    await loadDoctors();
    await loadServices();
    setupInquiryForm();
    setupFloatingSupport();
    setupMobileMenu();
    setupScrollEffects();
});

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

async function loadClinicInfo() {
    const info = await GuestAPI.getClinicInfo();
    const defaultAddress = 'Cawayan, Catarman, Northern Samar';
    const defaultPhone = '09486729942';
    const defaultEmail = 'healthdesk.info1@gmail.com';
    const address = info?.address || defaultAddress;
    const phone = info?.phone || defaultPhone;
    const email = info?.email || defaultEmail;

    const addressLink = document.getElementById('clinicAddressLink');
    const phoneLink = document.getElementById('clinicPhoneLink');
    const emergencyPhoneLink = document.getElementById('clinicPhoneEmergencyLink');
    const emailLink = document.getElementById('clinicEmailLink');
    const addressText = document.getElementById('clinicAddress');
    const phoneText = document.getElementById('clinicPhone');
    const emergencyPhoneText = document.getElementById('clinicEmergencyPhone');
    const emailText = document.getElementById('clinicEmail');
    const mapIframe = document.getElementById('clinicMapIframe');

    const emergencyPhone = info?.emergencyPhone || phone;
    const mapsQuery = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
    const embedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;

    if (addressLink) {
        addressLink.href = mapsUrl;
    }
    if (addressText) {
        addressText.textContent = address;
    }
    if (phoneLink) {
        phoneLink.href = `tel:${phone}`;
    }
    if (phoneText) {
        phoneText.textContent = phone;
    }
    if (emergencyPhoneLink) {
        emergencyPhoneLink.href = `tel:${emergencyPhone}`;
    }
    if (emergencyPhoneText) {
        emergencyPhoneText.textContent = emergencyPhone;
    }
    if (emailLink) {
        emailLink.href = `mailto:${email}`;
    }
    if (emailText) {
        emailText.textContent = email;
    }
    if (mapIframe) {
        mapIframe.src = embedUrl;
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

async function loadDoctors() {
    const grid = document.getElementById('doctorsGrid');
    if (!grid) return;

    const doctors = await GuestAPI.getDoctors();
    if (!Array.isArray(doctors) || doctors.length === 0) return;

    grid.innerHTML = doctors.map((doctor) => `
        <div class="doctor-card">
            <div class="doctor-avatar"><i class="fas fa-user-md"></i></div>
            <h3 class="doctor-name">${escapeHtml(doctor.name || 'Clinic Doctor')}</h3>
            <p class="doctor-specialty">${escapeHtml(doctor.specialty || 'General Medicine')}</p>
            <p>Licensed HealthDesk physician available for patient consultations.</p>
            <p class="doctor-schedule"><i class="fas fa-calendar"></i> ${escapeHtml(doctor.schedule || 'By appointment')}</p>
            <a class="card-action" href="/guest/contact.html"><i class="fas fa-calendar-plus"></i> Request appointment</a>
        </div>
    `).join('');
}

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    const services = await GuestAPI.getServices();
    if (!Array.isArray(services) || services.length === 0) return;

    const iconMap = {
        consultation: 'fa-stethoscope',
        vaccination: 'fa-syringe',
        laboratory: 'fa-flask',
        dental: 'fa-tooth',
        physical: 'fa-heartbeat',
        pediatric: 'fa-baby-carriage'
    };

    grid.innerHTML = services.map((service) => {
        const name = typeof service === 'string' ? service : service.name;
        const description = typeof service === 'string'
            ? 'Available at HealthDesk Clinic. Contact us for requirements, schedule, and preparation details.'
            : (service.description || 'Available at HealthDesk Clinic.');
        const key = String(name || '').toLowerCase();
        const icon = Object.entries(iconMap).find(([word]) => key.includes(word))?.[1] || 'fa-notes-medical';

        return `
            <div class="service-card">
                <i class="fas ${icon} service-icon"></i>
                <h3>${escapeHtml(name || 'Clinic Service')}</h3>
                <p>${escapeHtml(description)}</p>
                <a class="card-action" href="/guest/contact.html"><i class="fas fa-paper-plane"></i> Inquire now</a>
            </div>
        `;
    }).join('');
}

function setupInquiryForm() {
    const inquiryForm = document.getElementById('inquiryForm');
    if (!inquiryForm || inquiryForm.dataset.ready === 'true') return;

    inquiryForm.dataset.ready = 'true';
    inquiryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('inqName')?.value.trim();
        const email = document.getElementById('inqEmail')?.value.trim();
        const message = document.getElementById('inqMessage')?.value.trim();

        if (!name || !email || !message) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        const result = await GuestAPI.submitInquiry({
            name,
            email,
            phone: document.getElementById('inqPhone')?.value.trim() || '',
            subject: document.getElementById('inqSubject')?.value || 'General Inquiry',
            message,
            source: 'contact_form'
        });

        if (result.success) {
            showNotification('Message sent successfully. We will respond within 1-2 business days.', 'success');
            inquiryForm.reset();
        } else {
            showNotification('Unable to send your message. Please try again.', 'error');
        }
    });
}

function setupFloatingSupport() {
    const csButton = document.getElementById('floatingCsButton');
    const csModal = document.getElementById('csModal');
    const csClose = document.getElementById('csClose');
    const csSendBtn = document.getElementById('csSendBtn');
    const csMessageInput = document.getElementById('csMessageInput');
    const csChatMessages = document.getElementById('csChatMessages');

    if (!csButton || !csModal || !csSendBtn || !csMessageInput || !csChatMessages || csButton.dataset.ready === 'true') {
        return;
    }

    csButton.dataset.ready = 'true';

    csButton.addEventListener('click', () => csModal.classList.add('show'));
    csClose?.addEventListener('click', () => csModal.classList.remove('show'));
    window.addEventListener('click', (event) => {
        if (event.target === csModal) csModal.classList.remove('show');
    });

    const addMessage = (message, isUser = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `cs-message ${isUser ? 'cs-message-user' : 'cs-message-bot'}`;

        const bubble = document.createElement('div');
        bubble.className = 'cs-message-bubble';
        bubble.textContent = message;

        const time = document.createElement('span');
        time.className = 'cs-message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(bubble);
        messageDiv.appendChild(time);
        csChatMessages.appendChild(messageDiv);
        csChatMessages.scrollTop = csChatMessages.scrollHeight;
    };

    const getReply = (message) => {
        const text = message.toLowerCase();
        if (text.includes('appointment')) {
            return 'To request an appointment, open /guest/contact.html and choose Appointment Request, or call 09486729942.';
        }
        if (text.includes('record') || text.includes('medical')) {
            return 'Medical records are confidential and can only be accessed by authorized clinic personnel.';
        }
        if (text.includes('hour')) {
            return 'Clinic hours are shown on /guest/hours.html. You can also call 09486729942 before visiting.';
        }
        if (text.includes('doctor')) {
            return 'Doctor availability is listed on /guest/doctors.html. For consultation requests, send a message through /guest/contact.html.';
        }
        return 'Thank you for your message. Our clinic staff will get back to you as soon as possible.';
    };

    const sendMessage = async () => {
        const message = csMessageInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        csMessageInput.value = '';
        csMessageInput.focus();

        await GuestAPI.submitInquiry({
            name: 'Guest Chat Visitor',
            email: '',
            phone: '',
            subject: 'Floating Chat Inquiry',
            message,
            source: 'floating_chat'
        });

        setTimeout(() => {
            addMessage(getReply(message), false);
            csMessageInput.focus();
        }, 500);
    };

    csSendBtn.addEventListener('click', sendMessage);
    csMessageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') sendMessage();
    });

    document.querySelectorAll('.cs-quick-reply').forEach(button => {
        button.addEventListener('click', () => {
            csMessageInput.value = button.getAttribute('data-message') || '';
            sendMessage();
        });
    });
}
