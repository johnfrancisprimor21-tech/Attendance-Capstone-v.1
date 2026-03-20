// ============================================
// PIN AUTHENTICATION SYSTEM
// ============================================

const PIN_STORAGE_KEY = 'attendanceSystemPin';
const PIN_LENGTH = 4;

let currentMode = 'login';
let loginPin = '';
let setupPin1 = '';
let setupPin2 = '';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkPinStatus();
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Setup form
    document.getElementById('setupForm').addEventListener('submit', handleSetup);
}

function checkPinStatus() {
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    
    if (storedPin) {
        // PIN already exists, show login mode
        document.getElementById('setupMode').style.display = 'none';
        document.querySelector('[data-mode="setup"]').disabled = true;
    } else {
        // No PIN exists, show setup mode
        switchMode('setup');
    }
}

// ============================================
// MODE SWITCHING
// ============================================

function switchMode(mode) {
    currentMode = mode;
    
    // Update UI
    document.querySelectorAll('.form-mode').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.toggle-btn').forEach(el => el.classList.remove('active'));
    
    if (mode === 'login') {
        document.getElementById('loginMode').classList.add('active');
        document.querySelector('[data-mode="login"]').classList.add('active');
        clearLoginPin();
    } else if (mode === 'setup') {
        document.getElementById('setupMode').classList.add('active');
        document.querySelector('[data-mode="setup"]').classList.add('active');
        clearSetupPin('step1');
        clearSetupPin('step2');
    }
    
    clearMessages();
}

// ============================================
// LOGIN MODE - PIN INPUT
// ============================================

function appendPin(digit) {
    if (loginPin.length < PIN_LENGTH) {
        loginPin += digit;
        updatePinDisplay('pinDisplay', loginPin);
        
        // Auto-submit when PIN is complete
        if (loginPin.length === PIN_LENGTH) {
            setTimeout(() => {
                document.getElementById('loginForm').requestSubmit();
            }, 300);
        }
    }
}

function deletePin() {
    if (loginPin.length > 0) {
        loginPin = loginPin.slice(0, -1);
        updatePinDisplay('pinDisplay', loginPin);
    }
}

function clearPin() {
    loginPin = '';
    updatePinDisplay('pinDisplay', loginPin);
}

function clearLoginPin() {
    loginPin = '';
    updatePinDisplay('pinDisplay', loginPin);
    document.getElementById('loginPin').value = '';
    clearMessages();
}

// ============================================
// SETUP MODE - PIN INPUT
// ============================================

function appendSetupPin(digit, step) {
    const fieldId = step === 'step1' ? 'setupPin1' : 'setupPin2';
    const displayId = step === 'step1' ? 'setupPin1Display' : 'setupPin2Display';
    const currentPin = step === 'step1' ? setupPin1 : setupPin2;
    
    if (currentPin.length < PIN_LENGTH) {
        if (step === 'step1') {
            setupPin1 += digit;
        } else {
            setupPin2 += digit;
        }
        updatePinDisplay(displayId, step === 'step1' ? setupPin1 : setupPin2);
    }
}

function deleteSetupPin(step) {
    const displayId = step === 'step1' ? 'setupPin1Display' : 'setupPin2Display';
    
    if (step === 'step1') {
        if (setupPin1.length > 0) {
            setupPin1 = setupPin1.slice(0, -1);
            updatePinDisplay(displayId, setupPin1);
        }
    } else {
        if (setupPin2.length > 0) {
            setupPin2 = setupPin2.slice(0, -1);
            updatePinDisplay(displayId, setupPin2);
        }
    }
}

function clearSetupPin(step) {
    const displayId = step === 'step1' ? 'setupPin1Display' : 'setupPin2Display';
    const fieldId = step === 'step1' ? 'setupPin1' : 'setupPin2';
    
    if (step === 'step1') {
        setupPin1 = '';
    } else {
        setupPin2 = '';
    }
    
    updatePinDisplay(displayId, '');
    document.getElementById(fieldId).value = '';
}

