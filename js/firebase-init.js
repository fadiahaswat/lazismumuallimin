// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from '../config.js';
import { SantriManager, santriDB } from './santri-manager.js';
import { currentUser, setCurrentUser, donasiData } from './state.js';
import { showToast } from './utils.js';
import { loadPersonalDashboard, renderDashboardProfil } from './feature-history.js';

// Init Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Listen for Auth Changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        localStorage.removeItem('lazismu_user_santri');
        updateUIForLogin(user);
    } else {
        const santriSession = localStorage.getItem('lazismu_user_santri');
        if (santriSession) {
            try {
                const santriUser = JSON.parse(santriSession);
                updateUIForLogin(santriUser);
            } catch (error) {
                console.error("Failed to parse santri session:", error);
                localStorage.removeItem('lazismu_user_santri');
                updateUIForLogout();
            }
        } else {
            updateUIForLogout();
        }
    }
});

// -- Auth Functions --

export async function loginWithGoogle() {
    window.closeLoginModal();
    const label = document.getElementById('label-login');
    if(label) label.innerText = "Memproses...";

    try {
        const result = await signInWithPopup(auth, provider);
        const googleUser = result.user;
        
        const linkedNIS = SantriManager.findNisByEmail(googleUser.email);

        if (linkedNIS && window.santriData) {
            const santri = window.santriData.find(s => String(s.nis) === String(linkedNIS));
            if (santri) {
                const prefs = SantriManager.getPrefs(linkedNIS);
                const mockUser = {
                    uid: "nis_" + santri.nis,
                    displayName: santri.nama,
                    email: googleUser.email,
                    photoURL: prefs.avatar || googleUser.photoURL,
                    isSantri: true,
                    rombel: santri.kelas || santri.rombel,
                    nis: santri.nis,
                    linkedEmail: googleUser.email
                };
                
                localStorage.setItem('lazismu_user_santri', JSON.stringify(mockUser));
                updateUIForLogin(mockUser);
                showToast(`Login via Google berhasil (Terhubung ke NIS ${linkedNIS})`, 'success');
                return; 
            }
        }
    } catch (error) {
        console.error(error);
        showToast("Gagal login Google", 'error');
    } finally {
        if(label) label.innerText = "Masuk Akun";
    }
}

