// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from './config.js';
import { SantriManager, santriDB } from './santri-manager.js';
import { currentUser, setCurrentUser, donasiData } from './state.js';
import { showToast } from './utils.js';
import { loadPersonalDashboard, renderDashboardProfil } from './feature-history.js';

// Init Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Session expiration time (7 days in milliseconds)
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Login rate limiting to prevent brute force attacks
const LOGIN_RATE_LIMIT = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    storageKey: 'login_attempts'
};

/**
 * Check and record login attempt for rate limiting
 * @returns {Object} { allowed: boolean, remainingTime: number, message: string }
 */
function checkLoginRateLimit() {
    const now = Date.now();
    let attempts = [];
    
    try {
        const stored = localStorage.getItem(LOGIN_RATE_LIMIT.storageKey);
        if (stored) {
            attempts = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error reading login attempts:', error);
    }
    
    // Filter out old attempts outside the time window
    attempts = attempts.filter(timestamp => now - timestamp < LOGIN_RATE_LIMIT.windowMs);
    
    // Check if limit exceeded
    if (attempts.length >= LOGIN_RATE_LIMIT.maxAttempts) {
        const oldestAttempt = Math.min(...attempts);
        const resetTime = oldestAttempt + LOGIN_RATE_LIMIT.windowMs;
        const remainingMs = resetTime - now;
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        
        return {
            allowed: false,
            remainingTime: remainingMinutes,
            message: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${remainingMinutes} menit.`
        };
    }
    
    // Record this attempt
    attempts.push(now);
    localStorage.setItem(LOGIN_RATE_LIMIT.storageKey, JSON.stringify(attempts));
    
    return { allowed: true };
}

/**
 * Clear login rate limit (called on successful login)
 */
function clearLoginRateLimit() {
    localStorage.removeItem(LOGIN_RATE_LIMIT.storageKey);
}

/**
 * Check if a session has expired
 * @param {Object} session - Session object with loginTime
 * @returns {boolean} - True if session is still valid
 */
function isSessionValid(session) {
    if (!session || !session.loginTime) {
        return false;
    }
    const now = Date.now();
    const elapsed = now - session.loginTime;
    return elapsed < SESSION_EXPIRY_MS;
}

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
                
                // Check if session has expired
                if (!isSessionValid(santriUser)) {
                    console.log("Session expired, logging out");
                    localStorage.removeItem('lazismu_user_santri');
                    updateUIForLogout();
                    showToast("Sesi Anda telah berakhir. Silakan login kembali.", "warning");
                    return;
                }
                
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
                    linkedEmail: googleUser.email,
                    loginTime: Date.now() // Add session timestamp
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

/**
 * Simple password hashing function (matches ui-navigation.js)
 * NOTE: This is NOT cryptographically secure. For production, use a proper
 * server-side authentication system with bcrypt or Argon2.
 */
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const salted = hash ^ 0xDEADBEEF;
    return 'H' + Math.abs(salted).toString(36);
}

export function loginWithNIS() {
    const nisInput = document.getElementById('login-nis').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();

    if (!nisInput || !passInput) return showToast("Mohon isi NIS dan Password", "warning");

    // Check rate limit to prevent brute force attacks
    const rateCheck = checkLoginRateLimit();
    if (!rateCheck.allowed) {
        return showToast(rateCheck.message, "error");
    }

    if (typeof window.santriData === 'undefined' || window.santriData.length === 0) {
        return showToast("Data Santri sedang dimuat...", "warning");
    }

    const santri = window.santriData.find(s => String(s.nis) === String(nisInput));

    if (santri) {
        const prefs = SantriManager.getPrefs(santri.nis);
        
        // Check password: support both hashed and plain-text for migration
        // If stored password starts with 'H', it's hashed
        let validPassword = false;
        if (prefs.password) {
            if (prefs.password.startsWith('H')) {
                // Hashed password - compare hashes
                validPassword = prefs.password === hashPassword(passInput);
            } else {
                // Legacy plain-text password - compare directly and migrate
                validPassword = prefs.password === passInput;
                if (validPassword) {
                    // Migrate to hashed password
                    SantriManager.savePrefs(santri.nis, { password: hashPassword(passInput) });
                }
            }
        } else {
            // Default password is NIS
            const defaultHash = hashPassword(String(santri.nis));
            validPassword = hashPassword(passInput) === defaultHash;
            if (validPassword) {
                // Store the hashed default password
                SantriManager.savePrefs(santri.nis, { password: defaultHash });
            }
        }

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
                linkedEmail: prefs.linkedEmail,
                loginTime: Date.now() // Add session timestamp
            };

            // Clear rate limit on successful login
            clearLoginRateLimit();
            
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