function moveToStep2() {
    if (setupPin1.length !== PIN_LENGTH) {
        showError('setupError', 'Please enter a 4-digit PIN');
        return;
    }
    
    // Hide step 1, show step 2
    document.getElementById('setupStep1').classList.remove('active');
    document.getElementById('step1').classList.remove('active');
    
    document.getElementById('setupStep2').classList.add('active');
    document.getElementById('step2').classList.add('active');
    
    clearMessages();
}

function backToStep1() {
    // Hide step 2, show step 1
    document.getElementById('setupStep2').classList.remove('active');
    document.getElementById('step2').classList.remove('active');
    
    document.getElementById('setupStep1').classList.add('active');
    document.getElementById('step1').classList.add('active');
    
    clearSetupPin('step2');
    clearMessages();
}

// ============================================
// PIN DISPLAY UPDATE
// ============================================

function updatePinDisplay(displayId, pin) {
    const dots = document.querySelectorAll(`#${displayId} .pin-dot`);
    
    dots.forEach((dot, index) => {
        if (index < pin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

// ============================================
// FORM SUBMISSIONS
// ============================================

function handleLogin(event) {
    event.preventDefault();
    
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    
    if (!storedPin) {
        showError('loginError', 'No PIN set. Please set up a PIN first.');
        return;
    }
    
    if (loginPin === storedPin) {
        showSuccess('loginSuccess', 'PIN verified! Redirecting...');
        showToast('✓ Successfully logged in', 'success');
        
        // Store login session
        sessionStorage.setItem('pinAuthenticated', 'true');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Redirect after 1.5 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        loginPin = '';
        updatePinDisplay('pinDisplay', loginPin);
        showError('loginError', '❌ Incorrect PIN. Please try again.');
        showToast('Incorrect PIN', 'error');
    }
}

function handleSetup(event) {
    event.preventDefault();
    
    if (setupPin1.length !== PIN_LENGTH) {
        showError('setupError', 'Please enter a 4-digit PIN');
        return;
    }
    
    if (setupPin2.length !== PIN_LENGTH) {
        showError('setupError', 'Please confirm your PIN');
        return;
    }
    
    if (setupPin1 !== setupPin2) {
        showError('setupError', '❌ PINs do not match. Please try again.');
        clearSetupPin('step2');
        showToast('PINs do not match', 'error');
        return;
    }
    
    // Store PIN in localStorage
    localStorage.setItem(PIN_STORAGE_KEY, setupPin1);
    
    showSuccess('setupSuccess', '✓ PIN created successfully!');
    showToast('PIN setup complete', 'success');
    
    // Reset form
    setTimeout(() => {
        setupPin1 = '';
        setupPin2 = '';
        clearSetupPin('step1');
        clearSetupPin('step2');
        
        // Switch to login mode
        checkPinStatus();
        switchMode('login');
    }, 2000);
}

// ============================================
// FORGOT PIN / RESET
// ============================================

function resetPin() {
    if (confirm('⚠️ This will delete your current PIN. You will need to create a new one. Continue?')) {
        localStorage.removeItem(PIN_STORAGE_KEY);
        clearLoginPin();
        showToast('PIN deleted. Set up a new PIN.', 'info');
        
        setTimeout(() => {
            checkPinStatus();
            switchMode('setup');
        }, 1000);
    }
}

// ============================================
// MESSAGE HANDLING
// ============================================

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function showSuccess(elementId, message) {
    const successEl = document.getElementById(elementId);
    successEl.textContent = message;
    successEl.classList.add('show');
}

function clearMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// SECURITY FEATURES
// ============================================

// Prevent developer tools access to PIN
document.addEventListener('keydown', (event) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && event.key === 'I') ||
        (event.ctrlKey && event.shiftKey && event.key === 'J') ||
        (event.ctrlKey && event.shiftKey && event.key === 'C')
    ) {
        event.preventDefault();
    }
});

// Disable right-click context menu
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    return false;
});

// Auto-logout after inactivity
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        sessionStorage.removeItem('pinAuthenticated');
        showToast('Session expired due to inactivity', 'warning');
        window.location.reload();
    }, INACTIVITY_TIMEOUT);
}

document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);

// Initialize inactivity timer
resetInactivityTimer();