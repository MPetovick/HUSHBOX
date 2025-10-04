/*!
 * ===========================================================================
 * HUSHBOX ENTERPRISE CORE ENGINE v3.2.2 - FASE 1 SEGURIDAD
 * ===========================================================================
 * 
 * Mejoras de Seguridad Fase 1:
 * 1. ✅ Sanitización robusta contra XSS
 * 2. ✅ Encriptación del historial local
 * 3. ✅ Rate limiting para desencriptación
 * 4. ✅ Validación de entrada robusta
 * 
 * Developed by: MikePetovick
 * Security Lead: HushBox Cryptography Team
 
 SPDX-License-Identifier: AGPL-3.0-only
 Copyright (C) 2025 HushBox Enterprise 
 * ===========================================================================
 */

// Enhanced configuration with additional security parameters
const CONFIG = {
  PBKDF2_ITERATIONS: 310000,
  SALT_LENGTH: 32,
  IV_LENGTH: 16,
  AES_KEY_LENGTH: 256,
  HMAC_KEY_LENGTH: 256,
  HMAC_LENGTH: 32,
  QR_SIZE: 220,
  MIN_PASSPHRASE_LENGTH: 12,
  MAX_MESSAGE_LENGTH: 10000,
  CAMERA_TIMEOUT: 30000,
  DECRYPT_DELAY_INCREMENT: 100,
  MAX_DECRYPT_ATTEMPTS: 5,
  NOTICE_TIMEOUT: 8000,
  SESSION_TIMEOUT: 1800000, // 30 minutes
  COMPRESSION_THRESHOLD: 100,
  HISTORY_STORAGE_KEY: 'hushbox_encrypted_history',
  HISTORY_KEY_DERIVATION_SALT: 'hushbox_history_salt_v1',
  AUTO_WIPE: 0, // Minutes, 0 = disabled
  QR_ERROR_CORRECTION: 'H',
  RATE_LIMIT_BASE_DELAY: 1000,
  RATE_LIMIT_MAX_DELAY: 30000
};

// DOM elements with enhanced error handling
const dom = {
  getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.error(`DOM element not found: ${selector}`);
      throw new Error(`DOM element not found: ${selector}`);
    }
    return element;
  },
  
  encryptForm: document.getElementById('encrypt-form'),
  uploadArrow: document.getElementById('upload-arrow-button'),
  scanButton: document.getElementById('scan-button'),
  pdfButton: document.getElementById('pdf-button'),
  messages: document.getElementById('messages'),
  passphrase: document.getElementById('passphrase'),
  messageInput: document.getElementById('message-input'),
  sendButton: document.getElementById('send-button'),
  qrCanvas: document.getElementById('qr-canvas'),
  shareButton: document.getElementById('share-button'),
  copyButton: document.getElementById('copy-button'),
  qrContainer: document.getElementById('qr-container'),
  cameraModal: document.getElementById('camera-modal'),
  cameraPreview: document.getElementById('camera-preview'),
  closeCamera: document.getElementById('close-camera'),
  cameraContainer: document.querySelector('.camera-container'),
  fileInput: document.createElement('input'),
  charCounter: document.getElementById('char-counter'),
  generatePass: document.querySelector('.generate-password'),
  togglePassword: document.querySelector('.toggle-password'),
  passwordStrengthBar: document.getElementById('password-strength-bar'),
  clearHistory: document.getElementById('clear-history'),
  exportHistory: document.getElementById('export-history'),
  importHistory: document.getElementById('import-history'),
  toastContainer: document.getElementById('toast-container'),
  passphraseError: document.getElementById('passphrase-error'),
  tutorialModal: document.getElementById('tutorial-modal'),
  closeTutorial: document.getElementById('close-tutorial'),
  dontShowAgainCheckbox: document.getElementById('dont-show-again-checkbox'),
  dontShowAgainButton: document.getElementById('dont-show-again'),
  passphraseModal: document.getElementById('passphrase-modal'),
  modalPassphrase: document.getElementById('modal-passphrase'),
  modalPassphraseError: document.getElementById('modal-passphrase-error'),
  modalDecryptButton: document.getElementById('modal-decrypt-button'),
  modalCancelButton: document.getElementById('modal-cancel-button'),
  closePassphraseModal: document.getElementById('close-passphrase'),
  detectionBox: null,
  scanLine: null,
  settingsButton: document.getElementById('settings-button'),
  qrTime: document.getElementById('qr-time'),
  settingsModal: document.getElementById('settings-modal'),
  closeSettings: document.querySelector('#settings-modal .close-modal'),
  saveSettings: document.getElementById('save-settings'),
  cancelSettings: document.getElementById('cancel-settings'),
  resetSettings: document.getElementById('reset-settings'),
  pbkdf2IterationsInput: document.getElementById('pbkdf2-iterations'),
  securityLevelSelect: document.getElementById('security-level'),
  sessionTimeoutInput: document.getElementById('session-timeout'),
  autoWipeSelect: document.getElementById('auto-wipe'),
  qrErrorCorrectionSelect: document.getElementById('qr-error-correction'),
};

// Initialize file input
dom.fileInput.type = 'file';
dom.fileInput.accept = 'image/*,.csv';
dom.fileInput.style.display = 'none';
document.body.appendChild(dom.fileInput);

// Application state with enhanced security flags
const appState = {
  isEncrypting: false,
  isDecrypting: false,
  sessionActive: true,
  messageHistory: [],
  passwordVisible: false,
  lastEncryptedData: null,
  sessionTimer: null,
  importingHistory: false,
  decryptAttempts: 0,
  lastDecryptAttempt: 0,
  securityLevel: 'high',
  cameraStream: null,
  wipeTimer: null,
  rateLimitDelay: 0
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  PBKDF2_ITERATIONS: 310000,
  SECURITY_LEVEL: 'high',
  SESSION_TIMEOUT: 30,
  AUTO_WIPE: 0,
  QR_ERROR_CORRECTION: 'H'
};

// ===========================================================================
// MEJORAS FASE 1 - SEGURIDAD ROBUSTA
// ===========================================================================

