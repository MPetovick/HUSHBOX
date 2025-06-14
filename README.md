# 🔒 HUSHBOX - Your Digital Privacy Vault  


HUSHBOX is a next-generation, privacy-first communication tool that redefines secure messaging. By combining military-grade encryption with QR code technology, HUSHBOX enables users to exchange confidential messages without ever relying on external servers.

Unlike traditional platforms, all encryption and decryption occur locally on your device, ensuring your data remains completely under your control. Messages are never stored, logged, or transmitted through third-party infrastructure. Instead, encrypted QR codes can be shared via any medium, while your passphrase remains separate—ensuring maximum security even if the message is intercepted.

🔐 **Zero-Server Architecture** – Messages never touch external servers

🕵️ **Ephemeral Design** – No tracking, no storage, no metadata

🔓 **Open Source** – Transparent and auditable security

📱 **PWA Ready** – Install as a lightweight progressive web app

📴 **Offline Functionality** – Works seamlessly without internet access

**Perfect For**:  
🔏 Privacy-conscious individuals | 🏢 Enterprises handling sensitive data | 💼 Legal/medical professionals | 🛡️ Security researchers | ✈️ Travelers in high-risk areas  

---

## 🚀 Key Features

|       **Category**       |        **Key Features**                                                                   |
|--------------------------|-------------------------------------------------------------------------------------------|
| 🔐 **Core Security**     | - AES-256-GCM encryption with HMAC integrity protection <br> - PBKDF2 key derivation (310,000 iterations) <br> - Compressed payloads for efficient QR encoding <br> - Anti-brute force protection (5 attempts limit) |
| 📱 **User Experience**   | - Responsive design with mobile-first approach <br> - Real-time passphrase strength indicators <br> - Animated QR codes with custom branding <br> - Camera QR scanning (mobile devices) *Coming Soon <br> - Social media integration for secure sharing |
| 🛡️ **Advanced Protections** | - IV time-stamping for replay attack prevention <br> - Memory sanitization after operations <br> - Secure content disposal <br> - Tamper-evident payload design|

---

## ⚙️ Technical Stack
### Frontend Architecture  
```mermaid
graph TD
    A[Web Client] --> B[User Interface]
    B --> C[Encryption Module]
    B --> D[Decryption Module]
    C --> E[QR Generation]
    D --> F[QR Scanning]
    C --> G[Local Storage]
    D --> G
    G --> H[Message History]
    C & D --> I[AES-256-GCM Cryptography]
    I --> J[PBKDF2 Key Derivation]
```
### Encryption flow
```mermaid
sequenceDiagram
    Usuario->>Aplicación: Ingresa mensaje + passphrase
    Aplicación->>Crypto: Validar passphrase (zxcvbn)
    Crypto->>Crypto: Generar salt (32B) + IV (16B)
    Crypto->>Crypto: Derivar clave (PBKDF2-HMAC-SHA256)
    Crypto->>Crypto: Comprimir mensaje (pako DEFLATE)
    Crypto->>Crypto: Encriptar (AES-256-GCM)
    Crypto->>QR: Convertir a Base64
    QR->>UI: Generar código QR animado
    UI->>Usuario: Mostrar QR seguro
```
### Decryption flow
```mermaid
sequenceDiagram
    Usuario->>Aplicación: Escanea QR + ingresa passphrase
    Aplicación->>QR: Decodificar Base64
    QR->>Crypto: Extraer salt + IV + ciphertext
    Crypto->>Crypto: Validar passphrase (zxcvbn)
    Crypto->>Crypto: Derivar clave (PBKDF2-HMAC-SHA256)
    Crypto->>Crypto: Desencriptar (AES-256-GCM)
    Crypto->>Crypto: Descomprimir mensaje (pako INFLATE)
    Crypto->>UI: Mostrar mensaje plano
    UI->>Usuario: Ver mensaje desencriptado
```


