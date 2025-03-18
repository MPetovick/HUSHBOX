# 🔒 [HUSHBOX](https://www.hushbox.online) - Secure Messaging with QR

**HUSHBOX** is a privacy-first communication tool that combines military-grade encryption with QR code technology to enable secure message transmission. Designed for users who value digital privacy, it implements modern cryptographic standards to protect your communications from prying eyes.

Key Characteristics:
- **Zero-Server Architecture**: Messages never touch external servers
- **Ephemeral Design**: No message storage or tracking
- **Open Source**: Fully transparent security implementation
- **PWA Ready**: Installable as a progressive web app

## 🚀 Key Features

### 🔐 Core Security
- AES-256-GCM encryption with HMAC integrity protection
- PBKDF2 key derivation (250,000 iterations)
- Compressed payloads for efficient QR encoding
- Anti-brute force protection (5 attempts limit)

### 📱 User Experience
- Responsive design with mobile-first approach
- Real-time passphrase strength indicators
- Animated QR codes with custom branding
- Camera QR scanning (mobile devices) *Coming Soon
- Social media integration for secure sharing

### 🛡️ Advanced Protections
- IV time-stamping for replay attack prevention
- Memory sanitization after operations
- Secure content disposal
- Tamper-evident payload design

## 🛠️ Technical Stack

### Cryptography
| Component              | Specification                          |
|------------------------|----------------------------------------|
| Encryption Algorithm   | AES-GCM 256-bit                       |
| Key Derivation         | PBKDF2-HMAC-SHA256                    |
| Iterations             | 250,000                               |
| IV Generation          | Crypto-safe RNG + timestamp           |
| Data Integrity         | HMAC-SHA256                           |

### Frontend
- **QR Generation**: `qrcode@1.5.1`
- **QR Decoding**: `jsqr@1.4.0`
- **Compression**: `pako@2.1.0`
- **UI Framework**: Pure CSS Grid/Flex
- **Icons**: Font Awesome 6

## 📥 Installation & Usage

### Local Deployment
```bash
git clone https://github.com/MPetovick/HUSHBOX.git
cd HUSHBOX
# Serve using local web server
python3 -m http.server 8000
```
Open `http://localhost:8000` in modern browser

### Web Version  
[https://www.hushbox.online](https://mpetovick.github.io/HUSHBOX)

## 🔄 Workflow Diagram

**Backup Workflow:**
```mermaid
sequenceDiagram
    participant User
    participant HUSHBOX
    participant StorageMedium

    User->>HUSHBOX: 1. Enter data + passphrase
    HUSHBOX->>HUSHBOX: 2. Encrypt data + Generate QR
    HUSHBOX->>User: 3. Display secure QR
    User->>StorageMedium: 4. Save/Print QR (online/offline backup)
    StorageMedium->>User: 5. Retrieve QR (when needed)
    User->>HUSHBOX: 6. Scan QR + Enter passphrase
    HUSHBOX->>HUSHBOX: 7. Decrypt data
    HUSHBOX->>User: 8. Display decrypted data
```

**Offline Workflow:**
```mermaid
sequenceDiagram
    participant UserA
    participant HUSHBOX
    participant UserB

    UserA->>HUSHBOX: 1. Enter message + passphrase
    HUSHBOX->>HUSHBOX: 2. Encrypt + Generate QR
    HUSHBOX->>UserA: 3. Display secure QR
    UserA->>UserB: 4. Share QR (offline)
    UserB->>HUSHBOX: 5. Scan QR + Enter passphrase
    HUSHBOX->>UserB: 6. Decrypted message
```

**Online Workflow:**
```mermaid
sequenceDiagram
    participant UserA
    participant HUSHBOX_A
    participant SocialMedia
    participant HUSHBOX_B
    participant UserB

    UserA->>HUSHBOX_A: 1. Compose message + set passphrase
    HUSHBOX_A->>HUSHBOX_A: 2. Encrypt & Generate Secured QR
    HUSHBOX_A->>UserA: 3. Display Protected QR Code
    
    UserA->>SocialMedia: 4. Share QR via Twitter/Telegram/Other
    Note right of SocialMedia: Platform-Neutral Exchange
    SocialMedia->>UserB: 5. Notification of QR Post
    
    UserB->>HUSHBOX_B: 6. Import QR from Social Media
    UserB->>HUSHBOX_B: 7. Input Passphrase (via secure channel)
    HUSHBOX_B->>HUSHBOX_B: 8. Validate & Decrypt Contents
    HUSHBOX_B->>UserB: 9. Display Clear-Text Message
    
    Note over UserA,UserB: Passphrase Exchange via<br>Signal/Encrypted Email/Physical Meet
    Note over SocialMedia: Public QR Hosting<br>(Twitter DMs/Telegram Chats/Posts)
```

1. **Secure Creation Phase:**
   - User A crafts message + 12 + character passphrase
   - HUSHBOX performs AES-256 encryption with time-stamped IV
   - Generates branded QR with anti-scanning protection

2. **Social Media Distribution:**
   - User posts encrypted QR to chosen platform(s)
   - Options: Twitter DM groups, Telegram channels, or public posts
   - QR contains no metadata about sender/receiver

3. **Cross-Platform Reception:**
   - User B saves QR image from social platform
   - Uses HUSHBOX to scan/upload the QR file
   - Enters pre-shared passphrase (via separate secure channel)

4. **Multi-Layer Security:**
   - Social Media: Acts as public transport layer only
   - Secondary Channel: For passphrase exchange (e.g., Signal)
   - Time-Based Protection: QR contains encrypted timestamp for expiration *Coming soon

**Security Best Practices for Social Sharing:**
- 🔒 Never share passphrase on same platform as QR
- 🌐 Use different networks for QR and credential exchange
- ⏳ Set post expiration where possible (e.g., Twitter Fleets)
- 🔗 Prefer private channels (DMs) over public posts

This workflow enables secure communication through untrusted platforms while maintaining E2E encryption through the combination of QR steganography and separate credential exchange.

## ⚠️ Security Considerations

### Best Practices
- Use 15+ character passphrases
- Share passphrases through secure channels
- Verify QR source before scanning
- Limit decryption attempts
- Use in private browsing sessions

### Implementation Notes
- Memory wiping after crypto operations
- Time-based nonce generation
- Compression side-channel protection
- Secure error handling
- CSP-compliant script loading

## 📜 License
MIT License

## 🌐 Contact & Community
- Telegram: [@HUSHBOX_QR](https://t.me/HUSHBOX_QR)
- Twitter: [@HUSHBOXonline](https://twitter.com/HUSHBOXonline)

---

**HUSHBOX** - Your Digital Privacy Vault 🔏  
Because your secrets deserve better than the cloud ☁️✔
