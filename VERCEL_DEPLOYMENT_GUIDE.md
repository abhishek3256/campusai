# CampusAI: Step-by-Step Vercel Deployment Guide

Deploying a monolithic repository (Frontend + Backend in one folder) to Vercel requires specific configuration, which has already been handled in `vercel.json` and `backend/server.js`. Follow these steps to ensure a flawless deployment.

## Prerequisites

1. Create a GitHub account and push this entire repository to a new remote GitHub repository (Private or Public).
2. Create an account at [Vercel](https://vercel.com/) and connect it to your GitHub account.
3. Make sure you have your MongoDB URI (`MONGO_URI`), JWT Secrets, and Cloudinary keys ready.

## Deployment Steps on Vercel

1. **Import the Repository:**
   - In your Vercel Dashboard, click **Add New** > **Project**.
   - Select your GitHub repository containing the CampusAI project and click **Import**.

2. **Project Configuration (CRITICAL STEP):**
   - **Framework Preset:** Leave this as **Other**. Do **NOT** select Vite or Create React App, because our custom `vercel.json` at the root handles the build process for both Frontend and Backend simultaneously.
   - **Root Directory:** Leave this blank (`./`). Do **NOT** select `frontend/` or `backend/`. The `vercel.json` file in the root directory manages routing automatically.
   - **Build and Output Settings:** Leave default. Our `vercel.json` overrides them natively.

3. **Set Environment Variables:**
   Expand the "Environment Variables" section before clicking Deploy. Add ALL your variables from `.env`. Because this is a shared environment, add variables for both the frontend (e.g., `VITE_API_URL`) and the backend (e.g., `MONGO_URI`, `JWT_SECRET`).
   
   > **Note on `VITE_API_URL`:** During local development, this points to `http://localhost:5000/api`. On Vercel, the backend will be available at the same domain as the frontend via `/api`. So you MUST add:
   > - `VITE_API_URL` = `/api`
   
   Add your other backend variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - Any API keys (e.g., `GROQ_API_KEY`)

4. **Deploy:**
   - Click the **Deploy** button.
   - Vercel will install dependencies for both the frontend (`@vercel/vite` builder) and backend (`@vercel/node` builder).
   - Once it's complete, your frontend application will show on screen.

## How Your Vercel Setup Works (Under the Hood)
Normally, Vercel deployments fail for full-stack apps because they attempt to boot standard Express servers using `app.listen`, which causes timeouts on serverless infrastructure. I have already applied the following fixes to prevent this:

1. **`vercel.json` Routing:** Routes all requests prefixed with `/api/*` directly to `backend/server.js`, and everything else to the built React pages in `frontend/`.
2. **`module.exports = app;` in `server.js`:** Instead of `app.listen()` keeping a local port open forever, the Express app instance is exported for Vercel's Edge Serverless Network. Vercel automatically creates instances of your server whenever API calls arrive and shuts them down when unused.
3. **`.vercelignore` & `.gitignore`:** Configured specifically to ignore bulky `node_modules` folders to prevent build timeout failures, keeping upload sizes optimized.
4. **Cloudinary Asset Storage:** Serverless backends are read-only (saving files using `fs` or `multer` locally will fail). Fortunately, your backend uses `multer-storage-cloudinary`, keeping it 100% serverless-safe.
