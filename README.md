# VendorVerify Agent — V-VERIFY
### Terminal 3 Agent Dev Kit · Bounty Challenge Submission

> **"Access does not equal transfer."**  
> — T3N Network Core Principle

---

## Overview

**VendorVerify (V-VERIFY)** adalah platform B2B compliance onboarding yang dijalankan oleh dua autonomous AI agent — **Vendor Agent** dan **Buyer Agent** — yang berkomunikasi melalui **Terminal 3 Network (T3N)** menggunakan protokol identitas terdesentralisasi (DID) dan **Intel TDX Trusted Execution Environment (TEE)**.

Sistem ini mengeliminasi kebutuhan untuk berbagi dokumen sensitif secara langsung. Vendor mengenkripsi dokumen KYC mereka ke dalam storage network terenkripsi. Buyer Agent memicu verifikasi compliance melalui **WASM smart contract** yang berjalan di dalam **TEE enclave** — dokumen hanya pernah didekripsi di dalam enclave yang terisolasi, bukan di mesin Buyer atau server publik manapun.

Hasil akhirnya adalah **W3C Verifiable Credential (VC)** yang ditandatangani secara kriptografis dan dikaitkan ke DID Vendor — dapat diverifikasi oleh siapapun tanpa perlu mengekspos data mentah.

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER (Client)                          │
│                                                                          │
│   ┌──────────────────────┐       ┌──────────────────────────────────┐   │
│   │   Vendor Agent UI    │       │       Buyer Agent UI             │   │
│   │  (VendorDashboard)   │       │     (BuyerDashboard)             │   │
│   │                      │       │                                  │   │
│   │  • Register KYC form │       │  • Input Vendor DID              │   │
│   │  • Quick Register    │       │  • Trigger Onboarding            │   │
│   │  • Reveal/Mask PII   │       │  • View VC + Raw JSON-LD         │   │
│   │  • Grant/Revoke DID  │       │  • Live Escrow Yield counter     │   │
│   └──────────┬───────────┘       └──────────────┬───────────────────┘   │
│              │  POST /api/vendor                 │  GET /api/onboard     │
│              │  POST /api/revoke                 │  (SSE stream)         │
└──────────────┼───────────────────────────────────┼─────────────────────-┘
               │                                   │
               ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS SERVER (API Routes)                         │
│                                                                          │
│   POST /api/vendor    → Daftarkan profil vendor, generate DID           │
│   GET  /api/vendor    → Ambil state vendor + status autorisasi          │
│   GET  /api/onboard   → SSE stream 6-langkah proses TEE onboarding     │
│   POST /api/revoke    → Revoke atau grant akses data ke Buyer DID       │
│   GET  /api/ledger    → Ambil audit trail + semua VC yang sudah issued  │
│                                                                          │
│              ▼  semua endpoint memanggil                                │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │              T3NService (Singleton Pattern)                       │  │
│   │              src/lib/t3n-client.ts                                │  │
│   │                                                                   │  │
│   │  • In-memory state: vendorProfile, credentials[], ledger[]       │  │
│   │  • activeDelegations: Record<buyerDid, boolean>                  │  │
│   │  • getRealClient(): Coba load @terminal3/t3n-sdk jika env ada    │  │
│   │  • Jika tidak ada T3N_PRIVATE_KEY → fallback ke simulator        │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│              ▼  Dengan T3N_PRIVATE_KEY                                  │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │              @terminal3/t3n-sdk  (WASM)                          │  │
│   │                                                                   │  │
│   │  setEnvironment("testnet")                                       │  │
│   │  loadWasmComponent()                                             │  │
│   │  eth_get_address(privateKey)                                     │  │
│   │  T3nClient.handshake()                                           │  │
│   │  T3nClient.authenticate(ethAuthInput)  → DID resolved            │  │
│   └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Alur Data: Compliance Onboarding End-to-End

