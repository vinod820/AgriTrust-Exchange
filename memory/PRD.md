# AgriTrust Exchange - PRD

## Project Overview
AgriTrust Exchange is a hackathon-ready monorepo for an agriculture marketplace with:
- Farmer, buyer, consumer, and admin role dashboards
- Blockchain traceability, escrow, and dispute smart contracts
- AI crop analysis service with FastAPI
- WebRTC video verification with a signaling server
- Voice-first farmer actions powered by speech recognition
- Fraud flagging, QR-style trace pages, and off-chain listing APIs

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend/AI Service**: FastAPI (Python)
- **Signaling**: Socket.IO (Node.js)
- **Contracts**: Hardhat (Solidity)
- **Database**: Prisma with SQLite (configurable)

## Architecture
```
/app/
├── apps/web/           # Next.js frontend (port 3000)
├── services/ai/        # FastAPI AI service (port 8001)
├── services/signaling/ # Socket.IO signaling server (port 4001)
├── contracts/          # Hardhat smart contracts
├── prisma/             # Database schema
└── backend/            # Adapter for platform integration
```

## What's Been Implemented (Jan 2026)
- [x] Connected GitHub repo to Emergent platform
- [x] Fixed syntax error in next.config.mjs
- [x] Set up platform integration (backend/frontend adapters)
- [x] All dependencies installed (npm, pip)
- [x] Environment configuration (.env files)
- [x] Frontend running (Next.js on port 3000)
- [x] Backend AI service running (FastAPI on port 8001)
- [x] Signaling server running (Socket.IO on port 4001)

## Core Features (Pre-built in repo)
1. **Role-based Login Portal** - Choose Farmer/Buyer/Admin/Consumer
2. **Farmer Dashboard** - Overview, Sell Crop, Voice commands, Inventory, Wallet
3. **Buyer Marketplace** - Browse, compare, video verify, escrow checkout
4. **Admin Panel** - Fraud alerts, escrow oversight, trust visibility
5. **Consumer Trace** - QR verification, source proof

## Environment Variables
- `NEXT_PUBLIC_SIGNALING_URL`: http://localhost:4001
- `AI_SERVICE_URL`: http://localhost:8001
- Blockchain contract addresses: Placeholder (0x000...)

## Next Tasks / Backlog
- P1: Deploy smart contracts to testnet
- P1: Wire Prisma database
- P2: Integrate real AI model for crop analysis
- P2: Configure blockchain RPC/wallet

## Notes
- Demo mode uses in-memory sample data
- AI service uses deterministic demo predictor
- Farmer dashboard uses browser Web Speech API
