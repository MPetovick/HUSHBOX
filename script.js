// Configuración global para parámetros criptográficos
const CONFIG = {
    PBKDF2_ITERATIONS: 250000,
    SALT_LENGTH: 32,
    IV_LENGTH: 12,
    AES_KEY_LENGTH: 256,
    HMAC_LENGTH: 256,
    QR_SIZE: 200,
    MIN_PASSPHRASE_LENGTH: 12,
    COMPRESSION_THRESHOLD: 100,
    MAX_QR_SIZE: 350,
    CAMERA_TIMEOUT: 30000,
    DECRYPT_DELAY_INCREMENT: 100
};

// Elementos del DOM
const domElements = {
    uploadArrowButton: document.getElementById('upload-arrow-button'),
    scanButton: document.getElementById('scan-button'),
    imageButton: document.getElementById('image-button'),
    pdfButton: document.getElementById('pdf-button'),
    cameraContainer: document.getElementById('camera-container'),
    cameraPreview: document.getElementById('camera-preview'),
    messagesDiv: document.getElementById('messages'),
    passphraseInput: document.getElementById('passphrase'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    qrCanvas: document.getElementById('qr-canvas'),
    decodeButton: document.getElementById('decode-button'),
    downloadButton: document.getElementById('download-button'),
    shareButton: document.getElementById('share-button'),
    qrContainer: document.getElementById('qr-container'),
    tutorialModal: document.getElementById('tutorial-modal'),
    closeTutorial: document.getElementById('close-tutorial'),
    dontShowAgain: document.getElementById('dont-show-again'),
    closeModalButton: document.querySelector('.close-modal'),
    comingSoonMessage: document.getElementById('coming-soon-message')
};

// Input oculto para la carga de imágenes
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// Canvas oculto para procesar el video
const scanCanvas = document.createElement('canvas');
const scanContext = scanCanvas.getContext('2d');
scanCanvas.style.display = 'none';
document.body.appendChild(scanCanvas);

// Variables para protección contra fuerza bruta
let decryptAttempts = 0;
let cameraTimeoutId = null;

// Verificar si el usuario ha elegido no mostrar el modal nuevamente
const shouldShowModal = () => {
    const dontShowAgain = localStorage.getItem('dontShowAgain');
    return dontShowAgain !== 'true'; // Mostrar modal si no está marcado como "No mostrar nuevamente"
};

// Mostrar el modal si es necesario
const showTutorialModal = () => {
    if (shouldShowModal()) {
        domElements.tutorialModal.style.display = 'flex';
    }
};

// Cerrar el modal
const closeTutorialModal = () => {
    domElements.tutorialModal.style.display = 'none';
};

// Guardar la preferencia del usuario en localStorage
const setDontShowAgain = () => {
    localStorage.setItem('dontShowAgain', 'true');
    closeTutorialModal();
};

// Función para mostrar y ocultar el mensaje "Coming Soon"
const showComingSoonMessage = () => {
    domElements.comingSoonMessage.classList.add('visible');
    setTimeout(() => {
        domElements.comingSoonMessage.classList.remove('visible');
    }, 2000); // El mensaje desaparece después de 2 segundos
};

// Event listeners
document.addEventListener('DOMContentLoaded', showTutorialModal); // Mostrar modal al cargar la página
domElements.closeTutorial.addEventListener('click', closeTutorialModal); // Cerrar modal al hacer clic en "Got it!"
domElements.closeModalButton.addEventListener('click', closeTutorialModal); // Cerrar modal al hacer clic en la "X"
domElements.dontShowAgain.addEventListener('click', setDontShowAgain); // Guardar preferencia y cerrar modal

// Event listeners para los botones de "Coming Soon"
domElements.scanButton.addEventListener('click', showComingSoonMessage);
domElements.imageButton.addEventListener('click', showComingSoonMessage);
domElements.pdfButton.addEventListener('click', showComingSoonMessage);

// Habilitar botones dinámicamente
domElements.scanButton.disabled = false; // Habilitar cuando la funcionalidad de escaneo esté lista
domElements.imageButton.disabled = false; // Habilitar cuando la funcionalidad de carga de imagen esté lista
domElements.pdfButton.disabled = false; // Habilitar cuando la funcionalidad de PDF esté lista

// Deshabilitar decodeButton inicialmente
domElements.decodeButton.disabled = true;

// Habilitar decodeButton cuando se cargue un archivo
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        domElements.decodeButton.disabled = false;
    } else {
        domElements.decodeButton.disabled = true;
    }
});

