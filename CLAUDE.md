# CLAUDE.md

This file provides guidance and reference when working with code in this repository.

## Project Overview

Hopta Backend is an Express + TypeScript REST API and WebSocket server for the Hopta real estate marketplace platform in Honduras.

## Infrastructure & VPS Deployment

- **VPS Server**: `ssh root@178.104.69.183`
- **Database**: MongoDB Atlas
- **Storage**: AWS S3 (`hopta-bucket` in `us-east-2`)
- **Web Server / Reverse Proxy**: Nginx + Docker

## Key Commands

- `npm run dev` — Start dev server with nodemon and ts-node
- `npm run build` — Build project (`tsc` + `tsc-alias`)
- `npm start` — Run compiled server from `dist/`
- `npm run migrate:s3` — Migrate S3 URLs in MongoDB to regional domain (`us-east-2`)
- `npm run prettier` — Format code with Prettier

## Architecture

- `src/index.ts` — Main server entrypoint (Express, CORS, Passport, HTTP & Socket.IO server)
- `src/routes/` — Route handlers grouped by domain (auth, real-state, user, aws, payments, messages, etc.)
- `src/schemas/` — Mongoose schemas and models
- `src/services/` — Business logic and third-party integrations (S3, Socket, Mailer, AI, Logs)
- `src/middlewares/` — Express middlewares (authentication, decode user token, rate limit, last seen)
- `connection/` — Database connection handling
- `constants/` — Environment and security constants (CORS, AWS, rate limiters)
