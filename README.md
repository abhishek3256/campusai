# Campus AI - Intelligent Placement Management System

## Overview
Campus AI is a full-stack MERN placement management system featuring 10+ AI-powered capabilities using Groq's Llama-3.3-70b model. It connects students, companies, and administrators with intelligent resume parsing, job matching, and document verification.

## Features
- **AI Resume Parsing**: Automatically extracts skills and experience.
- **AI Job Matching**: Calculates match scores between students and jobs.
- **Generative AI**: Auto-generates cover letters, offer letters, and job descriptions.
- **Document Verification**: AI-assisted verification of marksheets.
- **Role-Based Dashboards**: tailored views for Students, Companies, and Admins.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React (Vite), Tailwind CSS
- **AI**: Groq SDK (Llama-3.3-70b-versatile)
- **Storage**: Cloudinary
- **Auth**: JWT with HTTP-only cookies support (implemented as Bearer token for simplicity in API).

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas URI)
- Cloudinary Account
- Groq API Key

### Backend Setup
1. Navigate to backend: `cd backend`
2. Install dependencies: `npm install`
3. Configure `.env`:
   - Copy the template and fill in your keys.
   - Set `GROQ_API_KEY`, `MONGO_URI`, `CLOUDINARY_*`.
4. Run Seed Data (Optional): `node data/seedData.js`
5. Start Server: `npm run dev` (or `node server.js`)

### Frontend Setup
1. Navigate to frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Start Dev Server: `npm run dev`

## Default Credentials (from Seed Data)
- **Admin**: admin@test.com / password123
- **Company**: company@test.com / password123
- **Student**: s   / password123

## AI Features Usage
- **Resume Parsing**: Upload a PDF in the Student Dashboard > Upload Resume.
- **Job Description**: Go to Company Dashboard > Post Job > Click "Auto-Generate with AI".
- **Cover Letter**: (API Endpoint available, UI integration pending specific flow).

## Deployment
- **Backend**: Deploy to Render/Railway. Set env vars in dashboard.
- **Frontend**: Deploy to Vercel/Netlify. Set `VITE_API_URL` to your backend URL.