// Utilidades criptográficas
const cryptoUtils = {
    stringToArrayBuffer: str => new TextEncoder().encode(str),
    arrayBufferToString: buffer => new TextDecoder().decode(buffer),

    validatePassphrase: (passphrase) => {
        if (passphrase.length < CONFIG.MIN_PASSPHRASE_LENGTH) {
            throw new Error(`Passphrase must be at least ${CONFIG.MIN_PASSPHRASE_LENGTH} characters long`);
        }
        if (/^(.)\1+$/.test(passphrase)) {
            throw new Error('Passphrase cannot consist of repeated characters');
        }
        // Métrica básica de entropía
        const uniqueChars = new Set(passphrase).size;
        if (uniqueChars < 5) {
            throw new Error('Passphrase should have at least 5 unique characters');
        }
        return true;
    },

    generateIV: () => {
        const nonce = new Uint8Array(CONFIG.IV_LENGTH);
        crypto.getRandomValues(nonce.slice(0, 8));
        const timestamp = Math.floor(Date.now() / 1000);
        nonce.set(new Uint8Array(new Int32Array([timestamp]).buffer), 8);
        return nonce;
    },

    deriveKeyPair: async (passphrase, salt) => {
        const baseKeyMaterial = await crypto.subtle.importKey(
            'raw',
            cryptoUtils.stringToArrayBuffer(passphrase),
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
            baseKeyMaterial,
            CONFIG.AES_KEY_LENGTH + CONFIG.HMAC_LENGTH // Total bits for AES and HMAC keys
        );

        // Convertir ArrayBuffer a Uint8Array para manipulación
        const derivedBitsArray = new Uint8Array(derivedBits);

        const aesKey = await crypto.subtle.importKey(
            'raw',
            derivedBitsArray.slice(0, CONFIG.AES_KEY_LENGTH / 8),
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );

        const hmacKey = await crypto.subtle.importKey(
            'raw',
            derivedBitsArray.slice(CONFIG.AES_KEY_LENGTH / 8),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

        // Sobrescribir datos sensibles en memoria
        derivedBitsArray.fill(0);

        return { aesKey, hmacKey };
    },

    encryptMessage: async (message, passphrase) => {
        try {
            cryptoUtils.validatePassphrase(passphrase);
            let dataToEncrypt = cryptoUtils.stringToArrayBuffer(message);
            if (message.length > CONFIG.COMPRESSION_THRESHOLD) {
                dataToEncrypt = pako.deflate(dataToEncrypt, { level: 6 });
            }
            const salt = crypto.getRandomValues(new Uint8Array(CONFIG.SALT_LENGTH));
            const iv = cryptoUtils.generateIV();
            const { aesKey, hmacKey } = await cryptoUtils.deriveKeyPair(passphrase, salt);

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                dataToEncrypt
            );

            const hmac = await crypto.subtle.sign(
                'HMAC',
                hmacKey,
                encrypted
            );

            const combined = new Uint8Array([
                ...salt,
                ...iv,
                ...new Uint8Array(encrypted),
                ...new Uint8Array(hmac)
            ]);
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        } finally {
            // Limpiar memoria
            passphrase = null;
            dataToEncrypt = null;
        }
    },

    decryptMessage: async (encryptedBase64, passphrase) => {
        try {
            const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
            const salt = encryptedData.slice(0, CONFIG.SALT_LENGTH);
            const iv = encryptedData.slice(CONFIG.SALT_LENGTH, CONFIG.SALT_LENGTH + CONFIG.IV_LENGTH);
            const ciphertext = encryptedData.slice(CONFIG.SALT_LENGTH + CONFIG.IV_LENGTH, -32);
            const hmac = encryptedData.slice(-32);

            const { aesKey, hmacKey } = await cryptoUtils.deriveKeyPair(passphrase, salt);

            const isValid = await crypto.subtle.verify(
                'HMAC',
                hmacKey,
                hmac,
                ciphertext
            );

            if (!isValid) {
                throw new Error('Integrity check failed: Data has been tampered with');
            }

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                ciphertext
            );

            let decompressed;
            try {
                decompressed = pako.inflate(new Uint8Array(decrypted));
            } catch (e) {
                decompressed = new Uint8Array(decrypted);
            }
            return cryptoUtils.arrayBufferToString(decompressed);
        } catch (error) {
            decryptAttempts++;
            await new Promise(resolve => setTimeout(resolve, decryptAttempts * CONFIG.DECRYPT_DELAY_INCREMENT));
            throw new Error('Decryption failed: ' + error.message);
        } finally {
            // Limpiar memoria
            passphrase = null;
        }
    }
};