```
Vendor                        T3NService (Server)               Buyer Agent
  │                                   │                               │
  │── POST /api/vendor ──────────────>│                               │
  │   { companyName, taxId,           │  registerVendor()             │
  │     ownerName, passport,          │  generate DID:                │
  │     bankName, bankAccount }       │  did:t3n:vendor-{name}-0x4a9b │
  │                                   │  logAudit(DATA_INGESTION)     │
  │<── { did, registered: true } ─────│                               │
  │                                   │                               │
  │── POST /api/revoke (grant) ──────>│  activeDelegations[buyer]=true│
  │                                   │  logAudit(ACCESS_GRANT)       │
  │                                   │                               │
  │                                   │<── GET /api/onboard?vendorDid ─│
  │                                   │         &buyerDid             │
  │                                   │                               │
  │                   ┌───────────────┴── SSE Stream ─────────────────>
  │                   │ Step 1: SESSION_HANDSHAKE (800ms)             │
  │                   │   → ML-KEM-768 ephemeral key exchange         │
  │                   │ Step 2: AUTH (800ms)                          │
  │                   │   → Cek activeDelegations[buyerDid]           │
  │                   │   → Jika false: ONBOARDING_REJECTED           │
  │                   │ Step 3: TEE DECRYPT (1200ms)                  │
  │                   │   → Mount Intel TDX enclave                   │
  │                   │   → Dekripsi vendor profile dari storage      │
  │                   │ Step 4: SANCTIONS (1500ms)                    │
  │                   │   → Query OFAC/UN/EU sanctions API            │
  │                   │   → companyName.includes("sanctioned")?       │
  │                   │   → Jika ya: SANCTIONS_SCREENING_FAILED       │
  │                   │ Step 5: POLICY (1000ms)                       │
  │                   │   → Validasi passport + taxId + bankAccount   │
  │                   │ Step 6: VC ISSUANCE (1000ms)                  │
  │                   │   → Generate W3C Verifiable Credential        │
  │                   │   → logAudit(CREDENTIAL_ISSUANCE)            │
  │                   └───────────────── { type: "complete", VC } ───>│
  │                                   │                               │
  │                                   │  GET /api/ledger <───────────-│
  │                                   │  → { ledger[], credentials[] }│
```

---

