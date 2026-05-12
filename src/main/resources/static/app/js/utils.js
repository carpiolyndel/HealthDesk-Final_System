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