// 1. SANITIZACIÓN ROBUSTA CONTRA XSS
const securityUtils = {
  // Lista de caracteres peligrosos para HTML
  dangerousPatterns: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /vbscript:/gi
  ],

  // Sanitización completa HTML
  sanitizeHTML: (str) => {
    if (typeof str !== 'string') return '';
    
    // Eliminar caracteres nulos y caracteres de control
    let clean = str.replace(/\0/g, '')
                  .replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Escapar caracteres HTML especiales
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;'
    };
    
    clean = clean.replace(/[&<>"'`\/]/g, (char) => escapeMap[char]);
    
    // Validar contra patrones peligrosos
    securityUtils.dangerousPatterns.forEach(pattern => {
      if (pattern.test(clean)) {
        clean = clean.replace(pattern, '');
      }
    });
    
    // Limitar longitud máxima
    if (clean.length > CONFIG.MAX_MESSAGE_LENGTH * 2) {
      clean = clean.substring(0, CONFIG.MAX_MESSAGE_LENGTH * 2);
    }
    
    return clean;
  },

  // Validación de entrada robusta
  validateInput: (input, type) => {
    if (typeof input !== 'string') {
      throw new Error(`Invalid ${type}: must be a string`);
    }

    const constraints = {
      passphrase: {
        minLength: CONFIG.MIN_PASSPHRASE_LENGTH,
        maxLength: 256,
        pattern: /^[\x20-\x7E]+$/ // Caracteres ASCII imprimibles
      },
      message: {
        minLength: 1,
        maxLength: CONFIG.MAX_MESSAGE_LENGTH,
        pattern: /^[\s\S]*$/ // Cualquier carácter (incluidos saltos de línea)
      }
    };

    const constraint = constraints[type];
    if (!constraint) {
      throw new Error(`Unknown input type: ${type}`);
    }

    // Validar longitud
    if (input.length < constraint.minLength) {
      throw new Error(`${type} must be at least ${constraint.minLength} characters`);
    }
    
    if (input.length > constraint.maxLength) {
      throw new Error(`${type} must not exceed ${constraint.maxLength} characters`);
    }

    // Validar patrón
    if (constraint.pattern && !constraint.pattern.test(input)) {
      throw new Error(`Invalid characters in ${type}`);
    }

    return true;
  },

  // Rate limiting para desencriptación
  checkRateLimit: () => {
    const now = Date.now();
    const timeSinceLastAttempt = now - appState.lastDecryptAttempt;
    
    // Resetear contador si ha pasado mucho tiempo
    if (timeSinceLastAttempt > 300000) { // 5 minutos
      appState.decryptAttempts = 0;
      appState.rateLimitDelay = 0;
    }
    
    // Aplicar delay progresivo
    if (appState.decryptAttempts > 0) {
      appState.rateLimitDelay = Math.min(
        CONFIG.RATE_LIMIT_BASE_DELAY * Math.pow(2, appState.decryptAttempts - 1),
        CONFIG.RATE_LIMIT_MAX_DELAY
      );
      
      if (timeSinceLastAttempt < appState.rateLimitDelay) {
        const remaining = Math.ceil((appState.rateLimitDelay - timeSinceLastAttempt) / 1000);
        throw new Error(`Too many attempts. Please wait ${remaining} seconds.`);
      }
    }
    
    appState.lastDecryptAttempt = now;
    
    // Bloquear después de máximo de intentos
    if (appState.decryptAttempts >= CONFIG.MAX_DECRYPT_ATTEMPTS) {
      throw new Error('Maximum decryption attempts reached. Please wait 30 minutes.');
    }
  },

  // Incrementar contador de intentos
  incrementAttempts: () => {
    appState.decryptAttempts++;
    appState.lastDecryptAttempt = Date.now();
  },

  // Resetear rate limiting
  resetRateLimit: () => {
    appState.decryptAttempts = 0;
    appState.rateLimitDelay = 0;
    appState.lastDecryptAttempt = 0;
  }
};

// 2. ENCRIPTACIÓN DEL HISTORIAL LOCAL
const historyCrypto = {
  // Derivar clave específica para el historial
  deriveHistoryKey: async (passphrase) => {
    const salt = new TextEncoder().encode(CONFIG.HISTORY_KEY_DERIVATION_SALT);
    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      256
    );

    return crypto.subtle.importKey(
      'raw',
      derivedBits,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  },

  // Encriptar historial
  encryptHistory: async (history, passphrase) => {
    try {
      securityUtils.validateInput(passphrase, 'passphrase');
      
      const key = await historyCrypto.deriveHistoryKey(passphrase);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(JSON.stringify(history));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('History encryption error:', error);
      throw new Error('Failed to encrypt history: ' + error.message);
    }
  },

  // Desencriptar historial
  decryptHistory: async (encryptedData, passphrase) => {
    try {
      securityUtils.validateInput(passphrase, 'passphrase');
      
      const key = await historyCrypto.deriveHistoryKey(passphrase);
      const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      if (encryptedArray.length < 12) {
        throw new Error('Invalid encrypted data');
      }
      
      const iv = encryptedArray.slice(0, 12);
      const data = encryptedArray.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      const history = JSON.parse(new TextDecoder().decode(decrypted));
      
      // Validar estructura del historial
      if (!Array.isArray(history)) {
        throw new Error('Invalid history format');
      }
      
      return history;
    } catch (error) {
      console.error('History decryption error:', error);
      throw new Error('Failed to decrypt history: ' + error.message);
    }
  },

  // Cargar historial encriptado
  loadEncryptedHistory: async (passphrase) => {
    try {
      const encrypted = localStorage.getItem(CONFIG.HISTORY_STORAGE_KEY);
      if (!encrypted) return [];
      
      return await historyCrypto.decryptHistory(encrypted, passphrase);
    } catch (error) {
      console.error('Load history error:', error);
      throw error;
    }
  },

  // Guardar historial encriptado
  saveEncryptedHistory: async (history, passphrase) => {
    try {
      const encrypted = await historyCrypto.encryptHistory(history, passphrase);
      localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Save history error:', error);
      throw error;
    }
  }
};

// Cargar configuración guardada
function loadSettings() {
  const savedSettings = localStorage.getItem('hushbox_settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      CONFIG.PBKDF2_ITERATIONS = settings.PBKDF2_ITERATIONS || DEFAULT_CONFIG.PBKDF2_ITERATIONS;
      appState.securityLevel = settings.SECURITY_LEVEL || DEFAULT_CONFIG.SECURITY_LEVEL;
      CONFIG.SESSION_TIMEOUT = (settings.SESSION_TIMEOUT || DEFAULT_CONFIG.SESSION_TIMEOUT) * 60000;
      CONFIG.AUTO_WIPE = settings.AUTO_WIPE || DEFAULT_CONFIG.AUTO_WIPE;
      CONFIG.QR_ERROR_CORRECTION = settings.QR_ERROR_CORRECTION || DEFAULT_CONFIG.QR_ERROR_CORRECTION;
      
      updateSettingsUI();
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }
}

// Actualizar UI con la configuración
function updateSettingsUI() {
  dom.pbkdf2IterationsInput.value = CONFIG.PBKDF2_ITERATIONS;
  dom.securityLevelSelect.value = appState.securityLevel;
  dom.sessionTimeoutInput.value = CONFIG.SESSION_TIMEOUT / 60000;
  dom.autoWipeSelect.value = CONFIG.AUTO_WIPE;
  dom.qrErrorCorrectionSelect.value = CONFIG.QR_ERROR_CORRECTION;
  
  const securityLevelElement = document.querySelector('.security-level');
  if (securityLevelElement) {
    securityLevelElement.className = `security-level ${appState.securityLevel}`;
    securityLevelElement.querySelector('span').textContent = 
      `Security Level: ${appState.securityLevel.charAt(0).toUpperCase() + appState.securityLevel.slice(1)}`;
  }
}