// Controlador de la interfaz de usuario
const uiController = {
    displayMessage: (content, isSent = false) => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSent ? 'sent' : ''}`;
        messageEl.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        if (!isSent) {
            domElements.messagesDiv.querySelector('.message-placeholder')?.remove();
        }
        domElements.messagesDiv.appendChild(messageEl);
        domElements.messagesDiv.scrollTop = domElements.messagesDiv.scrollHeight;
    },

    generateQR: async (data) => {
        return new Promise((resolve, reject) => {
            const dataLength = data.length;
            const qrSize = Math.min(CONFIG.MAX_QR_SIZE, Math.max(CONFIG.QR_SIZE, Math.ceil(dataLength / 20) * 10 + 150));

            // Preparar el canvas principal con dimensiones desde el inicio
            domElements.qrCanvas.width = qrSize;
            domElements.qrCanvas.height = qrSize;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = qrSize;
            tempCanvas.height = qrSize;

            QRCode.toCanvas(tempCanvas, data, {
                width: qrSize,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'H'
            }, (error) => {
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
                ctx.fillStyle = 'var(--primary-color)';
                ctx.fill();

                ctx.fillStyle = '#00cc99';
                ctx.font = `bold ${qrSize * 0.08}px "Segoe UI", system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('HUSH', circleX, circleY - circleRadius * 0.2);
                ctx.fillText('BOX', circleX, circleY + circleRadius * 0.3);

                const qrCtx = domElements.qrCanvas.getContext('2d');
                qrCtx.clearRect(0, 0, qrSize, qrSize);
                qrCtx.drawImage(tempCanvas, 0, 0, qrSize, qrSize);

                // Mostrar el contenedor solo después de que el QR esté listo
                domElements.qrContainer.classList.remove('hidden');

                resolve();
            });
        });
    },

    showLoader: (button, text = 'Processing...') => {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        button.disabled = true;
    },

    resetButton: (button, originalHTML) => {
        button.innerHTML = originalHTML;
        button.disabled = false;
    }
};

