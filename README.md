# Notice Decoder

Notice Decoder is a university notice intelligence dashboard that helps students turn messy academic notices, circulars, and timetable announcements into a clean, structured plan. It highlights possible conflicts, deadlines, and schedule risks before they affect your academic routine.

## Overview

This app reads fragmented notice content, organizes it into actionable events, and gives users a clear overview of:

- lectures and exams
- assignment and lab deadlines
- schedule conflicts
- notice updates and urgency
- exportable calendar plans

It is designed for fast decision-making in academic environments where new notices are often scattered, inconsistent, and hard to track manually.

## Key Features

- AI-assisted parsing of academic notice text
- Structured event extraction for tests, lectures, and deadlines
- Conflict detection across overlapping academic activities
- Dashboard for monitoring priority notices and high-risk schedules
- Calendar export in RFC 5545 iCalendar format
- Demo dataset for exploring the app immediately
- Server-side Featherless API integration keeps your API key out of the browser
- Extracted AI results are marked for review before they are saved

## Tech Stack

- React + TypeScript
- Vite
- Express
- Featherless API (OpenAI-compatible chat completions)
- Tailwind CSS
- Lucide icons

## Project Structure

```bash
.
├── src/
│   ├── components/
│   ├── context/
│   ├── types/
│   ├── utils/
│   │   └── aiAnalysis.ts
│   ├── App.tsx
│   └── main.tsx
├── server.ts
├── render.yaml
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── dist/   # generated after build
```

## Prerequisites

- Node.js 20.19 or newer
- npm
- Featherless API key

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   On macOS/Linux:

   ```bash
   cp .env.example .env.local
   ```

   On Windows (Command Prompt):

   ```bash
   copy .env.example .env.local
   ```

3. Add your Featherless API key and a model ID in `.env.local`:

   ```env
   FEATHERLESS_API_KEY="your_api_key_here"
   FEATHERLESS_MODEL="Qwen/Qwen2.5-7B-Instruct"
   ```

   Get an API key and choose a model available to your Featherless account. Change `FEATHERLESS_MODEL` to that model's exact ID if needed.

4. Start the app and API server:

   ```bash
   npm run dev
   ```

5. Open the app in your browser:

   ```text
   http://localhost:3000
   ```

## Environment Variables

The server reads these environment variables from `.env.local`:

- `FEATHERLESS_API_KEY`: required to call the Featherless chat completions API. It stays server-side and must not be renamed to a `VITE_` variable.
- `FEATHERLESS_MODEL`: model ID enabled for your Featherless account. Defaults to `Qwen/Qwen2.5-7B-Instruct`.
- `HOST`: server bind address. Defaults to `127.0.0.1` for local development; set it to `0.0.0.0` when your hosting platform requires it.
- `PORT`: server port. Defaults to `3000`.

Example:

```env
FEATHERLESS_API_KEY="your_api_key_here"
FEATHERLESS_MODEL="Qwen/Qwen2.5-7B-Instruct"
```

## Available Scripts

```bash
npm run dev      # Start the app and Featherless API server
npm run build    # Create production build
npm start        # Serve the production build
npm run preview  # Alias for npm start
npm run lint     # Run TypeScript checking
```

## Deploy on Render

This repository includes a Render Blueprint in `render.yaml`.

1. Push the project to GitHub.
2. In Render, choose **New + → Blueprint** and select this repository.
3. Set the required `FEATHERLESS_API_KEY` in the Render environment prompt. Keep it secret; do not add it to GitHub.
4. Deploy the Blueprint. Render builds the frontend and starts the Express server.

The Blueprint sets `FEATHERLESS_MODEL` to `Qwen/Qwen2.5-7B-Instruct`; update it in Render to another exact model ID enabled for your Featherless account if needed. Render supplies the `PORT` environment variable, and the server binds to `0.0.0.0`. If analysis reports HTTP 401 or 403, verify the API key and model access in the Featherless dashboard, then save the Render environment variables and redeploy.

## Notes

- The project includes a built-in sample dataset so the interface can be explored immediately.
- Calendar export follows the RFC 5545 iCalendar standard.
- Notice analysis sends the pasted notice text to Featherless AI. Do not submit private or sensitive information.
- Every AI-extracted event should be reviewed against the original notice before saving.
- The app is intended for educational/demo purposes and can be extended for a real campus scheduler workflow.