// Guardar configuración
function saveSettings() {
  const settings = {
    PBKDF2_ITERATIONS: parseInt(dom.pbkdf2IterationsInput.value) || DEFAULT_CONFIG.PBKDF2_ITERATIONS,
    SECURITY_LEVEL: dom.securityLevelSelect.value,
    SESSION_TIMEOUT: parseInt(dom.sessionTimeoutInput.value) || 30,
    AUTO_WIPE: parseInt(dom.autoWipeSelect.value) || 0,
    QR_ERROR_CORRECTION: dom.qrErrorCorrectionSelect.value
  };
  
  if (settings.PBKDF2_ITERATIONS < 100000) {
    ui.showToast('PBKDF2 iterations must be at least 100,000', 'error');
    return false;
  }
  
  CONFIG.PBKDF2_ITERATIONS = settings.PBKDF2_ITERATIONS;
  appState.securityLevel = settings.SECURITY_LEVEL;
  CONFIG.SESSION_TIMEOUT = settings.SESSION_TIMEOUT * 60000;
  CONFIG.AUTO_WIPE = settings.AUTO_WIPE;
  CONFIG.QR_ERROR_CORRECTION = settings.QR_ERROR_CORRECTION;
  
  localStorage.setItem('hushbox_settings', JSON.stringify(settings));
  updateSettingsUI();
  handlers.resetSessionTimer();
  
  if (CONFIG.AUTO_WIPE > 0) {
    clearTimeout(appState.wipeTimer);
    appState.wipeTimer = setTimeout(() => {
      handlers.clearSensitiveData();
      ui.showToast('Sensitive data automatically wiped', 'info');
    }, CONFIG.AUTO_WIPE * 60000);
  }
  
  ui.showToast('Settings saved successfully', 'success');
  return true;
}

// Restaurar configuración por defecto
function resetSettings() {
  CONFIG.PBKDF2_ITERATIONS = DEFAULT_CONFIG.PBKDF2_ITERATIONS;
  appState.securityLevel = DEFAULT_CONFIG.SECURITY_LEVEL;
  CONFIG.SESSION_TIMEOUT = DEFAULT_CONFIG.SESSION_TIMEOUT * 60000;
  CONFIG.AUTO_WIPE = DEFAULT_CONFIG.AUTO_WIPE;
  CONFIG.QR_ERROR_CORRECTION = DEFAULT_CONFIG.QR_ERROR_CORRECTION;
  
  updateSettingsUI();
  localStorage.removeItem('hushbox_settings');
  handlers.resetSessionTimer();
  
  if (CONFIG.AUTO_WIPE > 0) {
    clearTimeout(appState.wipeTimer);
    appState.wipeTimer = setTimeout(() => {
      handlers.clearSensitiveData();
      ui.showToast('Sensitive data automatically wiped', 'info');
    }, CONFIG.AUTO_WIPE * 60000);
  }
  
  ui.showToast('Settings reset to defaults', 'success');
}