// Manejadores de eventos
const handlers = {
    handleEncrypt: async () => {
        const message = domElements.messageInput.value.trim();
        const passphrase = domElements.passphraseInput.value.trim();

        if (!message || !passphrase) {
            uiController.displayMessage('Please enter both a message and a passphrase', false);
            return;
        }

        const originalHTML = domElements.sendButton.innerHTML;
        uiController.showLoader(domElements.sendButton, 'Encrypting...');

        try {
            const encrypted = await cryptoUtils.encryptMessage(message, passphrase);
            await uiController.generateQR(encrypted);
            uiController.displayMessage(`Encrypted: ${encrypted.slice(0, 40)}...`, true);
            domElements.messageInput.value = '';
            domElements.passphraseInput.value = '';
        } catch (error) {
            console.error('Encryption error:', error);
            uiController.displayMessage(error.message || 'Encryption failed. Please try again.', false);
        } finally {
            uiController.resetButton(domElements.sendButton, originalHTML);
        }
    },

    handleDecrypt: async () => {
        const file = fileInput.files[0];
        const passphrase = domElements.passphraseInput.value.trim();

        if (!file || !passphrase) {
            uiController.displayMessage('Please select a QR file and enter a passphrase', false);
            return;
        }

        const originalButtonHTML = domElements.decodeButton.innerHTML;
        uiController.showLoader(domElements.decodeButton, 'Decrypting...');

        try {
            const imageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 800;
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height *= MAX_SIZE / width;
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width *= MAX_SIZE / height;
                                height = MAX_SIZE;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(ctx.getImageData(0, 0, width, height));
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
            if (!qrCode) {
                throw new Error('No QR code detected in the image');
            }

            const decrypted = await cryptoUtils.decryptMessage(qrCode.data, passphrase);
            uiController.displayMessage(`Decrypted: ${decrypted}`, false);
            domElements.passphraseInput.value = '';
            fileInput.value = '';
            decryptAttempts = 0; // Reiniciar contador de intentos
        } catch (error) {
            console.error('Decryption error:', error);
            uiController.displayMessage(
                error.message.includes('decrypt') || error.message.includes('Integrity')
                    ? 'Decryption failed. Wrong passphrase or tampered data?'
                    : error.message,
                false
            );
        } finally {
            uiController.resetButton(domElements.decodeButton, originalButtonHTML);
        }
    },

    handleDownload: () => {
        const link = document.createElement('a');
        link.download = 'hushbox-qr.png';
        link.href = domElements.qrCanvas.toDataURL('image/png', 1.0);
        link.click();
    },

    handleShare: async () => {
        const qrDataUrl = domElements.qrCanvas.toDataURL('image/png', 1.0);
        const qrBlob = await (await fetch(qrDataUrl)).blob();
        const qrFile = new File([qrBlob], 'hushbox-qr.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [qrFile] })) {
            try {
                await navigator.share({
                    title: 'HushBox Secure QR',
                    text: 'Check out this encrypted QR code from HushBox!',
                    files: [qrFile]
                });
                uiController.displayMessage('QR shared successfully!', false);
            } catch (error) {
                console.error('Share error:', error);
                uiController.displayMessage('Sharing failed: ' + error.message, false);
            }
        } else {
            try {
                await navigator.clipboard.writeText(qrDataUrl);
                uiController.displayMessage('QR data URL copied to clipboard!', false);
            } catch (error) {
                console.error('Clipboard error:', error);
                uiController.displayMessage('Failed to copy QR to clipboard', false);
            }
        }
    },

    stopCamera: () => {
        const stream = domElements.cameraPreview.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            domElements.cameraPreview.srcObject = null;
            domElements.cameraContainer.classList.add('hidden');
            if (cameraTimeoutId) {
                clearTimeout(cameraTimeoutId);
                cameraTimeoutId = null;
            }
        }
    },

    handleUploadArrow: () => {
        fileInput.click();
    }
};

// Event listeners
domElements.uploadArrowButton.addEventListener('click', handlers.handleUploadArrow);
domElements.sendButton.addEventListener('click', handlers.handleEncrypt);
domElements.decodeButton.addEventListener('click', handlers.handleDecrypt);
domElements.downloadButton.addEventListener('click', handlers.handleDownload);
domElements.shareButton.addEventListener('click', handlers.handleShare);
fileInput.addEventListener('change', handlers.handleDecrypt);

// Validación visual de la passphrase
domElements.passphraseInput.addEventListener('input', (e) => {
    const passphrase = e.target.value;
    const keyIcon = domElements.passphraseInput.parentElement.querySelector('.icon');

    if (passphrase.length === 0) {
        keyIcon.style.color = 'rgba(160, 160, 160, 0.6)';
    } else if (passphrase.length < CONFIG.MIN_PASSPHRASE_LENGTH) {
        keyIcon.style.color = 'var(--error-color)';
    } else {
        try {
            cryptoUtils.validatePassphrase(passphrase);
            keyIcon.style.color = 'var(--success-color)';
        } catch (error) {
            keyIcon.style.color = 'var(--error-color)';
        }
    }
});

// Detener la cámara al salir de la página si está activa
window.addEventListener('beforeunload', (e) => {
    if (domElements.cameraPreview.srcObject) {
        e.preventDefault();
        e.returnValue = 'Camera is active. Are you sure you want to leave?';
        handlers.stopCamera();
    }
});

// Inicialización
domElements.qrContainer.classList.add('hidden');
domElements.cameraContainer.classList.add('hidden');
