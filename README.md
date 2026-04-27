# AURA - Augmented Universe of Reflective Archives

Social platform for emotional storytelling with user authentication and profiling.

##  Current Implementation (30%)

###Completed Features
- User Authentication (Login/Signup)
- User Profiling (Interests & Emotions)
- Frontend UI (React.js)
- Backend API (Node.js + Express)
- MongoDB Database Integration
- Marketplace

### Future Features
- AI Emotion Recognition
- NFT Minting & Blockchain
- 3D Memory Visualization
- Marketplace

##  Tech Stack

**Frontend:**
- React.js
- React Router
- Axios

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt

##  Project Structure
```
AURA/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── StoryCircle.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── NFTCard.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Login.jsx          
│   │   │   ├── Signup.jsx         
│   │   │   ├── Home.jsx           
│   │   │   ├── Marketplace.jsx    
│   │   │   ├── CreateMemory.jsx   
│   │   │   └── Profile.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Memory.js (posts/memories)
│   │   └── NFT.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── memories.js
│   │   └── marketplace.js
│   ├── middleware/
│   │   └── auth.js
│   ├── config/
│   │   └── db.js
│   └── server.js
│
└── docs/
    └── SRS.md
```

How to Run the Project
Step 1 — Activate the virtual environment (always do this first, every time):
bashcd /Users/asharfiaz/Desktop/AURA
source .venv/bin/activate
# you should see (.venv) at the start of your terminal prompt
Step 2 — Open 3 terminal tabs/windows and activate the venv in each one:
bash# in each new terminal tab run:
cd /Users/asharfiaz/Desktop/AURA
source .venv/bin/activate
Step 3 — Terminal 1: Start the AI service
bashcd /Users/asharfiaz/Desktop/AURA/Ai
uvicorn main:app --reload --port 8000
Verify it's running: http://localhost:8000/health should return {"status":"ok"}
Step 4 — Terminal 2: Start the Node.js backend
bashcd /Users/asharfiaz/Desktop/AURA/backend
node server.js
Verify it's running: http://localhost:5001/api/test should return {"message":"AURA Backend is running"}
Step 5 — Terminal 3: Start the React frontend
bashcd /Users/asharfiaz/Desktop/AURA/frontend
npm start
App opens automatically at http://localhost:3000
And make sure when you start that session to:

# 1. Drop the script above into backend/scripts/clearNFTs.js

# 2. Run it
cd backend
node scripts/clearNFTs.js

# 3. Restart Hardhat (in your hardhat terminal: Ctrl+C, then)
cd blockchain
npx hardhat node

# 4. Redeploy in another terminal
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
# Confirm address still matches frontend/src/config/blockchain.js

##  Team

- Jazib Waqar (CIIT/FA22-BCS-035/ISB)
- Ashar Fiaz (CIIT/FA22-BCS-018/ISB)
- Mohammad Fawad (CIIT/FA22-BCS-046/ISB)

##  Supervisors

- Mr. Inayat-Ur Rehman
- Mr. Muhammad Rashid Mukhtar

##  Institution

COMSATS University Islamabad
Bachelor of Science in Computer Science (2022-2026)