## Struktur Proyek

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Font, metadata, ToastProvider wrapper
│   │   ├── page.tsx                    # Landing page marketing (/)
│   │   ├── globals.css                 # Design tokens: --gold, --bone, --oxblood, dll
│   │   ├── portal/
│   │   │   ├── page.tsx               # Dashboard utama (/portal)
│   │   │   │   ├── State management (vendor, buyer, ledger, credential)
│   │   │   │   ├── localStorage sync (serverless cold-start recovery)
│   │   │   │   ├── SSE handler (EventSource → SimulationPanel)
│   │   │   │   └── Drawer: Block Inspector + VC Raw JSON-LD viewer
│   │   │   └── sandbox/
│   │   │       └── page.tsx           # Sandbox page (/portal/sandbox)
│   │   │           ├── State sync + localStorage recovery
│   │   │           └── handleAutofillDemo (1-click demo vendor)
│   │   └── api/
│   │       ├── vendor/route.ts         # GET profil | POST daftar vendor
│   │       ├── onboard/route.ts        # GET SSE stream 6-langkah TEE
│   │       ├── revoke/route.ts         # POST grant | revoke akses
│   │       └── ledger/route.ts         # GET audit trail + credentials
│   ├── components/
│   │   ├── VendorDashboard.tsx         # Form registrasi KYC + Access control
│   │   │   ├── Quick Register (1-klik isi+submit)
│   │   │   ├── Autofill Valid / Autofill Sanctioned
│   │   │   └── Reveal/Mask PII toggle
│   │   ├── BuyerDashboard.tsx          # Trigger onboarding + tampil VC
│   │   │   ├── Vendor DID input
│   │   │   ├── Verification Verdict panel
│   │   │   ├── Attested Claims (redacted PII)
│   │   │   └── Live Escrow Yield counter (simulasi APY)
│   │   ├── SimulationPanel.tsx         # Live step-by-step TEE execution viewer
│   │   │   ├── 6-step progress indicator
│   │   │   └── TEE Memory State console (real-time logs)
│   │   ├── AuditLedger.tsx             # Immutable cryptographic audit table
│   │   │   ├── Copy tx hash ke clipboard
│   │   │   └── Inspect block → Drawer detail
│   │   ├── IntegrationSandbox.tsx      # Real-world DID/VC integration simulator
│   │   │   ├── Tab 1: B2B SSO Portal (Oracle Gateway)
│   │   │   ├── Tab 2: Escrow Payout (USDC smart contract)
│   │   │   ├── Tab 3: DeFi Lending Pool (Aave RWA)
│   │   │   └── Quick Autofill button jika DID belum terdaftar
│   │   ├── Toast.tsx                   # Global toast notification system
│   │   └── marketing/                  # Halaman landing premium
│   │       ├── Hero.tsx
│   │       ├── MissingLayer.tsx
│   │       ├── Modules.tsx
│   │       ├── Passport.tsx
│   │       ├── Stack.tsx
│   │       ├── FinalCTA.tsx
│   │       └── MarketingHeader.tsx
│   └── lib/
│       ├── t3n-client.ts               # T3NService singleton + SDK integration
│       └── types.ts                    # VendorProfile, VerifiableCredential, AuditEntry, SimulationStep
├── package.json
├── biome.json                          # Linter/formatter config
├── tsconfig.json
└── next.config.ts
```

---

## API Reference

### `GET /api/vendor`
Mengambil state vendor aktif dan status autorisasi Buyer Agent.

**Response:**
```json
{
  "profile": {
    "companyName": "AeroSpace Ventures Inc.",
    "taxId": "US-EIN-9920194A",
    "ownerName": "Marcus Aurelius",
    "passportNumber": "P-9201948",
    "bankName": "Global Institutional Bank",
    "bankAccount": "GIB-US-9910-4820",
    "did": "did:t3n:vendor-aerospace-ventures-inc--0x4a9b",
    "registered": true,
    "registeredAt": "2026-06-07T13:00:00.000Z"
  },
  "buyerDid": "did:t3n:buyer-corp-0x8f2d",
  "isAuthorized": true
}
```

---

### `POST /api/vendor`
Mendaftarkan profil vendor baru. Secara otomatis men-generate DID dan mengaktifkan autorisasi ke Buyer Agent default.

**Request Body:**
```json
{
  "companyName": "string",
  "taxId": "string",
  "ownerName": "string",
  "passportNumber": "string",
  "bankName": "string",
  "bankAccount": "string"
}
```

---

### `GET /api/onboard?vendorDid=...&buyerDid=...`
Menjalankan 6-langkah proses compliance onboarding melalui **Server-Sent Events (SSE)**. Setiap langkah dikirim sebagai event terpisah.

**Event Types:**
| Type | Payload | Keterangan |
|------|---------|------------|
| `step` | `{ type: "step", step: SimulationStep }` | Update status setiap langkah |
| `complete` | `{ type: "complete", credential: VerifiableCredential }` | VC berhasil di-issue |
| `error` | `{ type: "error", message: string }` | Proses gagal (revoked/sanctioned/no profile) |

**6 Langkah Eksekusi:**
| # | ID | Durasi | Keterangan |
|---|----|--------|------------|
| 1 | `handshake` | ~800ms | ML-KEM-768 ephemeral key exchange dengan T3N node |
| 2 | `auth` | ~800ms | Validasi DID + cek delegation token dari Vendor |
| 3 | `decrypt` | ~1200ms | Mount Intel TDX enclave, dekripsi vendor profile |
| 4 | `sanctions` | ~1500ms | Query OFAC SDN, UN, EU CFSP sanctions databases |
| 5 | `policy` | ~1000ms | Validasi kelengkapan dokumen (passport, taxId, bank) |
| 6 | `credential` | ~1000ms | Generate W3C VC, commit block ke audit ledger |

---

### `POST /api/revoke`
Mengontrol akses data antara Vendor dan Buyer Agent.

**Request Body:**
```json
{ "action": "revoke" }
// atau
{ "action": "grant" }
```

---

### `GET /api/ledger`
Mengambil semua audit entries dan issued credentials.

**Response:**
```json
{
  "ledger": [AuditEntry, ...],
  "credentials": [VerifiableCredential, ...]
}
```

---

## Data Types

```typescript
interface VendorProfile {
  companyName: string;
  taxId: string;
  ownerName: string;
  passportNumber: string;
  bankName: string;
  bankAccount: string;
  did: string;                // Format: did:t3n:vendor-{slug}-0x4a9b
  registered: boolean;
  registeredAt?: string;      // ISO 8601
}