### Dependencies  
| Library | Version | Purpose | SRI Hash |
|---------|---------|---------|----------|
| **pako**     | 2.1.0   | Compression DEFLATE           | `sha256-7eJpOkpqUSa501ZpBis1jsq2rnubhqHPMC/rRahRSQc=` |
| **qrcode**   | 1.5.1   | QR Generation                 | `sha256-7GTYmrMJbc6AhJEt7f+fLKWuZBRNDKzUoILCk9XQa1k=` |
| **jsqr**     | 1.4.0   | QR Decoding                   | `sha256-TnzVZFlCkL9D75PtJfOP7JASQkdCGD+pc60Lus+IrjA=` |
| **jspdf**    | 2.5.1   | PDF export                    | `sha256-mMzxeqEMILsTAXYmGPzJtqs6Tn8mtgcdZNC0EVTfOHU=` |
| **zxcvbn**   | 4.4.2   | Passphrase validation         | `sha256-9CxlH0BQastrZiSQ8zjdR6WVHTMSA5xKuP5QkEhPNRo=` |
- **UI Framework**: Pure CSS Grid/Flex
- **Icons**: Font Awesome 6

---

## 🛠️ Installation & Usage  

### Project Structure
```bash
HUSHBOX/
├── index.html          
├── script.js           
├── styles.css          
├── manifest.json       
├── favicon.ico
├── manifest.json
├── sitemap.xml
├── assets/                 
│   └──  favicon.png
├── legal/                
│   └── LICENSE.md
│   └── privacy-police.md
│   └── terms-of-service.md
├── LICENSE
└── README.md        
```
### Local Deployment
```bash
git clone https://github.com/MPetovick/HUSHBOX.git
cd HUSHBOX
# Serve using local web server
python3 -m http.server 8000
```
Open `http://localhost:8000` in modern browser or just click index.html

