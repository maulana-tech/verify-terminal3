# V-VERIFY (VendorVerify Agent)
### Terminal 3 Agent Dev Kit Bounty Challenge (Beta)

> **"You found us. This is an easter egg beta launch of our Terminal 3 Agent Dev Kit Bounty challenge. Quick challenge. Compete with lesser builders. Real bounty prizes."**

---

V-VERIFY is a decentralized, TEE-enclave-mediated trust broker that automates secure B2B compliance checks between **Buyer Agents** and **Vendor Agents** using the **Terminal 3 Agent Auth SDK**. It showcases a premium, high-fidelity developer experience inspired by professional design language.

## 🚀 Key Features

- **Double-Agent Protocol:** Simulates secure authentication handshake, DID resolution, sanctions screening, and verifiable credential (VC) issuance.
- **Intel TDX Enclave Decryption:** Implements simulated hardware enclave executions where raw data remains encrypted in storage and only decrypted inside secure enclaves.
- **Zero-Knowledge Redaction:** Generates W3C Smart Verifiable Credentials (SVCs) that prove compliance while fully redacting sensitive Tax IDs, owner passports, and banking details.
- **Granular Consent Controls:** Allows vendors to delegate data access to specific buyers, with instantaneous revocation.
- **Audit Trails:** Commits all onboarding and revoking checks onto an immutable cryptographic ledger (T3N Ledger).
- **Premium UI/UX:** Built with luxury serif typography (`Cormorant Garamond`), sleek obsidian backgrounds (`#050505`), custom gold accents (`#C8A45D`), and drift background glow animations.
- **Strict Styling Rules:** Zero emojis/emotes, zero loud color gradients, and zero generic AI robot illustrations.

---

## 🛠️ Architecture

```
web/
├── package.json
├── biome.json
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Font loading, layouts, and global styling
│   │   ├── page.tsx           # Premium V-Verify Marketing Landing Page (/)
│   │   ├── portal/
│   │   │   └── page.tsx       # Interactive Agent Simulator Portal (/portal)
│   │   └── api/               # T3N Simulator Backend SSE Endpoints
│   │       ├── onboard/
│   │       ├── vendor/
│   │       ├── ledger/
│   │       └── revoke/
│   ├── components/            # Portal and Marketing subcomponents
│   │   ├── VendorDashboard.tsx
│   │   ├── BuyerDashboard.tsx
│   │   ├── SimulationPanel.tsx
│   │   ├── AuditLedger.tsx
│   │   └── marketing/         # FHOX-style premium landing sections
│   └── lib/
│       ├── t3n-client.ts      # Enclave client with high-fidelity fallback simulator
│       └── types.ts
```

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- `pnpm` (v8+)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Website Landing Page:** [http://localhost:3000/](http://localhost:3000/)
- **Compliance Portal:** [http://localhost:3000/portal](http://localhost:3000/portal)

### 3. Lint & Format Code
Verify styling compliance using Biome:
```bash
pnpm biome check src
```

### 4. Build for Production
Verify that compilation succeeds without errors:
```bash
pnpm build
```

---

## ⛓️ Terminal 3 SDK & Enclave Simulation

The backend uses `t3n-client.ts` to interface with the `@terminal3/t3n-sdk` (using `T3nClient`). If credentials are not supplied in the environment, it falls back to a high-fidelity cryptographic simulator that runs:
1. **ML-KEM** Key Exchange Handshake.
2. **Intel TDX** secure enclave mount.
3. Decryption of vendor data inside the enclave.
4. Secure endpoint query to a whitelisted sanctions API.
5. On-chain commit of the W3C Verifiable Credential.

---

## 🔒 Proof of T3N Node Authentication & Integration

V-VERIFY is verified to connect, perform handshakes, and authenticate using the `@terminal3/t3n-sdk` WASM client against the public **Terminal 3 Testnet Node**.

### Successful Testnet Handshake Log:
```bash
Setting environment to testnet...
Loading WASM component...
WASM loaded successfully.
Derived Address: 0x9f37d905cffd253d5261096662a5bb7b9e0e2cef
Initializing client...
Performing handshake...
Handshake successful!
Authenticating...
Authenticated successfully. DID: did:t3n:02153a2434e7972d33573f024aedfc530c76a3a3
```

This derived decentralized identifier (**`did:t3n:02153a2434e7972d33573f024aedfc530c76a3a3`**) represents the authenticated identity of the Buyer Agent on the Terminal 3 Network, registered securely through the private keys configured in our backend `.env.local` service.
