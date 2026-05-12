document.addEventListener('DOMContentLoaded', async () => {
    await loadClinicInfo();
    await loadClinicHours();
    setupInquiryForm();
    setupFloatingSupport();
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
            document.getElementById('clinicPhone').textContent = info.phone || '09486729942';
        }
        if (document.getElementById('clinicEmail')) {
            document.getElementById('clinicEmail').textContent = info.email || 'healthdesk.info1@gmail.com';
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
            return 'To schedule an appointment, please call our clinic or visit during clinic hours. Patient self-booking is not enabled for this version.';
        }
        if (text.includes('record') || text.includes('medical')) {
            return 'Medical records are confidential and can only be accessed by authorized clinic personnel.';
        }
        if (text.includes('hour')) {
            return 'Clinic hours are Monday-Friday 8:00 AM - 8:00 PM, Saturday 9:00 AM - 5:00 PM, and closed on Sundays.';
        }
        if (text.includes('doctor')) {
            return 'You can contact the clinic to ask about doctor availability or schedule a consultation.';
        }
        return 'Thank you for your message. Our clinic staff will get back to you as soon as possible.';
    };

    const sendMessage = async () => {
        const message = csMessageInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        csMessageInput.value = '';

        await GuestAPI.submitInquiry({
            name: 'Guest Chat Visitor',
            email: '',
            phone: '',
            subject: 'Floating Chat Inquiry',
            message,
            source: 'floating_chat'
        });

        setTimeout(() => addMessage(getReply(message), false), 500);
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