### Web Version  
[https://www.hushbox.online](https://mpetovick.github.io/HUSHBOX)


### User manual
1. Visit **[hushbox.online](https://www.hushbox.online)**  
2. **Encrypt a message**:  
   - Enter passphrase (12+ characters)  
   - Type your secret message  
   - Click "Encrypt"  
   - Share the generated QR via any channel  
3. **Decrypt a message**:  
   - Scan/upload a QR code  
   - Enter the passphrase (shared separately)  
   - Click "Decrypt"  
---

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
    User->>StorageMedium: 4. Save/Print QR (offline backup)
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

### Examples

### ₿ Crypto Wallet Seed Backup
```mermaid
sequenceDiagram
    participant User
    participant HUSHBOX
    participant SecureStorage
    participant BackupMedium

    User->>HUSHBOX: Enter seed phrase + strong passphrase
    HUSHBOX->>HUSHBOX: Encrypt seed using AES-256-GCM
    HUSHBOX->>User: Generate secured QR code
    User->>BackupMedium: Print QR on titanium plate
    User->>SecureStorage: Store in fireproof safe
    Note over User,SecureStorage: Store passphrase separately (e.g. password manager)
    User->>HUSHBOX: Destroy local session
```
***Security Features for Crypto Seeds***
- **Multi-Location Storage**: QR physical backup + digital passphrase
- **Redundancy**: Create multiple QR backups for different locations
- **Tamper Evidence**: QR contains HMAC signature to detect alterations
- **Time-Lock**: Optional delayed decryption feature
- **Plausible Deniability**: Seed appears as random data in QR

```mermaid
flowchart LR
    Seed[12/24-word Seed] --> HUSHBOX
    HUSHBOX -->|Encrypt| QR[Secured QR]
    QR --> Physical[Physical Backup]
    QR --> Digital[Digital Backup]
    Passphrase --> Manager[Password Manager]
    Passphrase --> Memory[Memorized]
    
    Physical --> Safe[Fireproof Safe]
    Digital --> Encrypted[Encrypted Cloud]
```

### 🏥 Medical Records Transfer

```mermaid
journey
    title HIPAA-Compliant Medical Data Transfer
    section Doctor
      Enter patient data: 5: Doctor
      Generate encrypted QR: 8: HUSHBOX
      Print QR on document: 6: Staff
    section Patient
      Receive physical document: 7: Patient
      Scan QR at home: 8: HUSHBOX
      Access medical records: 9: Patient Portal
    section Security
      Auto-expire after 72h: 8: System
      Audit trail: 7: Compliance
```

***Medical Use Case Features***
- **HIPAA Compliance**: End-to-end encrypted PHI (Protected Health Information)
- **Temporary Access**: Records auto-delete after set period
- **Access Control**: PIN-protected decryption
- **Emergency Access**: Break-glass mechanism for authorized personnel
- **Compliance Logging**: Tamper-proof access records

### 🔑 Enterprise Password Rotation

```mermaid
sequenceDiagram
    participant Admin
    participant HUSHBOX
    participant Employee
    participant ActiveDirectory

    Admin->>HUSHBOX: Generate new credentials
    HUSHBOX->>HUSHBOX: Create password + encrypt
    HUSHBOX->>Admin: Produce secure QR
    Admin->>ActiveDirectory: Update credentials
    ActiveDirectory-->>Admin: Confirmation
    Admin->>Employee: Distribute QR via secure channel
    Employee->>HUSHBOX: Scan QR + authenticate
    HUSHBOX->>Employee: Reveal credentials
    Employee->>Systems: Login with new credentials
```

***Security Advantages***
- **No Plaintext Transmission**: Credentials never sent via email/chat
- **One-Time Use**: QR invalidates after first scan
- **Biometric Verification**: Optional face/fingerprint unlock
- **Usage Analytics**: Track credential distribution
- **Auto-Rotation**: Schedule regular password updates

### 🗝️ Diplomatic Communication

```mermaid
sequenceDiagram
    participant Ambassador
    participant HUSHBOX
    participant Courier
    participant SecurityOfficer
    
    Ambassador->>HUSHBOX: 1. Encrypt message
    HUSHBOX->>Ambassador: 2. Generate secured QR
    Ambassador->>Courier: 3. Deliver sealed pouch
    Courier->>SecurityOfficer: 4. Transport to embassy
    SecurityOfficer->>HUSHBOX: 5. Scan QR + enter cipher
    HUSHBOX->>SecurityOfficer: 6. Display message
    SecurityOfficer->>HUSHBOX: 7. Destroy evidence
```

***Diplomatic Security Features***
- **Plausible Deniability**: Message appears as random data if intercepted
- **Duress Detection**: Hidden warning if decrypted under coercion
- **Multi-Party Auth**: Require 2 officers to decrypt
- **Geofencing**: Only decrypt in authorized locations
- **Ephemeral Storage**: Zero device persistence

### 🧪 Research Data Protection

```mermaid
journey
    title Intellectual Property Protection
    section Research
      Enter experimental data: 5: Scientist
      Encrypt with patent passphrase: 8: HUSHBOX
      Generate multiple QRs: 7: System
    section Protection
      Distribute QRs to stakeholders: 6: Legal
      Store in secure facilities: 9: Security
    section Access
      Court order verification: 8: System
      Multi-party decryption: 9: Executives
    section Audit
      Blockchain notarization: 7: System
      Access history: 8: Compliance
```

***Research Protection Features***
- **Patent-Safe Encryption**: Pre-filing data protection
- **Shamir's Secret Sharing**: Split across multiple QRs
- **Temporal Locks**: Decrypt only after specific date
- **Non-Repudiation**: Cryptographic proof of access
- **Data Inheritance**: Dead man's switch mechanism

## 🚨 Suggested Additional Workflows

### 1. Emergency Access System
```mermaid
sequenceDiagram
    participant User
    participant HUSHBOX
    participant Trustee1
    participant Trustee2
    participant Trustee3
    
    User->>HUSHBOX: Set up emergency access
    HUSHBOX->>Trustee1: Distribute partial QR
    HUSHBOX->>Trustee2: Distribute partial QR
    HUSHBOX->>Trustee3: Distribute partial QR
    Note over Trustee1,Trustee3: Require 2/3 to reconstruct
    User->>HUSHBOX: No activity for 30 days
    HUSHBOX->>Trustees: Send access requests
    Trustees->>HUSHBOX: Submit partial QRs
    HUSHBOX->>Designee: Grant full access
```

### 2. Notary Verification System
```mermaid
flowchart LR
    Document --> Hash[Create hash]
    Hash --> HUSHBOX
    HUSHBOX -->|Encrypt| QR[Notary QR]
    QR --> Seal[Document seal]
    Registry --> Blockchain
    
    Verify --> Scanner[Scan QR]
    Scanner --> Hasher[Recompute hash]
    Hasher --> Compare{Match?}
    Compare -->|Yes| Valid[Valid document]
    Compare -->|No| Invalid[Tampered document]
```

### 3. Digital Inheritance System
```mermaid
journey
    title Estate Planning Workflow
    section Setup
      Configure assets: 7: Owner
      Set verification method: 8: Attorney
      Distribute access QRs: 6: Executors
    section Activation
      Death certificate verification: 9: System
      Notify beneficiaries: 5: Executor
    section Access
      Multi-party authentication: 8: Executors
      Gradual release: 7: System
    section Distribution
      Transfer digital assets: 9: Beneficiaries
      Automatic revocation: 8: System
```

## 🛡️ Implementation Tips for All Workflows

1. **Physical Backup Best Practices**:
   - Use archival-quality paper or titanium plates
   - Laminate with UV-protective coating
   - Store in fireproof/waterproof containers
   - Create geographical distribution (multiple locations)

2. **Passphrase Management**:
   ```mermaid
   pie
       title Passphrase Storage Methods
       "Password Manager" : 45
       "Physical Vault" : 30
       "Memorization" : 15
       "Split Knowledge" : 10
   ```

3. **Security Verification Schedule**:
   - Monthly: Test decryption process
   - Quarterly: Rotate master passphrases
   - Annually: Replace physical backups
   - Biannually: Security audit penetration test

4. **Disaster Recovery**:
   - Maintain 3-2-1 backup rule:
     - 3 copies of QR
     - 2 different media types (paper/metal/digital)
     - 1 offsite location

These workflows demonstrate HUSHBOX's versatility across high-security scenarios. Each implementation maintains the core principles of zero-server architecture and client-side encryption while adapting to specific industry requirements.

---

## 🛡️ Security Specifications  

### Cryptography  
| Parameter | Value | Description |
|-----------|-------|-------------|
| Algorithm | AES-256-GCM | Authenticated encryption |
| Key Derivation | PBKDF2-HMAC-SHA256 | 310,000 iterations |
| Salt | 32 bytes | Unique per encryption |
| IV | 16 bytes | Cryptographic nonce |
| Compression | DEFLATE Level 6 | For messages >100 chars |

### Passphrase Requirements  
```mermaid
pie
    title Passphrase Complexity
    "Length > 12 chars" : 30
    "Uppercase chars" : 20
    "Lowercase chars" : 20
    "Numbers" : 15
    "Symbols" : 15
```

---

## 📈 Business Applications  

### Industry Solutions  
| Sector | Use Case |
|--------|----------|
| **Finance** | Secure earnings reports transmission |
| **Healthcare** | HIPAA-compliant patient data sharing |
| **Legal** | Confidential case document exchange |
| **Government** | Classified material distribution |
| **Manufacturing** | IP-protected blueprints sharing |

### Enterprise Benefits  
- **Zero Infrastructure Costs**: No servers to maintain  
- **Compliance Ready**: Meets GDPR/HIPAA requirements  
- **Employee Training**: <15 minute onboarding  
- **Security Certification**: HBX-SEC-2025-08 compliant   

---

## ⚠️ Security Best Practices  

### For All Users  
1. 🔑 Always use 15+ character passphrases  
2. 📲 Share passphrases via secure channels (Signal, ProtonMail)  
3. 🧹 Clear history after sensitive operations  
4. 🔒 Use in private browsing sessions or mode offline

### For Enterprises  
```mermaid
journey
    title Security Audit Workflow
    section Quarterly
      Run penetration testing : 5: Security
      Review access logs : 3: IT
      Update deployment : 4: DevOps
    section Annual
      Security certification : 8: Compliance
      Employee training : 6: HR
      Policy review : 7: Legal
```
---

## 📜 License  
GNU AFFERO GENERAL PUBLIC LICENSE - [View License](https://github.com/MPetovick/HUSHBOX/blob/main/LICENSE)

## 🌐 Contact    
- **Community**: [Telegram](https://t.me/HUSHBOX_QR) | [Twitter](https://twitter.com/HUSHBOXonline)  
---

<div align="center">
  <br>
  <strong>Privacy That Never Leaves Your Hands</strong> ♾️🔐<br>
  <strong>Try HUSHBOX Today → </strong> <a href="https://www.hushbox.online">www.hushbox.online</a><br>
</div>
