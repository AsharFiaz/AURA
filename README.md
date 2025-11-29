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