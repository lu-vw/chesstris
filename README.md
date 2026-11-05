# Chesstris

Vercel-ready turn-based online Tetris port inspired by the uploaded MisaMino/Tetrio-era C++ project.

## Included
- Next.js + TypeScript browser implementation
- Online room codes
- Player 1 then Player 2 turn order
- Separate 10x20 boards
- 7-bag generation
- SRS-style rotation kicks
- Line clears + garbage attacks
- Tetrio-style DAS / ARR / SDF settings
- Server-side room state using Upstash Redis
- Vercel deployment configuration

## Deploy

1. Create an Upstash Redis database.
2. Copy `.env.example` to `.env.local` for local testing.
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
4. `npm install`
5. `npm run dev`
6. Push to GitHub and import the repository into Vercel.
7. Add the same two environment variables in Vercel and deploy.

The original source is native C++/Windows code, so it cannot be directly deployed to Vercel. This is a browser/TypeScript port of the playable Tetris mechanics rather than a wrapper around the original executable.