// Enhanced cryptographic utilities with additional security measures
const cryptoUtils = {
  validatePassphrase: (pass) => {
    // Validación básica primero
    securityUtils.validateInput(pass, 'passphrase');
    
    // Contraseñas comunes prohibidas
    const commonPasswords = [
      'password', '123456', 'qwerty', 'letmein', 'welcome',
      '12345678', 'abc123', 'password1', '12345', '123456789',
      'admin', 'test', 'guest', 'default'
    ];
    
    if (commonPasswords.includes(pass.toLowerCase())) {
      throw new Error('Password is too common and easily guessable');
    }

    // Complejidad mejorada
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSymbols = /[^A-Za-z0-9]/.test(pass);
    const uniqueChars = new Set(pass).size;

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
      throw new Error('Password must include uppercase, lowercase, numbers, and symbols');
    }
    
    if (uniqueChars < CONFIG.MIN_PASSPHRASE_LENGTH * 0.7) {
      throw new Error('Password has too many repeated characters');
    }
    
    // Patrones secuenciales
    const sequentialPatterns = [
      /(.)\1{2,}/, // Caracteres repetidos
      /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
      /(123|234|345|456|567|678|789|890)/,
      /(qwerty|asdfgh|zxcvbn)/i
    ];
    
    for (const pattern of sequentialPatterns) {
      if (pattern.test(pass.toLowerCase())) {
        throw new Error('Password contains easily guessable patterns');
      }
    }
    
    // Use zxcvbn for advanced password strength analysis
    if (typeof zxcvbn !== 'undefined') {
      const result = zxcvbn(pass);
      if (result.score < 3) {
        throw new Error('Password is too weak. ' + 
          (result.feedback.warning || 'Choose a stronger password.'));
      }
      
      if (result.score >= 4) {
        appState.securityLevel = 'high';
      } else if (result.score >= 2) {
        appState.securityLevel = 'medium';
      } else {
        appState.securityLevel = 'low';
      }
    }
    
    return true;
  },

  calculatePasswordStrength: (pass) => {
    if (!pass) return 0;
    
    let strength = 0;
    strength += Math.min(pass.length * 4, 40);
    
    if (/[A-Z]/.test(pass)) strength += 10;
    if (/[a-z]/.test(pass)) strength += 10;
    if (/[0-9]/.test(pass)) strength += 10;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 15;
    
    // Penalizar patrones débiles
    if (/(.)\1{2,}/.test(pass)) strength -= 15;
    if (pass.length < 8) strength -= 30;
    
    // Bonus por diversidad de caracteres
    const unique = new Set(pass).size;
    strength += Math.min(unique * 2, 20);
    
    return Math.max(0, Math.min(100, strength));
  },

  generateSecurePass: (length = 16, maxAttempts = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let attempts = 0;

    while (attempts < maxAttempts) {
      const values = new Uint32Array(length);
      crypto.getRandomValues(values);
      let pass = Array.from(values, v => chars[v % chars.length]).join('');

      // Asegurar complejidad
      if (!/[A-Z]/.test(pass)) pass = 'A' + pass.slice(1);
      if (!/[a-z]/.test(pass)) pass = pass.slice(0, -1) + 'a';
      if (!/[0-9]/.test(pass)) pass = pass.slice(0, -1) + '1';
      if (!/[^A-Za-z0-9]/.test(pass)) pass = pass.slice(0, -1) + '!';

      try {
        cryptoUtils.validatePassphrase(pass);
        appState.securityLevel = 'high';
        return pass;
      } catch (error) {
        attempts++;
      }
    }
    throw new Error('Failed to generate a secure password after multiple attempts');
  },

  constantTimeCompare: (a, b) => {
    const aBytes = new TextEncoder().encode(a);
    const bBytes = new TextEncoder().encode(b);
    if (aBytes.length !== bBytes.length) return false;
    
    let result = 0;
    for (let i = 0; i < aBytes.length; i++) {
      result |= aBytes[i] ^ bBytes[i];
    }
    return result === 0;
  },

  secureWipe: (buffer) => {
    if (buffer instanceof ArrayBuffer || buffer instanceof Uint8Array) {
      const wipeArray = new Uint8Array(buffer);
      for (let i = 0; i < wipeArray.length; i++) {
        wipeArray[i] = 0;
      }
    } else if (typeof buffer === 'string') {
      const strArray = new Uint8Array(new TextEncoder().encode(buffer));
      for (let i = 0; i < strArray.length; i++) {
        strArray[i] = 0;
      }
    }
  },

  deriveKeys: async (passphrase, salt) => {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: CONFIG.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      CONFIG.AES_KEY_LENGTH + CONFIG.HMAC_KEY_LENGTH
    );

    const derivedBitsArray = new Uint8Array(derivedBits);
    const aesKeyBytes = derivedBitsArray.slice(0, CONFIG.AES_KEY_LENGTH / 8);
    const hmacKeyBytes = derivedBitsArray.slice(CONFIG.AES_KEY_LENGTH / 8);

    const aesKey = await crypto.subtle.importKey(
      'raw',
      aesKeyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      hmacKeyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    cryptoUtils.secureWipe(derivedBitsArray);
    cryptoUtils.secureWipe(aesKeyBytes);
    cryptoUtils.secureWipe(hmacKeyBytes);

    return { aesKey, hmacKey };
  },

  encryptMessage: async (message, passphrase) => {
    let dataToEncrypt = null;
    let salt = null;
    let iv = null;
    let aesKey = null;
    let hmacKey = null;
    
    try {
      // Validaciones de entrada robustas
      securityUtils.validateInput(message, 'message');
      cryptoUtils.validatePassphrase(passphrase);
      
      dataToEncrypt = new TextEncoder().encode(message);

      if (typeof pako !== 'undefined' && message.length > CONFIG.COMPRESSION_THRESHOLD) {
        dataToEncrypt = pako.deflate(dataToEncrypt, { level: 6 });
      }

      salt = crypto.getRandomValues(new Uint8Array(CONFIG.SALT_LENGTH));
      iv = crypto.getRandomValues(new Uint8Array(CONFIG.IV_LENGTH));

      const { aesKey: derivedAesKey, hmacKey: derivedHmacKey } = await cryptoUtils.deriveKeys(passphrase, salt);
      aesKey = derivedAesKey;
      hmacKey = derivedHmacKey;

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        aesKey,
        dataToEncrypt
      );

      const ciphertext = new Uint8Array(encrypted);
      
      const hmac = await crypto.subtle.sign(
        'HMAC',
        hmacKey,
        ciphertext
      );

      const combined = new Uint8Array([
        ...salt,
        ...iv,
        ...ciphertext,
        ...new Uint8Array(hmac)
      ]);
      
      const result = btoa(String.fromCharCode(...combined));
      return result;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed: ' + error.message);
    } finally {
      if (dataToEncrypt) cryptoUtils.secureWipe(dataToEncrypt);
      if (salt) cryptoUtils.secureWipe(salt);
      if (iv) cryptoUtils.secureWipe(iv);
    }
  },

  decryptMessage: async (encryptedBase64, passphrase) => {
    // Aplicar rate limiting antes de la desencriptación
    securityUtils.checkRateLimit();
    
    let decrypted = null;
    let salt = null;
    let iv = null;
    let aesKey = null;
    let hmacKey = null;
    
    try {
      if (!encryptedBase64 || !passphrase) {
        throw new Error('Encrypted data and passphrase are required');
      }
      
      // Validar formato base64
      if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(encryptedBase64)) {
        throw new Error('Invalid encrypted data format');
      }
      
      const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
      
      const minLength = CONFIG.SALT_LENGTH + CONFIG.IV_LENGTH + CONFIG.HMAC_LENGTH;
      if (encryptedData.length < minLength) {
        throw new Error('Invalid encrypted data: too short');
      }
      
      salt = encryptedData.slice(0, CONFIG.SALT_LENGTH);
      iv = encryptedData.slice(CONFIG.SALT_LENGTH, CONFIG.SALT_LENGTH + CONFIG.IV_LENGTH);
      const ciphertext = encryptedData.slice(CONFIG.SALT_LENGTH + CONFIG.IV_LENGTH, -CONFIG.HMAC_LENGTH);
      const hmac = encryptedData.slice(-CONFIG.HMAC_LENGTH);

      const { aesKey: derivedAesKey, hmacKey: derivedHmacKey } = await cryptoUtils.deriveKeys(passphrase, salt);
      aesKey = derivedAesKey;
      hmacKey = derivedHmacKey;

      const isValid = await crypto.subtle.verify(
        'HMAC',
        hmacKey,
        hmac,
        ciphertext
      );

      if (!isValid) {
        securityUtils.incrementAttempts();
        throw new Error('Integrity check failed: Data may have been tampered with');
      }

      decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        aesKey,
        ciphertext
      );

      let decompressed;
      try {
        if (typeof pako !== 'undefined') {
          decompressed = pako.inflate(new Uint8Array(decrypted));
        } else {
          decompressed = new Uint8Array(decrypted);
        }
      } catch (e) {
        decompressed = new Uint8Array(decrypted);
      }
      
      const result = new TextDecoder().decode(decompressed);
      
      // Resetear rate limiting en éxito
      securityUtils.resetRateLimit();
      
      return result;
    } catch (error) {
      // Incrementar contador en error (excepto para errores de validación)
      if (!error.message.includes('required') && !error.message.includes('format')) {
        securityUtils.incrementAttempts();
      }
      
      console.error('Decryption error:', error);
      throw new Error('Decryption failed: ' + error.message);
    } finally {
      if (decrypted) cryptoUtils.secureWipe(decrypted);
      if (salt) cryptoUtils.secureWipe(salt);
      if (iv) cryptoUtils.secureWipe(iv);
    }
  }
};

