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

    const styles = `
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            table, th, td { border: 1px solid #ccc; }
            th, td { padding: 8px; text-align: left; }
            h1, h2, h3, h4, h5, h6, p, div { color: #0f172a; }
            button, .btn-primary, .btn-secondary, .btn-save, .btn-cancel-modal, .search-bar, .report-buttons, .section-header button, .toast-container { display: none !important; }
        </style>
    `;

    printWindow.document.write('<html><head><title>Print Preview</title>' + styles + '</head><body>');
    printWindow.document.write(section.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

window.printSection = printSection;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}