export function loginWithNIS() {
    const nisInput = document.getElementById('login-nis').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();

    if (!nisInput || !passInput) return showToast("Mohon isi NIS dan Password", "warning");

    if (typeof window.santriData === 'undefined' || window.santriData.length === 0) {
        return showToast("Data Santri sedang dimuat...", "warning");
    }

    const santri = window.santriData.find(s => String(s.nis) === String(nisInput));

    if (santri) {
        const prefs = SantriManager.getPrefs(santri.nis);
        const validPassword = prefs.password ? (prefs.password === passInput) : (String(santri.nis) === passInput);

        if (validPassword) {
            const avatarUrl = prefs.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(santri.nama)}&background=10b981&color=fff`;

            const mockUser = {
                uid: "nis_" + santri.nis,
                displayName: santri.nama,
                email: santri.nis + "@santri.muallimin", 
                photoURL: avatarUrl,
                isSantri: true, 
                rombel: santri.kelas || santri.rombel,
                nis: santri.nis,
                linkedEmail: prefs.linkedEmail
            };

            localStorage.setItem('lazismu_user_santri', JSON.stringify(mockUser));
            updateUIForLogin(mockUser);
            renderDashboardProfil(santri.nis); 
            window.closeLoginModal();
            const firstName = santri.nama ? santri.nama.split(' ')[0] : 'Santri';
            showToast(`Ahlan Wa Sahlan, ${firstName}!`, 'success');

        } else {
            showToast("Password salah.", "error");
        }
    } else {
        showToast("NIS tidak ditemukan", "error");
    }
}

export function doLogout() {
    signOut(auth).then(() => {
        localStorage.removeItem('lazismu_user_santri');
        showToast("Berhasil keluar", 'success');
        updateUIForLogout(); 
        window.location.hash = "#home";
        window.location.reload();
    }).catch((error) => {
        console.error("Logout error:", error);
        showToast("Gagal keluar, silakan coba lagi", 'error');
    });
}

// -- UI Update Helper Functions --

export function updateUIForLogin(user) {
    setCurrentUser(user);

    // Header & Menu UI
    const btnWrapper = document.getElementById('login-btn-wrapper');
    const profileMenu = document.getElementById('user-profile-menu');
    const santriMenu = document.getElementById('santri-menu-options');
    const googleIndicator = document.getElementById('google-linked-indicator');

    if (btnWrapper) btnWrapper.style.display = 'none';
    if (profileMenu) {
        profileMenu.classList.remove('hidden');
        profileMenu.classList.add('flex');
    }
    if (santriMenu) {
        user.isSantri ? santriMenu.classList.remove('hidden') : santriMenu.classList.add('hidden');
    }
    if (googleIndicator) {
        (user.linkedEmail || (user.providerData && user.providerData.length > 0)) ? googleIndicator.classList.remove('hidden') : googleIndicator.classList.add('hidden');
    }

    // Avatar & Text
    if(document.getElementById('user-avatar')) document.getElementById('user-avatar').src = user.photoURL;
    if(document.getElementById('user-name')) document.getElementById('user-name').textContent = user.displayName;
    if(document.getElementById('user-role')) document.getElementById('user-role').textContent = user.isSantri ? `Santri - ${user.rombel}` : "Donatur Umum";
    if(document.getElementById('mobile-user-name')) document.getElementById('mobile-user-name').textContent = user.displayName;
    if(document.getElementById('mobile-user-role')) document.getElementById('mobile-user-role').textContent = user.isSantri ? `Santri - ${user.rombel}` : "Donatur Umum";
    if(document.getElementById('dash-avatar')) document.getElementById('dash-avatar').src = user.photoURL;
    if(document.getElementById('dash-name')) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'User';
        document.getElementById('dash-name').innerText = firstName;
    }

    // Form Autofill
    const inputNama = document.getElementById('nama-muzakki-input');
    const inputEmail = document.getElementById('email');
    
    if(inputNama) inputNama.value = user.displayName;
    if(inputEmail) {
        if (!user.isSantri) { 
            inputEmail.value = user.email;
            inputEmail.readOnly = true;
            inputEmail.classList.add('bg-slate-100', 'text-slate-500');
        } else {
            if (user.linkedEmail) inputEmail.value = user.linkedEmail;
            inputEmail.readOnly = false;
            inputEmail.classList.remove('bg-slate-100', 'text-slate-500');
        }
    }

    // Santri Hierarchy Logic
    if (user.isSantri) {
        donasiData.donaturTipe = 'santri';
        donasiData.nisSantri = user.nis;
        donasiData.rombelSantri = user.rombel;

        const radioSantri = document.querySelector('input[name="donatur-tipe"][value="santri"]');
        if (radioSantri) {
            radioSantri.checked = true;
            const santriDetails = document.getElementById('santri-details');
            if (santriDetails) santriDetails.classList.remove('hidden');
        }

        const levelSelect = document.getElementById('santri-level-select');
        const rombelSelect = document.getElementById('santri-rombel-select');
        const namaSelect = document.getElementById('santri-nama-select');
        
        const currentLevel = user.rombel.charAt(0); 

        if (levelSelect) levelSelect.value = currentLevel;

        if (rombelSelect && santriDB[currentLevel]) {
            let rombelHtml = '<option value="">Pilih Rombel</option>';
            Object.keys(santriDB[currentLevel]).forEach(r => {
                rombelHtml += `<option value="${r}">${r}</option>`;
            });
            rombelSelect.innerHTML = rombelHtml;
            rombelSelect.disabled = false;
            rombelSelect.value = user.rombel;
        }

        if (namaSelect && santriDB[currentLevel] && santriDB[currentLevel][user.rombel]) {
            let namaHtml = '<option value="">Pilih Nama Santri</option>';
            let exactValueToSelect = "";
            let exactName = user.displayName;

            santriDB[currentLevel][user.rombel].forEach(s => {
                const val = `${s.nama}::${s.nis}::${s.rombel}`;
                namaHtml += `<option value="${val}">${s.nama}</option>`;

                if (String(s.nis) === String(user.nis)) {
                    exactValueToSelect = val;
                    exactName = s.nama;
                }
            });

            namaSelect.innerHTML = namaHtml;
            namaSelect.disabled = false;
            
            if (exactValueToSelect) {
                namaSelect.value = exactValueToSelect;
                donasiData.namaSantri = exactName;
            }
        }

        const radioName = document.querySelector('input[name="nama-choice"][value="santri"]');
        if (radioName) {
            radioName.disabled = false; 
            radioName.checked = true;   
        }

        if (inputNama) {
            inputNama.value = `A/n Santri: ${donasiData.namaSantri || user.displayName}`;
            inputNama.readOnly = true;
            inputNama.classList.add('bg-slate-100', 'text-slate-500'); 
        }
    }

    const suggestionCard = document.getElementById('login-suggestion-card');
    if (suggestionCard) suggestionCard.classList.add('hidden');
    
    const dashboardId = user.linkedEmail || user.email || user.uid;
    loadPersonalDashboard(dashboardId);

    if (user.isSantri && user.nis) {
        renderDashboardProfil(user.nis);
    }
}

export function updateUIForLogout() {
    setCurrentUser(null);

    const btnWrapper = document.getElementById('login-btn-wrapper');
    const profileMenu = document.getElementById('user-profile-menu');
    
    if (btnWrapper) btnWrapper.style.display = 'block';
    if (profileMenu) {
        profileMenu.classList.add('hidden');
        profileMenu.classList.remove('flex');
    }

    const label = document.getElementById('label-login');
    if(label) label.innerText = "Masuk Akun";

    const inputNama = document.getElementById('nama-muzakki-input');
    const inputEmail = document.getElementById('email');
    if(inputNama) inputNama.value = '';
    if(inputEmail) {
        inputEmail.value = '';
        inputEmail.readOnly = false;
        inputEmail.classList.remove('bg-slate-100', 'text-slate-500');
    }
}

// Link Google Logic (For Santri)
export async function linkGoogleAccount() {
    if (!currentUser || !currentUser.isSantri) return;
    
    if (currentUser.linkedEmail) {
        return showToast(`Sudah terhubung dengan: ${currentUser.linkedEmail}`, "info");
    }

    window.toggleUserDropdown();
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const existingLink = SantriManager.findNisByEmail(user.email);
        if (existingLink && existingLink !== currentUser.nis) {
            return showToast("Email Google ini sudah dipakai santri lain.", "error");
        }

        SantriManager.savePrefs(currentUser.nis, { linkedEmail: user.email });
        
        currentUser.linkedEmail = user.email;
        localStorage.setItem('lazismu_user_santri', JSON.stringify(currentUser));
        
        updateUIForLogin(currentUser);
        showToast("Akun Google berhasil dihubungkan!", "success");

    } catch (error) {
        console.error(error);
        showToast("Gagal menghubungkan akun.", "error");
    }
}