// Enhanced UI controller with better accessibility and user feedback
const ui = {
  // Usar la nueva sanitización robusta
  sanitizeHTML: securityUtils.sanitizeHTML,

  showPlaceholder: (message, iconClass) => {
    const safeMessage = securityUtils.sanitizeHTML(message);
    dom.messages.innerHTML = `
      <div class="message-placeholder">
        <i class="fas ${iconClass}" aria-hidden="true"></i>
        <p>${safeMessage}</p>
      </div>
    `;
  },

  displayMessage: (content, isSent = false) => {
    const placeholder = dom.messages.querySelector('.message-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    const messageId = 'msg-' + Date.now();
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isSent ? 'sent' : ''}`;
    
    // Crear elementos de forma segura
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.id = messageId;
    messageContent.setAttribute('role', 'alert');
    messageContent.setAttribute('aria-live', 'polite');

    // Usar textContent para evitar XSS
    const messageText = document.createElement('span');
    messageText.className = 'message-text';
    messageText.textContent = content;

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-icon';
    copyButton.setAttribute('data-message-id', messageId);
    copyButton.setAttribute('aria-label', 'Copy message');
    copyButton.innerHTML = '<i class="fas fa-copy"></i>';

    messageContent.appendChild(messageText);
    messageContent.appendChild(copyButton);

    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageEl.appendChild(messageContent);
    messageEl.appendChild(messageTime);

    appState.messageHistory.push({
      content,
      isSent,
      timestamp: new Date()
    });

    if (dom.messages.children.length >= 20) {
      dom.messages.removeChild(dom.messages.firstChild);
    }

    dom.messages.appendChild(messageEl);
    dom.messages.scrollTop = dom.messages.scrollHeight;

    dom.exportHistory.disabled = appState.messageHistory.length === 0;
    
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(content).then(() => {
        ui.showToast('Message copied to clipboard', 'success');
      });
    });
  },

  generateQR: async (data) => {
    if (typeof QRCode === 'undefined') {
      throw new Error('QRCode library not loaded');
    }
    return new Promise((resolve, reject) => {
      const qrSize = CONFIG.QR_SIZE;
      dom.qrCanvas.width = qrSize;
      dom.qrCanvas.height = qrSize;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = qrSize;
      tempCanvas.height = qrSize;

      QRCode.toCanvas(
        tempCanvas,
        data,
        {
          width: qrSize,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: CONFIG.QR_ERROR_CORRECTION
        },
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          const ctx = tempCanvas.getContext('2d');
          const circleRadius = qrSize * 0.15;
          const circleX = qrSize / 2;
          const circleY = qrSize / 2;

          ctx.beginPath();
          ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#000000';
          ctx.fill();

          ctx.fillStyle = '#00cc99';
          ctx.font = `bold ${qrSize * 0.08}px "Segoe UI", system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('HUSH', circleX, circleY - circleRadius * 0.2);
          ctx.fillText('BOX', circleX, circleY + circleRadius * 0.3);

          const qrCtx = dom.qrCanvas.getContext('2d');
          qrCtx.clearRect(0, 0, qrSize, qrSize);
          qrCtx.drawImage(tempCanvas, 0, 0, qrSize, qrSize);

          dom.qrContainer.classList.remove('hidden');
          dom.qrContainer.classList.add('no-print');
          
          dom.qrTime.textContent = new Date().toLocaleTimeString();
          
          resolve();
        }
      );
    });
  },

  toggleButton: (btn, state, text = '') => {
    btn.disabled = state;
    if (text) {
      btn.innerHTML = text;
    }
  },

  showCameraModal: () => {
    dom.cameraModal.style.display = 'flex';
    handlers.startCamera();
  },

  hideCameraModal: () => {
    dom.cameraModal.style.display = 'none';
    handlers.stopCamera();
  },

  showPassphraseModal: () => {
    dom.passphraseModal.style.display = 'flex';
    dom.modalPassphrase.focus();
    
    document.getElementById('scan-time').textContent = 
      new Date().toLocaleTimeString();
    
    if (!document.querySelector('.scan-beam')) {
      const beam = document.createElement('div');
      beam.className = 'scan-beam';
      dom.cameraContainer.appendChild(beam);
    }
  },

  hidePassphraseModal: () => {
    dom.passphraseModal.style.display = 'none';
    dom.modalPassphrase.value = '';
    dom.modalPassphraseError.classList.add('hidden');
  },

  showDetectionBox: () => {
    if (!dom.detectionBox) {
      dom.detectionBox = document.createElement('div');
      dom.detectionBox.className = 'detection-box';
      dom.cameraContainer.appendChild(dom.detectionBox);

      dom.scanLine = document.createElement('div');
      dom.scanLine.className = 'scan-line';
      dom.detectionBox.appendChild(dom.scanLine);
    }

    const size = Math.min(
      dom.cameraContainer.clientWidth, 
      dom.cameraContainer.clientHeight
    ) * 0.7;

    dom.detectionBox.style.width = `${size}px`;
    dom.detectionBox.style.height = `${size}px`;
    dom.detectionBox.style.left = `calc(50% - ${size/2}px)`;
    dom.detectionBox.style.top = `calc(50% - ${size/2}px)`;
    dom.detectionBox.style.display = 'block';
  },

  hideDetectionBox: () => {
    if (dom.detectionBox) {
      dom.detectionBox.style.display = 'none';
    }
  },

  updateDetectionBox: (location) => {
    if (!dom.detectionBox) return;

    const { topLeft, topRight, bottomLeft, bottomRight } = location;
    const width = Math.max(topRight.x - topLeft.x, bottomRight.x - bottomLeft.x);
    const height = Math.max(bottomLeft.y - topLeft.y, bottomRight.y - topRight.y);

    dom.detectionBox.style.display = 'block';
    dom.detectionBox.style.width = `${width}px`;
    dom.detectionBox.style.height = `${height}px`;
    dom.detectionBox.style.left = `${topLeft.x}px`;
    dom.detectionBox.style.top = `${topLeft.y}px`;
  },

  showToast: (message, type = 'info') => {
    const safeMessage = securityUtils.sanitizeHTML(message);
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';

    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${safeMessage}</span>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, CONFIG.NOTICE_TIMEOUT);
  },

  updatePasswordStrength: (pass) => {
    const strength = cryptoUtils.calculatePasswordStrength(pass);
    dom.passwordStrengthBar.style.width = `${strength}%`;

    if (strength < 40) {
      dom.passwordStrengthBar.style.background = 'var(--error-color)';
    } else if (strength < 70) {
      dom.passwordStrengthBar.style.background = 'var(--warning-color)';
    } else {
      dom.passwordStrengthBar.style.background = 'var(--success-color)';
    }
  },

  clearMessageHistory: () => {
    if (confirm('Are you sure you want to clear the message history? All messages will be permanently deleted.')) {
      ui.showPlaceholder('Message history cleared', 'fa-trash-alt');
      appState.messageHistory = [];
      dom.exportHistory.disabled = true;
      
      // Limpiar también el almacenamiento encriptado
      localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
      
      ui.showToast('Message history cleared', 'success');
    }
  },

  togglePasswordVisibility: () => {
    appState.passwordVisible = !appState.passwordVisible;
    dom.passphrase.type = appState.passwordVisible ? 'text' : 'password';
    dom.togglePassword.children[0].classList.toggle('fa-eye', !appState.passwordVisible);
    dom.togglePassword.children[0].classList.toggle('fa-eye-slash', appState.passwordVisible);
  },

  showError: (element, message) => {
    const safeMessage = securityUtils.sanitizeHTML(message);
    element.textContent = safeMessage;
    element.classList.remove('hidden');
    setTimeout(() => {
      element.classList.add('hidden');
    }, CONFIG.NOTICE_TIMEOUT);
  }
};