interface VerifiableCredential {
  id: string;                 // Format: vc:t3n:compliance-{random}
  subjectDid: string;         // DID Vendor
  issuerDid: string;          // did:t3n:tee-contract-0x92f1
  issuanceDate: string;       // ISO 8601
  expirationDate: string;     // issuanceDate + 365 hari
  status: "valid" | "revoked";
  claims: {
    companyName: string;
    country: string;
    sanctionsClear: boolean;
    kycVerified: boolean;
  };
}

interface AuditEntry {
  index: number;
  timestamp: string;          // ISO 8601
  txHash: string;             // Format: 0x{64 hex chars}
  actorDid: string;
  targetDid: string;
  action:
    | "CONTRACT_DEPLOY"
    | "SESSION_HANDSHAKE"
    | "DATA_INGESTION"
    | "ONBOARDING_REJECTED"
    | "SANCTIONS_SCREENING_FAILED"
    | "CREDENTIAL_ISSUANCE"
    | "ACCESS_REVOCATION"
    | "ACCESS_GRANT";
  details: string;
}

interface SimulationStep {
  id: "handshake" | "auth" | "decrypt" | "sanctions" | "policy" | "credential";
  title: string;
  description: string;
  status: "idle" | "running" | "success" | "failed";
  timestamp?: string;
}
```

---

## T3N SDK Integration

`T3NService` menggunakan **Singleton pattern** dan mendeteksi environment secara otomatis:

```
T3N_PRIVATE_KEY tersedia di .env.local?
        │
        ├─ Ya  → Load @terminal3/t3n-sdk (WASM)
        │           setEnvironment("testnet")
        │           loadWasmComponent()
        │           T3nClient.handshake()
        │           T3nClient.authenticate(createEthAuthInput(address))
        │           → Resolve DID nyata dari testnet
        │
        └─ Tidak → Fallback ke high-fidelity simulator
                    (timer-based, identik secara perilaku dengan SDK nyata)
```

### Testnet Handshake Log (Real Connection):
```
[T3N SDK] Dynamically loading @terminal3/t3n-sdk...
Setting environment to testnet...
Loading WASM component...
WASM loaded successfully.
Derived Address: 0x9f37d905cffd253d5261096662a5bb7b9e0e2cef
Initializing client...
Performing handshake...
Handshake successful!
Authenticating...
[T3N SDK] Real authentication successful.
DID: did:t3n:02153a2434e7972d33573f024aedfc530c76a3a3
```

---

## Serverless State Management

Karena API Routes Next.js berjalan di **serverless functions** (Vercel), state in-memory di `T3NService` akan hilang saat container di-restart (*cold start*). Solusi yang diimplementasikan:

```
Client (localStorage)          Server (T3NService in-memory)
        │                                     │
        │  Setiap aksi tulis:                 │
        │  • t3n_vendor_profile               │
        │  • t3n_is_authorized                │
        │  • t3n_credential                   │
        │  • t3n_ledger                       │
        │                                     │
        │  Saat page load (fetchData):        │
        │  1. Baca localStorage               │
        │  2. GET /api/vendor                 │
        │  3. Jika server kosong + local ada: │
        │     → POST /api/vendor (restore)   │
        │     → POST /api/revoke "grant"     │
        │     → GET /api/vendor (re-sync)    │
        └─────────────────────────────────────┘
