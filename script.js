const elements = {
    messagesDiv: document.getElementById('messages'),
    passphraseInput: document.getElementById('passphrase'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    qrCanvas: document.getElementById('qr-canvas'),
    qrUpload: document.getElementById('qr-upload'),
    decodeButton: document.getElementById('decode-button'),
    downloadButton: document.getElementById('download-button'),
    qrContainer: document.getElementById('qr-container')
};

const cryptoUtils = {
    stringToArrayBuffer: str => new TextEncoder().encode(str),

    arrayBufferToString: buffer => new TextDecoder().decode(buffer),

    deriveKey: async (passphrase, salt) => {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            cryptoUtils.stringToArrayBuffer(passphrase),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    },

    encryptMessage: async (message, passphrase) => {
        try {
            const compressed = pako.deflate(cryptoUtils.stringToArrayBuffer(message));
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await cryptoUtils.deriveKey(passphrase, salt);

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                compressed
            );

            const combined = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]);
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    },

    decryptMessage: async (encryptedBase64, passphrase) => {
        try {
            const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
            const salt = encryptedData.slice(0, 16);
            const iv = encryptedData.slice(16, 28);
            const ciphertext = encryptedData.slice(28);

            const key = await cryptoUtils.deriveKey(passphrase, salt);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );

            const decompressed = pako.inflate(new Uint8Array(decrypted));
            return cryptoUtils.arrayBufferToString(decompressed);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }
};

const ui = {
    displayMessage: (content, isSent = false) => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSent ? 'sent' : ''}`;
        messageEl.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;

        if (!isSent) {
            elements.messagesDiv.querySelector('.message-placeholder')?.remove();
        }

        elements.messagesDiv.appendChild(messageEl);
        elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
    },

    generateQR: async (data) => {
    return new Promise((resolve, reject) => {
        QRCode.toCanvas(elements.qrCanvas, data, {
            width: 250,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, (error) => {
            if (error) {
                reject(error);
            } else {
                const ctx = elements.qrCanvas.getContext('2d');

                // Tamaño del círculo de la marca de agua
                const circleRadius = 40; // Radio del círculo
                const circleX = 125; // Centro horizontal del canvas (250px / 2)
                const circleY = 125; // Centro vertical del canvas (250px / 2)

                // Dibujar el círculo de fondo
                ctx.beginPath();
                ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'var(--primary-color)'; // Usar el color verde de tu CSS
                ctx.fill();

                // Configurar el estilo del texto
                ctx.fillStyle = '#00cc99'; // Texto en negro
                ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Texto "HUSH" arriba
                ctx.fillText('HUSH', circleX, circleY - 10); // 10px arriba del centro

                // Texto "BOX" debajo
                ctx.fillText('BOX', circleX, circleY + 15); // 15px debajo del centro

                elements.qrContainer.classList.remove('hidden');
                resolve();
            }
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

const handlers = {
    handleEncrypt: async () => {
        const message = elements.messageInput.value.trim();
        const passphrase = elements.passphraseInput.value.trim();

        if (!message || !passphrase) {
            alert('Please enter both a message and passphrase');
            return;
        }

        ui.showLoader(elements.sendButton, 'Encrypting...');

        try {
            const encrypted = await cryptoUtils.encryptMessage(message, passphrase);
            await ui.generateQR(encrypted);
            ui.displayMessage(`Encrypted: ${encrypted.slice(0, 40)}...`, true);
            elements.messageInput.value = '';
        } catch (error) {
            console.error('Encryption error:', error);
            alert(error.message);
        }

        ui.resetButton(elements.sendButton, `<i class="fas fa-lock"></i> Encrypt & Generate QR`);
    },

    handleDecrypt: async () => {
        const file = elements.qrUpload.files[0];
        const passphrase = elements.passphraseInput.value.trim();

        if (!file || !passphrase) {
            alert('Please select a QR file and enter passphrase');
            return;
        }

        ui.showLoader(elements.decodeButton, 'Decrypting...');

        try {
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
                        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
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
            ui.displayMessage(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            alert(error.message.includes('decrypt') ? 
                'Decryption failed. Wrong passphrase?' : 
                error.message);
        }

        ui.resetButton(elements.decodeButton, `<i class="fas fa-unlock"></i> Decrypt Message`);
    },

    handleDownload: () => {
        const link = document.createElement('a');
        link.download = 'hushbox-qr.png';
        link.href = elements.qrCanvas.toDataURL('image/png', 1.0);
        link.click();
    }
};

elements.sendButton.addEventListener('click', handlers.handleEncrypt);
elements.decodeButton.addEventListener('click', handlers.handleDecrypt);
elements.downloadButton.addEventListener('click', handlers.handleDownload);

elements.qrContainer.classList.add('hidden');