// Enhanced CSV utilities with better error handling
const csvUtils = {
  parseCSVLine: (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
        continue;
      }

      current += char;
    }

    result.push(current);
    return result.map(field => field.trim());
  },

  parseCSV: (csvData) => {
    // Validar entrada
    if (typeof csvData !== 'string') {
      throw new Error('CSV data must be a string');
    }

    const lines = csvData
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    const header = csvUtils.parseCSVLine(lines[0]);
    const requiredHeaders = ['Type', 'Message', 'Date', 'Time'];
    if (!requiredHeaders.every(h => header.includes(h))) {
      throw new Error('Invalid CSV format: Missing required headers');
    }

    const messages = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = csvUtils.parseCSVLine(lines[i]);
      if (fields.length < 4) {
        console.warn(`Skipping invalid line ${i + 1}: ${lines[i]}`);
        continue;
      }

      const type = securityUtils.sanitizeHTML(fields[0]);
      const content = securityUtils.sanitizeHTML(fields[1].replace(/\\n/g, '\n'));
      const date = securityUtils.sanitizeHTML(fields[2]);
      const time = securityUtils.sanitizeHTML(fields[3]);

      let timestamp;
      try {
        if (date.includes('-') && time.includes(':')) {
          timestamp = new Date(`${date}T${time}`);
        } else {
          timestamp = new Date(`${date} ${time}`);
        }

        if (isNaN(timestamp.getTime())) {
          timestamp = new Date();
        }
      } catch (e) {
        timestamp = new Date();
      }

      messages.push({
        content,
        isSent: type === 'Sent',
        timestamp
      });
    }

    return messages;
  },

  generateCSV: (messages) => {
    if (!Array.isArray(messages)) {
      throw new Error('Messages must be an array');
    }

    const header = ['Type', 'Message', 'Date', 'Time'];
    const rows = messages.map(msg => {
      const type = msg.isSent ? 'Sent' : 'Received';
      const safeMessage = `"${securityUtils.sanitizeHTML(msg.content)
        .replace(/"/g, '""')
        .replace(/\n/g, '\\n')}"`;
      const date = securityUtils.sanitizeHTML(msg.timestamp.toLocaleDateString());
      const time = securityUtils.sanitizeHTML(msg.timestamp.toLocaleTimeString());

      return [type, safeMessage, date, time];
    });

    return [header, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
};

// Enhanced event handlers with better error handling and performance
const handlers = {
  handleEncrypt: async (e) => {
    e.preventDefault();
    if (appState.isEncrypting) return;

    const message = dom.messageInput.value.trim();
    const passphrase = dom.passphrase.value.trim();

    if (!message || !passphrase) {
      ui.displayMessage('Please enter a message and a passphrase');
      ui.showToast('Missing message or passphrase', 'error');
      return;
    }

    // Validación robusta de entrada
    try {
      securityUtils.validateInput(message, 'message');
      securityUtils.validateInput(passphrase, 'passphrase');
    } catch (error) {
      ui.showToast(error.message, 'error');
      return;
    }

    appState.isEncrypting = true;
    ui.toggleButton(dom.sendButton, true, '<span class="loader"></span> Encrypting...');

    try {
      const encrypted = await cryptoUtils.encryptMessage(message, passphrase);
      appState.lastEncryptedData = encrypted;
      await ui.generateQR(encrypted);
      ui.displayMessage(`Encrypted message: ${securityUtils.sanitizeHTML(encrypted.slice(0, 40))}...`, true);
      ui.showToast('Message encrypted successfully', 'success');

      dom.messageInput.value = '';
      dom.passphrase.value = '';
      ui.updatePasswordStrength('');
    } catch (error) {
      ui.displayMessage(securityUtils.sanitizeHTML(error.message));
      ui.showToast(error.message, 'error');
      ui.showError(dom.passphraseError, error.message);
    } finally {
      appState.isEncrypting = false;
      ui.toggleButton(dom.sendButton, false, '<i class="fas fa-lock"></i> Encrypt');
    }
  },

  handleModalDecrypt: async () => {
    const passphrase = dom.modalPassphrase.value.trim();
    
    if (!passphrase) {
      ui.showToast('Passphrase required', 'error');
      return;
    }

    try {
      // Validación de entrada
      securityUtils.validateInput(passphrase, 'passphrase');
      
      const decrypted = await cryptoUtils.decryptMessage(
        appState.lastEncryptedData, 
        passphrase
      );
      
      ui.displayMessage(`Decrypted: ${securityUtils.sanitizeHTML(decrypted)}`);
      ui.hidePassphraseModal();
      ui.showToast('Message decrypted', 'success');
      
    } catch (error) {
      console.error('Decryption failed:', error);
      ui.showToast('Decryption failed: ' + error.message, 'error');
      ui.showError(dom.modalPassphraseError, error.message);
    }
  },

  startCamera: () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      ui.showToast('Camera access not supported', 'error');
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        appState.cameraStream = stream;
        dom.cameraPreview.srcObject = stream;
        
        let scanning = true;
        const timeoutId = setTimeout(() => {
          scanning && handlers.stopCamera();
          ui.hideCameraModal();
          ui.showToast('Scanning timed out', 'warning');
        }, CONFIG.CAMERA_TIMEOUT);

        const scanFrame = () => {
          if (!scanning) return;
          
          try {
            const width = dom.cameraPreview.videoWidth;
            const height = dom.cameraPreview.videoHeight;
            
            if (width === 0 || height === 0) {
              requestAnimationFrame(scanFrame);
              return;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(dom.cameraPreview, 0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, width, height);
            const qrCode = jsQR(imageData.data, width, height, {
              inversionAttempts: 'attemptBoth'
            });
            
            if (qrCode) {
              scanning = false;
              clearTimeout(timeoutId);
              
              const qrData = qrCode.data.trim();
              
              if (qrData.startsWith('HBX:') || qrData.length > 100) {
                appState.lastEncryptedData = qrData;
                handlers.stopCamera();
                ui.hideCameraModal();
                ui.showPassphraseModal();
              } else {
                ui.showToast('Invalid HushBox QR', 'warning');
                scanning = true;
              }
            }
          } catch (e) {
            console.error('Scan error:', e);
          }
          requestAnimationFrame(scanFrame);
        };
        
        dom.cameraPreview.onplaying = () => {
          requestAnimationFrame(scanFrame);
        };
      })
      .catch(error => {
        console.error('Camera access error:', error);
        let message = 'Camera access denied';
        if (error.name === 'NotFoundError') message = 'No camera found';
        if (error.name === 'NotAllowedError') message = 'Permission denied';
        ui.showToast(message, 'error');
      });
  },

  stopCamera: () => {
    if (appState.cameraStream) {
      appState.cameraStream.getTracks().forEach(track => track.stop());
      appState.cameraStream = null;
      dom.cameraPreview.srcObject = null;
    }
  },

  handleUpload: () => {
    dom.fileInput.accept = 'image/*';
    appState.importingHistory = false;
    dom.fileInput.click();
  },

  handleImportHistory: () => {
    dom.fileInput.accept = '.csv';
    appState.importingHistory = true;
    dom.fileInput.click();
  },

  handleFileSelect: async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (appState.importingHistory) {
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          await handlers.importMessageHistory(file);
        } else {
          ui.showToast('Please select a CSV file for history import', 'error');
        }
      } else {
        if (file.type.startsWith('image/')) {
          await handlers.handleQRUpload(file);
        } else {
          ui.showToast('Please select an image file', 'error');
        }
      }
    } catch (error) {
      console.error('File processing error:', error);
      ui.showToast(`Error: ${error.message}`, 'error');
    } finally {
      dom.fileInput.value = '';
    }
  },

  handleQRUpload: async (file) => {
    if (typeof jsQR === 'undefined') {
      ui.showToast('jsQR library not loaded', 'error');
      return;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

          if (qrCode) {
            appState.lastEncryptedData = qrCode.data;
            ui.showPassphraseModal();
            ui.showToast('QR code uploaded successfully', 'success');
          } else {
            ui.displayMessage('No QR code detected');
            ui.showToast('No QR code found', 'error');
          }
          resolve();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  handleCopy: async () => {
    try {
      await navigator.clipboard.writeText(dom.qrCanvas.toDataURL('image/png'));
      ui.showToast('QR copied to clipboard', 'success');
    } catch (err) {
      ui.showToast('Error copying QR', 'error');
    }
  },

  handleShare: async () => {
    try {
      const blob = await new Promise(resolve => dom.qrCanvas.toBlob(resolve));
      const file = new File([blob], 'hushbox-qr.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'HushBox QR',
          files: [file]
        });
        ui.showToast('QR shared successfully', 'success');
      } else {
        throw new Error('Sharing not supported');
      }
    } catch (error) {
      ui.showToast('Sharing not supported', 'warning');
    }
  },

  handleExportPDF: async () => {
    if (!appState.lastEncryptedData) {
      ui.showToast('No encrypted message to export', 'warning');
      return;
    }

    try {
      if (typeof window.jspdf === 'undefined') {
        throw new Error('jsPDF library not available');
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 204, 153);
      doc.text('HushBox - Encrypted Message', 105, 20, null, null, 'center');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(240, 240, 240);
      doc.text('Scan the following QR code with HushBox to decrypt:', 105, 30, null, null, 'center');

      const qrDataUrl = dom.qrCanvas.toDataURL('image/png');
      doc.addImage(qrDataUrl, 'PNG', 70, 40, 70, 70);

      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text('Security Instructions:', 20, 120);
      doc.text('- Share this document only with authorized recipients', 20, 130);
      doc.text('- Transmit the passphrase via a separate channel (e.g., Signal)', 20, 140);
      doc.text('- The message is protected with AES-256-GCM + HMAC-SHA256', 20, 150);
      doc.text('- Delete this document after use', 20, 160);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100, 20);
      doc.text('SECURE DOCUMENT - DO NOT SHARE', 105, 280, null, null, 'center');

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Generated by HushBox Enterprise v3.2.2 | ${new Date().toLocaleString()}`,
        105,
        290,
        null,
        null,
        'center'
      );

      doc.save(`hushbox-message-${Date.now()}.pdf`);
      ui.showToast('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      ui.showToast(`Error exporting PDF: ${error.message}`, 'error');
    }
  },

  exportMessageHistory: async () => {
    if (appState.messageHistory.length === 0) {
      ui.showToast('No messages to export', 'warning');
      return;
    }

    const passphrase = prompt('Enter a passphrase to encrypt the history:');
    if (!passphrase) {
      ui.showToast('Passphrase required to export', 'error');
      return;
    }

    try {
      // Validar passphrase
      securityUtils.validateInput(passphrase, 'passphrase');
      
      const csvContent = csvUtils.generateCSV(appState.messageHistory);
      const encryptedCsv = await historyCrypto.encryptHistory(
        appState.messageHistory, 
        passphrase
      );
      
      const blob = new Blob([encryptedCsv], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = `hushbox-messages-encrypted-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      ui.showToast('History exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting history:', error);
      ui.showToast(`Error exporting history: ${error.message}`, 'error');
    }
  },

  importMessageHistory: async (file) => {
    if (!file) {
      ui.showToast('No file selected', 'error');
      return;
    }

    const passphrase = prompt('Enter the passphrase to decrypt the history:');
    if (!passphrase) {
      ui.showToast('Passphrase required to import', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Validar passphrase
          securityUtils.validateInput(passphrase, 'passphrase');
          
          const encryptedData = e.target.result;
          const history = await historyCrypto.decryptHistory(encryptedData, passphrase);

          if (history.length === 0) {
            ui.showToast('No messages found in the imported file', 'warning');
            return;
          }

          appState.messageHistory.push(...history);
          dom.messages.innerHTML = '';
          history.forEach(msg => {
            ui.displayMessage(msg.content, msg.isSent);
          });

          ui.showToast(`Imported ${history.length} messages`, 'success');
          dom.exportHistory.disabled = false;
        } catch (error) {
          console.error('Error importing history:', error);
          ui.showToast(`Error importing history: ${error.message}`, 'error');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing history:', error);
      ui.showToast(`Error importing history: ${error.message}`, 'error');
    }
  },

  clearSensitiveData: () => {
    dom.passphrase.value = '';
    dom.messageInput.value = '';
    appState.lastEncryptedData = null;
    dom.qrContainer.classList.add('hidden');
    ui.updatePasswordStrength('');
    securityUtils.resetRateLimit();
    ui.showToast('Sensitive data cleared', 'success');
  },

  resetSessionTimer: () => {
    clearTimeout(appState.sessionTimer);
    appState.sessionTimer = setTimeout(() => {
      if (!appState.sessionActive) return;
      const modal = document.createElement('div');
      modal.className = 'session-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <p>Your session is about to expire. Continue?</p>
          <button id="continue-session">Continue</button>
          <button id="end-session">End Session</button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('continue-session').addEventListener('click', () => {
        appState.sessionActive = true;
        handlers.resetSessionTimer();
        modal.remove();
      });

      document.getElementById('end-session').addEventListener('click', () => {
        appState.sessionActive = false;
        handlers.clearSensitiveData();
        ui.showToast('Session ended due to inactivity', 'warning');
        modal.remove();
      });
    }, CONFIG.SESSION_TIMEOUT);
  },

  initEventListeners: () => {
    try {
      dom.encryptForm.addEventListener('submit', handlers.handleEncrypt);
      dom.shareButton.addEventListener('click', handlers.handleShare);
      dom.copyButton.addEventListener('click', handlers.handleCopy);
      dom.scanButton.addEventListener('click', ui.showCameraModal);
      dom.closeCamera.addEventListener('click', ui.hideCameraModal);
      dom.uploadArrow.addEventListener('click', handlers.handleUpload);
      dom.fileInput.addEventListener('change', handlers.handleFileSelect);
      dom.pdfButton.addEventListener('click', handlers.handleExportPDF);
      dom.generatePass.addEventListener('click', () => {
        try {
          const pass = cryptoUtils.generateSecurePass();
          dom.passphrase.value = pass;
          ui.updatePasswordStrength(pass);
          ui.displayMessage(`Generated password: ${securityUtils.sanitizeHTML(pass)}`, true);
          ui.showToast('Secure password generated', 'success');
        } catch (error) {
          ui.showToast(`Error generating password: ${error.message}`, 'error');
        }
      });
      dom.messageInput.addEventListener('input', () => {
        const len = dom.messageInput.value.length;
        dom.charCounter.textContent = `${len}/${CONFIG.MAX_MESSAGE_LENGTH}`;
        dom.charCounter.style.color = len > CONFIG.MAX_MESSAGE_LENGTH - 400
          ? 'var(--error-color)'
          : 'rgba(160,160,160,0.8)';
      });
      dom.clearHistory.addEventListener('click', ui.clearMessageHistory);
      dom.exportHistory.addEventListener('click', handlers.exportMessageHistory);
      dom.importHistory.addEventListener('click', handlers.handleImportHistory);
      dom.togglePassword.addEventListener('click', ui.togglePasswordVisibility);
      dom.passphrase.addEventListener('input', (e) => {
        ui.updatePasswordStrength(e.target.value);
      });
      dom.modalDecryptButton.addEventListener('click', handlers.handleModalDecrypt);
      dom.modalCancelButton.addEventListener('click', ui.hidePassphraseModal);
      dom.closePassphraseModal.addEventListener('click', ui.hidePassphraseModal);
      const modalTogglePassword = document.querySelector('#passphrase-modal .toggle-password');
      modalTogglePassword.addEventListener('click', () => {
        const input = dom.modalPassphrase;
        const icon = modalTogglePassword.querySelector('i');
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      });
      document.getElementById('modal-rescan-button').addEventListener('click', () => {
        ui.hidePassphraseModal();
        setTimeout(() => ui.showCameraModal(), 300);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (dom.cameraModal.style.display === 'flex') {
            ui.hideCameraModal();
          } else if (dom.passphraseModal.style.display === 'flex') {
            ui.hidePassphraseModal();
          } else if (dom.tutorialModal.style.display === 'flex') {
            tutorial.hideTutorialModal();
          } else if (dom.settingsModal.style.display === 'flex') {
            dom.settingsModal.style.display = 'none';
          }
        }
      });
      handlers.resetSessionTimer();
      document.addEventListener('click', handlers.resetSessionTimer);
      document.addEventListener('keypress', handlers.resetSessionTimer);
      
      dom.settingsButton.addEventListener('click', () => {
        updateSettingsUI();
        dom.settingsModal.style.display = 'flex';
      });
      
      dom.closeSettings.addEventListener('click', () => {
        dom.settingsModal.style.display = 'none';
      });
      
      dom.cancelSettings.addEventListener('click', () => {
        dom.settingsModal.style.display = 'none';
      });
      
      dom.saveSettings.addEventListener('click', () => {
        if (saveSettings()) {
          dom.settingsModal.style.display = 'none';
        }
      });
      
      dom.resetSettings.addEventListener('click', resetSettings);
      
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        ui.showToast('Install HushBox for a better experience', 'info');
      });
    } catch (error) {
      console.error('Error initializing listeners:', error);
      ui.showToast('Application initialization failed', 'error');
    }
  }
};

