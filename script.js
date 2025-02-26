const messagesDiv = document.getElementById('messages');
const passphraseInput = document.getElementById('passphrase');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const qrCanvas = document.getElementById('qr-canvas');
const qrUpload = document.getElementById('qr-upload');
const decodeButton = document.getElementById('decode-button');
const downloadButton = document.getElementById('download-button');


function stringToArrayBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}


function arrayBufferToString(buffer) {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
}


async function deriveKey(passphrase, salt) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        stringToArrayBuffer(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}


async function encryptMessage(message, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);

    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        stringToArrayBuffer(message)
    );

    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...result));
}


async function decryptMessage(encryptedBase64, passphrase) {
    const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const ciphertext = encryptedData.slice(28);

    const key = await deriveKey(passphrase, salt);

    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        ciphertext
    );

    return arrayBufferToString(decrypted);
}


function displayMessage(message, isSent, encrypted = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (isSent) messageElement.classList.add('sent');
    messageElement.textContent = encrypted ? `[Encrypted: ${message}]` : message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


async function generateQR(encryptedMessage) {
    QRCode.toCanvas(qrCanvas, encryptedMessage, { width: 200 }, (error) => {
        if (error) console.error('Error generating QR:', error);
    });
}


sendButton.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    const passphrase = passphraseInput.value.trim();

    if (!message || !passphrase) {
        alert('Please enter a message and passphrase.');
        return;
    }

    try {
        const encryptedMessage = await encryptMessage(message, passphrase);
        displayMessage(encryptedMessage, true, true);
        await generateQR(encryptedMessage);
        messageInput.value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing the message.');
    }
});


decodeButton.addEventListener('click', () => {
    const file = qrUpload.files[0];
    const passphrase = passphraseInput.value.trim();

    if (!file || !passphrase) {
        alert('Please upload a QR and provide a passphrase.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                decryptMessage(code.data, passphrase)
                    .then((decrypted) => {
                        displayMessage(decrypted, false);
                    })
                    .catch((error) => {
                        console.error('Error desencriptando QR:', error);
                        alert('The QR could not be decrypted. Passphrase correct?');
                    });
            } else {
                alert('No valid QR was detected in the image.');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Función para generar el QR (sin modificar visibilidad)
async function generateQR(encryptedMessage) {
    QRCode.toCanvas(qrCanvas, encryptedMessage, { width: 200 }, (error) => {
        if (error) console.error('Error generating QR:', error);
    });
}

// Función para descargar el QR (sin modificar visibilidad)
function downloadQR() {
    const canvas = qrCanvas;
    const dataURL = canvas.toDataURL('image/png'); 
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'qr_code.png'; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); 
}

// Evento del botón Send (sin manejar visibilidad del botón de descarga)
sendButton.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    const passphrase = passphraseInput.value.trim();

    if (!message || !passphrase) {
        alert('Please enter a message and passphrase.');
        return;
    }

    try {
        const encryptedMessage = await encryptMessage(message, passphrase);
        displayMessage(encryptedMessage, true, true);
        await generateQR(encryptedMessage);
        messageInput.value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing the message.');
    }
});

// Evento del botón de descarga
downloadButton.addEventListener('click', downloadQR);
