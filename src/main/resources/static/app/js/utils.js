function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${getToastIcon(type)}"></i> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function ensureConfirmDialogStyles() {
    if (document.getElementById('healthdeskConfirmStyles')) return;

    const style = document.createElement('style');
    style.id = 'healthdeskConfirmStyles';
    style.textContent = `
        .hd-confirm-overlay {
            position: fixed;
            inset: 0;
            z-index: 5000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(15, 23, 42, 0.58);
            backdrop-filter: blur(4px);
        }
        .hd-confirm-dialog {
            width: min(440px, 100%);
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
            border: 1px solid #e2e8f0;
            overflow: hidden;
            animation: hdConfirmIn 0.18s ease-out;
        }
        .hd-confirm-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 22px 24px 16px;
        }
        .hd-confirm-icon {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #fef3c7;
            color: #b45309;
            font-size: 18px;
            flex: 0 0 auto;
        }
        .hd-confirm-title {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
        }
        .hd-confirm-message {
            margin: 0;
            padding: 0 24px 22px;
            color: #475569;
            font-size: 14px;
            line-height: 1.55;
        }
        .hd-confirm-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 16px 24px 22px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
        }
        .hd-confirm-btn {
            min-width: 104px;
            min-height: 42px;
            border: none;
            border-radius: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .hd-confirm-btn:hover {
            transform: translateY(-1px);
        }
        .hd-confirm-cancel {
            background: #e2e8f0;
            color: #334155;
        }
        .hd-confirm-ok {
            background: #0d9488;
            color: #ffffff;
            box-shadow: 0 10px 18px rgba(13, 148, 136, 0.18);
        }
        .hd-confirm-ok.danger {
            background: #ef4444;
            box-shadow: 0 10px 18px rgba(239, 68, 68, 0.18);
        }
        @keyframes hdConfirmIn {
            from { opacity: 0; transform: translateY(8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 480px) {
            .hd-confirm-actions {
                flex-direction: column-reverse;
            }
            .hd-confirm-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

function confirmAction({
    title = 'Confirm Action',
    message = 'Are you sure you want to continue?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false
} = {}) {
    ensureConfirmDialogStyles();

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'hd-confirm-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        overlay.innerHTML = `
            <div class="hd-confirm-dialog">
                <div class="hd-confirm-header">
                    <div class="hd-confirm-icon"><i class="fas ${danger ? 'fa-triangle-exclamation' : 'fa-circle-question'}"></i></div>
                    <h3 class="hd-confirm-title">${escapeText(title)}</h3>
                </div>
                <p class="hd-confirm-message">${escapeText(message)}</p>
                <div class="hd-confirm-actions">
                    <button type="button" class="hd-confirm-btn hd-confirm-cancel">${escapeText(cancelText)}</button>
                    <button type="button" class="hd-confirm-btn hd-confirm-ok ${danger ? 'danger' : ''}">${escapeText(confirmText)}</button>
                </div>
            </div>
        `;

        const close = (result) => {
            overlay.remove();
            document.removeEventListener('keydown', onKeydown);
            resolve(result);
        };
        const onKeydown = (event) => {
            if (event.key === 'Escape') close(false);
        };

        overlay.querySelector('.hd-confirm-cancel').addEventListener('click', () => close(false));
        overlay.querySelector('.hd-confirm-ok').addEventListener('click', () => close(true));
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) close(false);
        });
        document.addEventListener('keydown', onKeydown);

        document.body.appendChild(overlay);
        overlay.querySelector('.hd-confirm-ok').focus();
    });
}

function escapeText(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function formatTime(time) {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateAppointmentDate(date) {
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { valid: selected >= today, message: 'Appointment date cannot be in the past' };
}

function validateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return { valid: age >= 0 && age <= 120, age, message: age < 0 ? 'Age cannot be negative' : age > 120 ? 'Invalid age' : null };
}

function checkCancellationRule(appointmentDate) {
    const appointment = new Date(appointmentDate);
    const today = new Date();
    const diffTime = appointment - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
}

function downloadCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported successfully', 'success');
}

function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
        showToast('Nothing available to print', 'error');
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('Unable to open print window', 'error');
        return;
    }

    const clone = section.cloneNode(true);
    clone.querySelectorAll('button, select, input, textarea, .search-bar, .doctor-toolbar, .report-menu, .toast-container, .pagination').forEach(el => el.remove());
    const sectionTitle = section.querySelector('h1, h2, h3')?.textContent?.trim()
        || document.getElementById('pageTitle')?.textContent?.trim()
        || 'HealthDesk Report';
    const printedBy = document.getElementById('userName')?.textContent?.trim() || 'HealthDesk';
    const printDate = new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const styles = `
        <style>
            @page { size: A4; margin: 16mm; }
            * { box-sizing: border-box; }
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                color: #0f172a;
                background: #ffffff;
                font-size: 12px;
                line-height: 1.45;
            }
            .print-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 14px;
                margin-bottom: 18px;
                border-bottom: 3px solid #0d9488;
            }
            .brand {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .brand-mark {
                width: 46px;
                height: 46px;
                border-radius: 12px;
                background: #ccfbf1;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #0f766e;
                font-weight: 800;
                font-size: 18px;
            }
            .brand h1 {
                margin: 0;
                font-size: 22px;
                color: #0f172a;
            }
            .brand p,
            .print-meta p {
                margin: 2px 0;
                color: #64748b;
            }
            .print-meta {
                text-align: right;
                font-size: 11px;
            }
            .document-title {
                margin: 0 0 14px;
                padding: 10px 12px;
                border-left: 4px solid #0d9488;
                background: #f0fdfa;
                color: #0f172a;
                font-size: 18px;
            }
            .report-dashboard {
                break-inside: avoid;
                page-break-inside: avoid;
                border: 1px solid #cbd5e1 !important;
                border-radius: 10px !important;
                background: #ffffff !important;
                padding: 16px !important;
                margin: 0 0 14px !important;
                box-shadow: none !important;
            }
            .report-header {
                border-bottom: 1px solid #cbd5e1 !important;
                padding-bottom: 10px !important;
                margin-bottom: 14px !important;
            }
            .report-header h3 {
                display: flex;
                align-items: center;
                gap: 6px;
                margin: 0 0 4px !important;
                color: #0f172a;
                font-size: 16px;
            }
            .report-header p {
                margin: 0 !important;
                color: #475569;
                font-size: 11px;
            }
            .report-kpi-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin: 12px 0;
            }
            .report-kpi-card {
                break-inside: avoid;
                page-break-inside: avoid;
                border: 1px solid #dbeafe;
                border-radius: 8px;
                background: #f8fafc !important;
                padding: 10px;
                min-height: 82px;
            }
            .report-kpi-card span {
                display: block;
                margin-bottom: 4px;
                color: #475569;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.03em;
                text-transform: uppercase;
            }
            .report-kpi-card strong {
                display: block;
                margin-bottom: 4px;
                color: #0f172a;
                font-size: 22px;
                line-height: 1.1;
            }
            .report-kpi-card small {
                display: block;
                color: #64748b;
                font-size: 10px;
                line-height: 1.35;
            }
            .report-detail-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-top: 12px;
            }
            .report-detail-card {
                break-inside: avoid;
                page-break-inside: avoid;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background: #f8fafc !important;
                padding: 10px;
            }
            .report-detail-card h4 {
                display: flex;
                align-items: center;
                gap: 5px;
                margin: 0 0 8px !important;
                color: #0f172a;
                font-size: 13px;
            }
            .report-list {
                display: grid;
                gap: 6px;
            }
            .report-list-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
            }
            .report-list-row:last-child {
                border-bottom: 0;
                padding-bottom: 0;
            }
            .report-list-row strong {
                color: #0f172a;
                font-weight: 700;
            }
            .section-card,
            .card,
            .doctor-patient-card,
            .medical-summary-card,
            .schedule-card,
            .clinic-list-item,
            .report-section,
            .record-detail-item {
                break-inside: avoid;
                page-break-inside: avoid;
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 8px !important;
                background: #ffffff !important;
            }
            .section-card,
            .card {
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
            }
            .section-header {
                display: block !important;
                margin-bottom: 12px !important;
                padding-bottom: 8px !important;
                border-bottom: 1px solid #cbd5e1 !important;
            }
            .section-header h3,
            h3,
            h4 {
                margin-top: 0;
                color: #0f172a;
            }
            .section-subtitle {
                display: block;
                margin: 3px 0 0 !important;
                color: #64748b;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 12px;
            }
            th {
                background: #f1f5f9;
                color: #0f172a;
                font-weight: 700;
            }
            th,
            td {
                border: 1px solid #cbd5e1;
                padding: 8px;
                text-align: left;
                vertical-align: top;
            }
            .schedule-list,
            .doctor-patient-grid,
            .medical-record-grid {
                display: grid;
                gap: 10px;
            }
            .schedule-card {
                display: grid;
                grid-template-columns: 74px 1fr;
                gap: 12px;
                padding: 12px !important;
                margin-bottom: 10px;
            }
            .schedule-date-box {
                border: 1px solid #99f6e4;
                border-radius: 8px;
                background: #f0fdfa !important;
                color: #0f766e;
                text-align: center;
                padding: 10px 6px;
            }
            .schedule-date-box span {
                display: block;
                font-size: 22px;
                font-weight: 800;
            }
            .schedule-date-box strong {
                font-size: 11px;
            }
            .schedule-title-row,
            .patient-card-header,
            .medical-summary-header,
            .clinic-list-item {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 10px;
            }
            .patient-meta-grid,
            .record-detail-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin: 10px 0;
            }
            .patient-meta-grid div,
            .medical-summary-body div,
            .record-detail-item {
                padding: 8px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                background: #f8fafc !important;
            }
            .record-detail-item.full {
                grid-column: 1 / -1;
            }
            .clinic-status,
            .role-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 999px;
                border: 1px solid #99f6e4;
                color: #0f766e !important;
                background: #f0fdfa !important;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
            }
            .patient-card-actions,
            .data-actions,
            button,
            .btn-primary,
            .btn-secondary,
            .btn-save,
            .btn-cancel-modal,
            .search-bar,
            .doctor-toolbar,
            .report-menu,
            .report-buttons,
            .toast-container,
            .pagination {
                display: none !important;
            }
            .empty,
            .empty-state {
                padding: 18px;
                border: 1px dashed #cbd5e1;
                border-radius: 8px;
                color: #64748b;
                text-align: center;
            }
            .print-footer {
                margin-top: 24px;
                padding-top: 10px;
                border-top: 1px solid #cbd5e1;
                color: #64748b;
                font-size: 10px;
                text-align: center;
            }
        </style>
    `;

    printWindow.document.write('<!doctype html><html><head><title>' + sectionTitle + '</title>' + styles + '</head><body>');
    printWindow.document.write(`
        <header class="print-header">
            <div class="brand">
                <div class="brand-mark">HD</div>
                <div>
                    <h1>HealthDesk</h1>
                    <p>Hospital Management System</p>
                </div>
            </div>
            <div class="print-meta">
                <p><strong>Printed:</strong> ${printDate}</p>
                <p><strong>Prepared by:</strong> ${printedBy}</p>
            </div>
        </header>
        <h2 class="document-title">${sectionTitle}</h2>
    `);
    printWindow.document.write(clone.outerHTML);
    printWindow.document.write('<div class="print-footer">Generated by HealthDesk Hospital Management System</div></body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
    }, 250);
}

window.printSection = printSection;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function displayPatientId(id) {
    if (!id) return 'N/A';
    const cleanId = String(id).trim();
    if (!cleanId) return 'N/A';
    if (/^P\d{3,}$/i.test(cleanId)) return cleanId.toUpperCase();
    const compact = cleanId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `HD-${compact.slice(-6) || cleanId}`;
}

function setupResponsiveSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuButton = document.getElementById('mobileMenuBtn');
    if (!sidebar || !menuButton || menuButton.dataset.sidebarReady === 'true') return;

    menuButton.dataset.sidebarReady = 'true';
    menuButton.setAttribute('aria-controls', 'sidebar');
    menuButton.setAttribute('aria-expanded', 'false');

    sidebar.querySelectorAll('.nav-item, .logout-item').forEach(item => {
        const label = item.querySelector('span')?.textContent?.trim() || item.textContent.trim();
        if (label) {
            item.dataset.label = label;
            item.setAttribute('title', label);
        }
    });

    let desktopButton = sidebar.querySelector('.sidebar-collapse-btn');
    if (!desktopButton) {
        desktopButton = document.createElement('button');
        desktopButton.type = 'button';
        desktopButton.className = 'sidebar-collapse-btn';
        desktopButton.setAttribute('aria-label', 'Collapse sidebar');
        desktopButton.dataset.label = 'Collapse';
        desktopButton.innerHTML = '<i class="fas fa-angle-left"></i><span>Collapse</span>';
        const footer = sidebar.querySelector('.sidebar-footer');
        if (footer) {
            footer.prepend(desktopButton);
        } else {
            sidebar.appendChild(desktopButton);
        }
    }

    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    const closeMobileSidebar = () => {
        sidebar.classList.remove('active');
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        menuButton.setAttribute('aria-expanded', 'false');
    };
    const openMobileSidebar = () => {
        sidebar.classList.add('active');
        sidebar.classList.add('open');
        document.body.classList.add('sidebar-open');
        menuButton.setAttribute('aria-expanded', 'true');
    };
    const toggleDesktopSidebar = () => {
        const collapsed = document.body.classList.toggle('sidebar-collapsed');
        desktopButton.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        desktopButton.dataset.label = collapsed ? 'Expand' : 'Collapse';
        desktopButton.innerHTML = collapsed
            ? '<i class="fas fa-angle-right"></i><span>Expand</span>'
            : '<i class="fas fa-angle-left"></i><span>Collapse</span>';
    };

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (sidebar.classList.contains('active')) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    });

    desktopButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!isMobile()) toggleDesktopSidebar();
    });

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            if (isMobile()) closeMobileSidebar();
        });
    });

    document.addEventListener('click', (event) => {
        if (!isMobile() || !sidebar.classList.contains('active')) return;
        if (sidebar.contains(event.target) || menuButton.contains(event.target)) return;
        closeMobileSidebar();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMobileSidebar();
    });

    window.addEventListener('resize', () => {
        if (!isMobile()) closeMobileSidebar();
    });
}