// Enhanced tutorial functions
const tutorial = {
  showTutorialModal: () => {
    dom.tutorialModal.style.display = 'flex';
  },

  hideTutorialModal: () => {
    dom.tutorialModal.style.display = 'none';
  },

  saveDontShowPreference: () => {
    if (dom.dontShowAgainCheckbox.checked) {
      localStorage.setItem('dontShowTutorial', 'true');
    }
  }
};

// Initialization with better error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    handlers.initEventListeners();
    dom.qrContainer.classList.add('hidden');
    dom.cameraModal.style.display = 'none';
    dom.passphraseModal.style.display = 'none';
    dom.tutorialModal.style.display = 'none';
    dom.settingsModal.style.display = 'none';

    ui.showPlaceholder('Messages will appear here', 'fa-comments');

    const dontShowTutorial = localStorage.getItem('dontShowTutorial');
    if (!dontShowTutorial) {
      setTimeout(() => {
        tutorial.showTutorialModal();
      }, 2000);
    } else {
      setTimeout(() => {
        ui.showToast('Welcome to HushBox Enterprise. Your secure messaging.', 'success');
        dom.exportHistory.disabled = true;
      }, 1000);
    }

    loadSettings();
    
    if (CONFIG.AUTO_WIPE > 0) {
      appState.wipeTimer = setTimeout(() => {
        handlers.clearSensitiveData();
        ui.showToast('Sensitive data automatically wiped', 'info');
      }, CONFIG.AUTO_WIPE * 60000);
    }

    dom.closeTutorial.addEventListener('click', () => {
      tutorial.hideTutorialModal();
      setTimeout(() => {
        ui.showToast('Welcome to HushBox Enterprise. Your secure messaging.', 'success');
        dom.exportHistory.disabled = true;
      }, 500);
    });

    const closeModalButton = dom.tutorialModal.querySelector('.close-modal');
    if (closeModalButton) {
      closeModalButton.addEventListener('click', () => {
        tutorial.hideTutorialModal();
        setTimeout(() => {
          ui.showToast('Welcome to HushBox Enterprise. Your secure messaging.', 'success');
          dom.exportHistory.disabled = true;
        }, 500);
      });
    }

    dom.dontShowAgainButton.addEventListener('click', () => {
      tutorial.saveDontShowPreference();
      tutorial.hideTutorialModal();
      setTimeout(() => {
        ui.showToast('Welcome to HushBox Enterprise. Your secure messaging.', 'success');
        dom.exportHistory.disabled = true;
      }, 500);
    });

    dom.dontShowAgainCheckbox.addEventListener('change', () => {
      dom.dontShowAgainButton.classList.toggle('hidden', !dom.dontShowAgainCheckbox.checked);
    });
  } catch (error) {
    console.error('Initialization error:', error);
    ui.showToast('Application initialization failed', 'error');
  }
});
