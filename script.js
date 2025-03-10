// Configuración global para parámetros criptográficos
const CONFIG = {
    PBKDF2_ITERATIONS: 500000,
    SALT_LENGTH: 32,
    IV_LENGTH: 12,
    AES_KEY_LENGTH: 256,
    HMAC_LENGTH: 256,
    QR_SIZE: 200, // Tamaño base más compacto
    MIN_PASSPHRASE_LENGTH: 12
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
    qrContainer: document.getElementById('qr-container')
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
            CONFIG.AES_KEY_LENGTH + CONFIG.HMAC_LENGTH
        );

        const aesKey = await crypto.subtle.importKey(
            'raw',
            derivedBits.slice(0, CONFIG.AES_KEY_LENGTH / 8),
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );

        const hmacKey = await crypto.subtle.importKey(
            'raw',
            derivedBits.slice(CONFIG.AES_KEY_LENGTH / 8),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

        return { aesKey, hmacKey };
    },

    encryptMessage: async (message, passphrase) => {
        try {
            cryptoUtils.validatePassphrase(passphrase);
            const compressed = pako.deflate(cryptoUtils.stringToArrayBuffer(message), { level: 6 });
            const salt = crypto.getRandomValues(new Uint8Array(CONFIG.SALT_LENGTH));
            const iv = cryptoUtils.generateIV();
            const { aesKey, hmacKey } = await cryptoUtils.deriveKeyPair(passphrase, salt);

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                compressed
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

            const decompressed = pako.inflate(new Uint8Array(decrypted));
            return cryptoUtils.arrayBufferToString(decompressed);
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 100));
            throw new Error('Decryption failed: ' + error.message);
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
            const qrSize = Math.max(CONFIG.QR_SIZE, Math.min(400, Math.ceil(dataLength / 20) * 10 + 150));

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
    },

    showComingSoon: (button) => {
        const comingSoonEl = document.createElement('div');
        comingSoonEl.className = 'coming-soon-message';
        comingSoonEl.textContent = 'COMING SOON';

        const buttonRect = button.getBoundingClientRect();
        const containerRect = document.querySelector('.container').getBoundingClientRect();

        comingSoonEl.style.left = `${buttonRect.left - containerRect.left + buttonRect.width / 2}px`;
        comingSoonEl.style.top = `${buttonRect.top - containerRect.top - 50}px`;
        comingSoonEl.style.transform = 'translateX(-50%)';

        document.querySelector('.container').appendChild(comingSoonEl);
        setTimeout(() => {
            comingSoonEl.remove();
        }, 3000);
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

        const originalButtonHTML = domElements.imageButton.innerHTML;
        uiController.showLoader(domElements.imageButton, '');

        uiController.displayMessage('Loading image...', false);

        try {
            if (typeof jsQR === 'undefined') {
                throw new Error('jsQR library not loaded. Please refresh the page.');
            }

            const imageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(ctx.getImageData(0, 0, img.width, img.height));
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            uiController.displayMessage('Image loaded, decoding QR...', false);

            const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
            if (!qrCode) {
                throw new Error('No QR code detected in the image');
            }

            const decrypted = await cryptoUtils.decryptMessage(qrCode.data, passphrase);
            uiController.displayMessage(`Decrypted: ${decrypted}`, false);
            domElements.passphraseInput.value = '';
            fileInput.value = '';
        } catch (error) {
            console.error('Decryption error:', error);
            uiController.displayMessage(
                error.message.includes('decrypt') || error.message.includes('Integrity')
                    ? 'Decryption failed. Wrong passphrase or tampered data?'
                    : error.message,
                false
            );
        } finally {
            uiController.resetButton(domElements.imageButton, originalButtonHTML);
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

    handleScan: async (event) => {
        uiController.showComingSoon(event.currentTarget);
    },

    stopCamera: () => {
        const stream = domElements.cameraPreview.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            domElements.cameraPreview.srcObject = null;
            domElements.cameraContainer.classList.add('hidden');
        }
    },

    handleImageUpload: (event) => {
        uiController.showComingSoon(event.currentTarget);
    },

    handlePDFUpload: (event) => {
        uiController.showComingSoon(event.currentTarget);
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
domElements.scanButton.addEventListener('click', handlers.handlePDFUpload);
domElements.imageButton.addEventListener('click', handlers.handlePDFUpload);
domElements.pdfButton.addEventListener('click', handlers.handlePDFUpload);
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
