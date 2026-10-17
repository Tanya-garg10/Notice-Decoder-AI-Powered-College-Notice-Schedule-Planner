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
- Local-first browser experience with no complex backend setup required

## Tech Stack

- React + TypeScript
- Vite
- Gemini API
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
│   ├── App.tsx
│   └── main.tsx
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

- Node.js 18 or newer
- npm
- Gemini API key

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

3. Add your Gemini API key in `.env.local`:

   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the app in your browser:

   ```text
   http://localhost:3000
   ```

## Environment Variables

The app expects the following environment variable:

- `GEMINI_API_KEY`: required for Gemini AI-powered notice parsing and analysis.

Example:

```env
GEMINI_API_KEY="AIza..."
```

## Available Scripts

```bash
npm run dev      # Start the Vite development server
npm run build    # Create production build
npm run preview  # Preview the production build locally
npm run lint     # Run TypeScript checking
```

## Notes

- The project includes a built-in sample dataset so the interface can be explored immediately.
- Calendar export follows the RFC 5545 iCalendar standard.
- AI-enabled features depend on the `GEMINI_API_KEY` environment variable.
- The app is intended for educational/demo purposes and can be extended for a real campus scheduler workflow.
