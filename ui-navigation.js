import { showToast } from './utils.js';
import { loadRiwayat } from './feature-history.js';
import { fetchNews } from './feature-news.js'; // Hapus newsState dari sini
import { currentUser, newsState } from './state.js'; // Tambahkan newsState di sini
import { SantriManager } from './santri-manager.js';

// Flag to prevent duplicate hashchange listeners
let hashchangeListenerAdded = false;

export function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => {
        p.style.display = 'none';
        p.style.opacity = 0;
        p.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Reset wizard steps when opening donation page to prevent state persistence
    if (pageId === 'donasi') {
        document.querySelectorAll('.donasi-step-container').forEach(s => {
            s.classList.add('hidden');
        });
        
        // Show step 1 by default
        const step1 = document.getElementById('donasi-step-1');
        if (step1) step1.classList.remove('hidden');
        
        // Tampilkan wizard dan sembunyikan payment instructions
        const wizard = document.getElementById('donasi-wizard');
        if (wizard) wizard.classList.remove('hidden');
        
        const paymentInstr = document.getElementById('donasi-payment-instructions');
        if (paymentInstr) paymentInstr.classList.add('hidden');
    }

    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.style.display = 'block';
        void target.offsetWidth;
        target.style.opacity = 1;
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update URL hash to preserve page on refresh
        // Note: replaceState doesn't trigger hashchange events
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash !== pageId) {
            history.replaceState(null, '', `#${pageId}`);
        }
    }

    const navLink = document.querySelector(`a[href="#${pageId}"]`);
    if (navLink) navLink.classList.add('active');

    if (pageId === 'riwayat' || pageId === 'home') loadRiwayat();
    
    // newsState sekarang sudah diimpor dengan benar dari state.js
    if (pageId === 'berita' && !newsState.isLoaded) fetchNews();
}

export function scrollToSection(sectionId) {
    showPage('home');
    setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

export function setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const menuLinks = document.getElementById('menu-links');
    if (menuToggle && menuLinks) {
        menuToggle.onclick = () => {
            menuLinks.classList.toggle('hidden');
        };
    }
    
    // Handle browser back/forward button navigation (only add listener once)
    if (!hashchangeListenerAdded) {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '') || 'home';
            if (document.getElementById(`page-${hash}`)) {
                showPage(hash);
            }
        });
        hashchangeListenerAdded = true;
    }
}

export function setupModalLogic() {
    const modal = document.getElementById('hubungi-modal');
    const btn = document.getElementById('btn-hubungi-hero');
    const close = document.getElementById('hubungi-modal-close');

    if (btn) btn.onclick = () => modal.classList.remove('hidden');
    if (close) close.onclick = () => modal.classList.add('hidden');

    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        }
    }
}

// Auth Modals
export function toggleUserDropdown() {
    const menu = document.getElementById('user-dropdown-content');
    if (menu) menu.classList.toggle('hidden');
}

export function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown-content');
    if (dropdown) dropdown.classList.toggle('hidden');
}

// Change Password UI
export function openChangePassModal() {
    toggleUserDropdown();
    const modal = document.getElementById('pass-modal');
    const pass1 = document.getElementById('new-pass-1');
    const pass2 = document.getElementById('new-pass-2');
    
    if (!modal) {
        console.error("Password modal not found");
        return;
    }
    
    modal.classList.remove('hidden');
    if (pass1) pass1.value = '';
    if (pass2) pass2.value = '';
}

export function saveNewPassword() {
    if (!currentUser || !currentUser.isSantri) return;

    const p1El = document.getElementById('new-pass-1');
    const p2El = document.getElementById('new-pass-2');
    
    if (!p1El || !p2El) {
        console.error("Password input fields not found");
        return;
    }
    
    const p1 = p1El.value;
    const p2 = p2El.value;

    if (!p1 || !p2) return showToast("Password tidak boleh kosong", "warning");
    if (p1 !== p2) return showToast("Konfirmasi password tidak cocok", "error");
    if (p1.length < 4) return showToast("Password minimal 4 karakter", "warning");

    SantriManager.savePrefs(currentUser.nis, { password: p1 });
    
    showToast("Password berhasil diganti!", "success");
    const modal = document.getElementById('pass-modal');
    if (modal) modal.classList.add('hidden');
}

// Avatar UI
export function openAvatarModal() {
    toggleUserDropdown();
    const modal = document.getElementById('avatar-modal');
    if(modal) modal.classList.remove('hidden');

    const emojis = ["😎", "🤓", "🤠", "😊", "😇", "🤖", "👻", "🐯", "🐱", "🐶", "🦁", "🐼", "🐸", "🎓", "🕌", "🚀", "⭐", "🔥", "⚽", "🎨"];
    const grid = document.getElementById('emoji-grid');
    if(!grid) return;
    
    grid.innerHTML = '';

    emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = "text-3xl hover:scale-110 hover:bg-orange-100 transition p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm cursor-pointer";
        btn.innerHTML = emoji;
        btn.onclick = function() { saveAvatar(emoji); };
        grid.appendChild(btn);
    });
}

export function saveAvatar(emoji) {
    if (!currentUser || !currentUser.isSantri) return;

    const svgString = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
        <style>text{font-family:sans-serif}</style>
        <rect width='100%' height='100%' fill='#f1f5f9'/>
        <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='70'>${emoji}</text>
    </svg>`;
    
    const avatarUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;

    SantriManager.savePrefs(currentUser.nis, { avatar: avatarUrl });
    
    const imgEl = document.getElementById('user-avatar');
    if(imgEl) imgEl.src = avatarUrl;
    const dashEl = document.getElementById('dash-avatar');
    if(dashEl) dashEl.src = avatarUrl;
    
    currentUser.photoURL = avatarUrl;
    
    try {
        localStorage.setItem('lazismu_user_santri', JSON.stringify(currentUser));
    } catch (error) {
        console.error("Failed to save user to localStorage:", error);
        showToast("Avatar berhasil diganti, tetapi gagal menyimpan ke cache", "warning");
    }

    showToast("Avatar berhasil diganti!", "success");
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.classList.add('hidden');
}

export function hideLoginSuggestion() {
    const card = document.getElementById('login-suggestion-card');
    if (card) card.classList.add('hidden');
    const inputNama = document.getElementById('nama-muzakki-input');
    if(inputNama) inputNama.focus();
}