```

---

## Design System

| Token | Value | Penggunaan |
|-------|-------|------------|
| `--color-gold` | `#C8A45D` | Primary accent, CTA buttons, border highlights |
| `--color-bone` | `#EDE8DF` | Body text utama |
| `--color-stone` | `#8A8278` | Secondary/muted text |
| `--color-oxblood` | `#4A1015` | Card backgrounds, panel fills |
| `--color-obsidian` | `#050505` | Main page background |
| `--color-verified` | `#4CAF82` | Success states, compliance clear |
| `--font-serif` | Cormorant Garamond | Headings (`h1`–`h3`) |
| `--font-sans` | Inter | Body text, paragraphs |
| `--font-mono` | System monospace | Labels, DIDs, hashes, badges |

**Prinsip desain:**
- Zero emoji/emoticons dalam konten sistem
- Zero gradien warna yang mencolok
- Tipografi serif premium untuk judul, monospace untuk semua data kriptografis
- Semua elemen interaktif memiliki transisi `transition-colors` 150ms

---

## Cara Menjalankan

### Prerequisites
- Node.js `v18+`
- `pnpm` `v8+`

### 1. Install dependencies
```bash
pnpm install
```

### 2. Konfigurasi environment (opsional — untuk koneksi T3N testnet nyata)
```bash
# .env.local
T3N_PRIVATE_KEY=0x...     # Private key Ethereum untuk autentikasi ke T3N testnet
```
Jika tidak dikonfigurasi, sistem otomatis menggunakan simulator high-fidelity yang identik secara perilaku.

### 3. Jalankan development server
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.

| URL | Halaman |
|-----|---------|
| `/` | Landing page marketing |
| `/portal` | Dashboard utama (Vendor + Buyer Agent) |
| `/portal/sandbox` | Utility sandbox (SSO, Escrow, DeFi) |

### 4. Quick Test Flow
1. Buka `/portal`
2. Di panel **Vendor Management Portal** → klik **"⚡ Daftar Sekarang"** (1-klik)
3. Di panel **Buyer Compliance Dashboard** → klik **"Use Registered Vendor DID"** → klik **"Verify Vendor"**
4. Amati 6 langkah TEE berjalan di **Intel TDX Enclave Live Simulation**
5. Setelah selesai → klik **"Inspect Raw VC"** untuk melihat W3C JSON-LD payload
6. Klik baris di **Cryptographic Audit Trail** untuk detail block
7. Buka `/portal/sandbox` → test skenario SSO, Escrow Payout, DeFi Lending

### 5. Lint & format
```bash
pnpm biome check src
pnpm format
```

### 6. Build production
```bash
pnpm build
```

---

## Halaman & Routes

| Route | Type | Keterangan |
|-------|------|------------|
| `/` | Static | Landing page marketing |
| `/portal` | Static (client-rendered) | Dashboard Vendor + Buyer Agent |
| `/portal/sandbox` | Static (client-rendered) | Integration Utility Sandbox |
| `/api/vendor` | Dynamic (serverless) | Vendor state CRUD |
| `/api/onboard` | Dynamic (serverless) | SSE compliance pipeline |
| `/api/revoke` | Dynamic (serverless) | Access control |
| `/api/ledger` | Dynamic (serverless) | Audit ledger read |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Linter | Biome 2 |
| UI Icons | Lucide React |
| Fonts | Google Fonts (Cormorant Garamond, Inter) |
| Streaming | Web Streams API (SSE via `ReadableStream`) |
| State | React `useState` + `localStorage` sync |
| Identity SDK | `@terminal3/t3n-sdk` ^3.5.0 (WASM-based) |
| Runtime | Node.js 18+ / Vercel Edge-compatible |

---

*Built for the Terminal 3 Agent Dev Kit Bounty Challenge.*  
*"Access does not equal transfer."*
