# AgriTrust Exchange

Hackathon-ready monorepo for an agriculture marketplace with:

- farmer, buyer, consumer, and admin role dashboards
- blockchain traceability, escrow, and dispute smart contracts
- AI crop analysis service with FastAPI
- WebRTC video verification with a signaling server
- voice-first farmer actions powered by speech recognition
- fraud flagging, QR-style trace pages, and off-chain listing APIs

## Structure

- `apps/web`: Next.js App Router UI and API routes
- `contracts`: Hardhat contracts and deploy script
- `services/ai`: FastAPI analysis service
- `services/signaling`: Socket.IO signaling server
- `prisma`: off-chain schema for persistence upgrade

## Quick Start

1. Install workspace dependencies:
   - `npm install`
   - `python -m pip install -r services/ai/requirements.txt`
2. Copy `.env.example` to `.env.local` for the web app and `.env` for contracts.
3. Start the web app with `npm run dev:web`.
4. Start AI service with `npm run dev:ai`.
5. Start signaling service with `npm run dev:signaling`.
6. Start local contracts with `npm run dev:contracts`.

## Notes

- The web app ships with in-memory sample data so the demo works before Prisma is wired.
- The AI service uses a deterministic demo predictor until you swap in a trained model.
- The farmer dashboard uses the browser Web Speech API for voice capture.
- The contract addresses in `.env.example` are placeholders.
