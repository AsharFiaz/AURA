# AURA — Augmented Universe of Reflective Archives

A social platform for emotional storytelling. Users post "memories" (text, image, or video), which are analyzed for **Big Five (OCEAN) personality traits** by an AI service. Those traits power a personalized feed, a 3D memory-galaxy visualization, and a blockchain NFT marketplace where memories can be minted, listed, and traded.

> **Status:** Fully implemented (100%) — all core modules are complete and integrated.

---

## Architecture

AURA is made of **four services** that run together:

| Service | Stack | Default Port | Role |
|---|---|---|---|
| **Frontend** | React 19 + Tailwind | `3000` | UI, wallet, 3D orb field |
| **Backend** | Node.js + Express 5 + MongoDB | `5001` | Auth, memories, feed, interactions |
| **AI service** | Python + FastAPI + Gemini | `8000` | OCEAN analysis + recommendations |
| **Blockchain** | Hardhat + Solidity (ERC-721) | `8545` | Local chain + smart contract |

**Data flow:** a new memory → backend → AI service (`/analyze`) → Gemini infers an OCEAN vector → vector is stored in **Qdrant** and written back onto the Memory document. The feed and marketplace then query `/recommend` to rank memories against the viewer's personality. A user's own OCEAN vector drifts over time based on their interactions (handled by a logout flush and a daily cron job).

---

## Features

- **Authentication** — email/password (JWT) + Google OAuth, plus a separate admin login.
- **User profiling** — onboarding personality quiz; dynamic OCEAN vector that updates from engagement over time.
- **Memories** — create with text/image/video, like, comment, and follow users; Cloudinary media storage.
- **AI emotion & personality recognition** — Gemini-based OCEAN inference across text, image, and video, stored in a Qdrant vector database.
- **Personalized recommendations** — vector-similarity ranking that powers both the home feed and the marketplace.
- **NFT minting & blockchain** — ERC-721 contract (`AuraMemoryNFT`) with mint, list, cancel, and buy; MetaMask wallet integration via ethers v6.
- **3D memory visualization** — interactive Three.js "orb field" where each memory is an orb colored and shaped by its dominant personality trait.
- **Admin dashboard** — user, memory, NFT, and likes analytics.

---

## Tech Stack

**Frontend:** React 19, React Router 7, Tailwind CSS, Axios, ethers v6, Three.js, framer-motion, recharts, react-hot-toast, lucide-react

**Backend:** Node.js, Express 5, MongoDB + Mongoose, JWT, bcryptjs, Multer, Cloudinary, Passport (Google OAuth20), express-session, node-cron, axios

**AI Service:** Python, FastAPI, Uvicorn, Google Gemini (`google-genai`), Qdrant (vector DB), Cloudinary, Pillow, NumPy, httpx

**Blockchain:** Solidity 0.8.20, Hardhat, OpenZeppelin (ERC-721), ethers, Polygon Amoy/Mumbai (testnet) / Hardhat local

---

## Project Structure

```
AURA/
├── Ai/                         # FastAPI personality-analysis service
│   ├── main.py                 # /analyze, /recommend, /count, /health endpoints
│   ├── analyzer.py             # Gemini OCEAN prompt + inference
│   ├── vector_db.py            # store vectors in Qdrant
│   ├── vector_db_recommend.py  # recommendation query
│   ├── savefile.py             # Cloudinary upload helpers
│   └── requirements.txt
│
├── backend/                    # Node + Express API
│   ├── config/                 # db, cloudinary, passport
│   ├── middleware/             # auth, adminAuth, upload
│   ├── models/                 # User, Memory, Interaction, VectorHistory
│   ├── routes/                 # auth, nft, interactions, follow, ...
│   ├── services/               # aiService, vectorUpdate
│   ├── scripts/                # backfillVectorHistory, etc.
│   └── server.js
│
├── blockchain/                 # Hardhat project
│   ├── contracts/AuraMemoryNFT.sol
│   ├── scripts/                # deploy.js, test-local.js
│   ├── artifacts/              # compiled output
│   └── hardhat.config.js
│
├── frontend/                   # React app
│   ├── src/
│   │   ├── components/         # common/, marketplace/, orbfield/ (3D)
│   │   ├── context/            # AuthContext, WalletContext
│   │   ├── hooks/              # useNFTMint, useMarketplace, useInteractionTracking
│   │   ├── pages/              # Login, Home, Marketplace, Profile, admin/, ...
│   │   ├── config/blockchain.js
│   │   └── App.js
│   └── package.json
│
└── README.md
```

---

## Environment Setup

Each service needs its own `.env` file. Create them before running.

**`backend/.env`**
```
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
INTERNAL_SECRET=aura_internal_secret
```

**`Ai/.env`**
```
GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_BACKEND_URL=http://localhost:5001
INTERNAL_SECRET=aura_internal_secret
```

**`frontend/.env`**
```
REACT_APP_API_URL=http://localhost:5001/api
```

**`blockchain/.env`** (only needed for public testnet deploys)
```
PRIVATE_KEY=your_wallet_private_key
```

> **Note:** the backend must run on port **5001** (set `PORT=5001`), because the frontend and AI service both point to `5001`.

---

## How to Run

Run each service in its own terminal, from the project root.

### Terminal 1 — AI service
```bash
cd Ai
python -m venv .venv          # first time only
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Verify: `http://localhost:8000/health` → `{"status":"ok"}`

### Terminal 2 — Backend
```bash
cd backend
npm install        # or: pnpm install
node server.js     # or: npm run dev
```
Verify: `http://localhost:5001/api/test` → `{"message":"AURA Backend is running"}`

### Terminal 3 — Frontend
```bash
cd frontend
npm install
npm start
```
Opens at `http://localhost:3000`.

---

## Blockchain (Local) Setup

The smart contract runs on a local Hardhat node during development.

### Terminal 4 — Hardhat node
```bash
cd blockchain
npm install
npx hardhat node
```

### Terminal 5 — Deploy the contract
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

After deploying:
1. Copy the printed contract address into `frontend/src/config/blockchain.js` → `CONTRACT_ADDRESS` (if it changed).
2. In MetaMask: **Settings → Advanced → Reset Account** to clear stale transaction history.

---

## Team

- Jazib Waqar (CIIT/FA22-BCS-035/ISB)
- Ashar Fiaz (CIIT/FA22-BCS-018/ISB)
- Mohammad Fawad (CIIT/FA22-BCS-046/ISB)

## Supervisors

- Mr. Inayat-Ur Rehman
- Mr. Muhammad Rashid Mukhtar

## Institution

COMSATS University Islamabad
Bachelor of Science in Computer Science (2022–2026)
