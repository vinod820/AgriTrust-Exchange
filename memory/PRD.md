# KrishiVoice Chain - Product Requirements Document

## Project Overview
**KrishiVoice Chain** is an international hackathon-level agriculture marketplace platform that combines:
- Voice-first interactions (speak to control the website)
- AI-powered crop quality analysis
- Blockchain-backed traceability and trust
- Smart escrow payment system

## Problem Statement
Transform a basic agriculture marketplace into a professional, startup-level platform with:
- 4 role-based portals (Farmer, Buyer, Admin, Consumer)
- Voice-enabled website control for farmers
- Modern, visually stunning UI/UX
- Complete trust ecosystem with fraud detection

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Framer Motion, Tailwind concepts in CSS
- **Backend**: FastAPI (Python) for AI services
- **Blockchain**: Smart contracts (Solidity), Polygon network
- **Signaling**: Socket.IO for video calls
- **Database**: Prisma with SQLite (demo mode)

## Architecture
```
/app/
├── apps/web/              # Next.js frontend (port 3000)
│   ├── app/              # App router pages
│   │   ├── page.tsx      # Landing with role selection
│   │   ├── farmer/       # Farmer dashboard
│   │   ├── buyer/        # Buyer marketplace
│   │   ├── admin/        # Admin control center
│   │   └── consumer/     # Consumer verification
│   ├── components/       # Reusable components
│   └── globals.css       # Design system (CSS variables)
├── services/ai/          # FastAPI AI service (port 8001)
├── services/signaling/   # Socket.IO server (port 4001)
└── contracts/            # Hardhat smart contracts
```

## What's Been Implemented (Jan 2026)

### UI/UX Redesign (Complete)
- [x] Custom design system with CSS variables
- [x] Typography: Outfit (headings), Manrope (body), JetBrains Mono (code)
- [x] Color palette: Forest green (#2D5A3F), Lime accent (#CCFF00), Earth tones
- [x] Component library: cards, buttons, badges, metrics, timelines
- [x] Responsive layout system
- [x] Micro-animations with Framer Motion

### Landing Page
- [x] Hero section with stats (10K+ Farmers, 98% Trust, 50K+ Transactions)
- [x] Interactive role selection cards
- [x] Feature highlights section
- [x] CTA section with dark theme

### Farmer Portal
- [x] Dashboard with stats (listings, quantity, earnings, trust score)
- [x] Tab navigation (Overview, Sell Crop, Voice, Inventory, Wallet)
- [x] Voice command interface with Web Speech API
- [x] Crop registration form with AI price suggestions
- [x] MetaMask wallet connection

### Buyer Marketplace
- [x] Smart search and filter system
- [x] Grid/List view toggle
- [x] Product cards with quality grades and trust scores
- [x] Video verification buttons

### Admin Control Center
- [x] Fraud alerts dashboard with severity levels
- [x] Transaction monitoring
- [x] Trust leaderboard
- [x] Stats overview (trust score, alerts, transactions, volume)

### Consumer Portal
- [x] Batch ID verification
- [x] QR code generation
- [x] Supply chain timeline visualization
- [x] Trust meter component

### Voice Control System
- [x] Voice FAB on all dashboard pages
- [x] Speech-to-text with Web Speech API
- [x] Command processing with navigation
- [x] Text-to-speech responses
- [x] Supported commands: hello, go to buyer, sell crop, check price, etc.

## Core Features (Demo Mode)
| Feature | Status | Notes |
|---------|--------|-------|
| Voice Commands | Working | Browser Web Speech API |
| Role Navigation | Working | Client-side routing |
| Product Listings | Working | Mock data from mock-db |
| AI Price Suggestions | Demo | Static price ranges |
| Wallet Connection | Working | MetaMask integration |
| QR Verification | Working | Demo batch data |
| Fraud Alerts | Demo | Static mock alerts |

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Connect real AI model for crop quality analysis
- [ ] Deploy smart contracts to Polygon testnet
- [ ] Wire up Prisma database for persistence

### P1 - High Priority
- [ ] Real-time video verification with WebRTC
- [ ] Multi-language voice support (Hindi, Kannada)
- [ ] Payment integration with escrow contract

### P2 - Medium Priority
- [ ] Nearby farmers map with real-time availability
- [ ] Mobile responsive optimization
- [ ] Push notifications for transactions

### P3 - Future
- [ ] Mobile app (React Native)
- [ ] Advanced fraud detection ML model
- [ ] Multi-chain support

## User Personas

### Farmer (Primary)
- Uses voice commands to register crops
- Needs simple, accessible interface
- Values fair pricing and trust verification

### Buyer (Primary)
- Searches for quality produce
- Needs video verification before purchase
- Values secure escrow payments

### Admin (Secondary)
- Monitors marketplace health
- Investigates fraud alerts
- Manages trust scores

### Consumer (Secondary)
- Verifies product authenticity
- Scans QR codes at retail
- Values transparency

## API Endpoints (Backend)
- `GET /health` - Service health check
- `POST /predict` - AI crop analysis (demo mode)

## Environment Variables
```
NEXT_PUBLIC_APP_NAME=KrishiVoice Chain
NEXT_PUBLIC_SIGNALING_URL=http://localhost:4001
DATABASE_URL=file:./prisma/dev.db
```

## Testing Status
- Frontend tests: 90% pass
- Voice control: Working in Chrome
- Role selection: Fixed and working
- Navigation: All routes working

## Notes for Next Session
- Consumer timeline needs slight animation delay fix
- Consider adding loading states for production
- Backend AI service could use real model integration
