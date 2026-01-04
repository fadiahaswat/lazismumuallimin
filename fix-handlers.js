// Fix: Pastikan event handlers ter-attach setelah DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Fix missing handler untuk btn-hubungi-hero
    const btnHubungi = document.getElementById('btn-hubungi-hero');
    if (btnHubungi && !btnHubungi.onclick) {
        btnHubungi.onclick = () => {
            document.getElementById('hubungi-modal').classList.remove('hidden');
        };
    }

    // Fix: Set max date untuk filter
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('filter-start-date');
    const endDate = document.getElementById('filter-end-date');
    
    if (startDate) startDate.max = today;
    if (endDate) endDate.max = today;
});
