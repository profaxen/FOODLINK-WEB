# FoodLink

FoodLink is a mobile‑first web app that connects food donors (restaurants, homes, events) with receivers (NGOs, shelters, individuals) to reduce food waste and nourish communities.

Highlights:

- Donor/Receiver flows, dashboards, and geolocation
- Create Food Post with image URLs (free) or optional Firebase Storage uploads
- Nearby search with distance filter and browser notifications
- Authentication: Email/Password, Google, and Guest (anonymous)
- Profile page (view/edit name and role)
- Self‑contained rule‑based Chatbot (no external API)
- Express API + React (Vite) + TypeScript + Tailwind + Radix UI

---

## 0) What’s free vs optional (Firebase)

- Free (Spark plan): Authentication, Firestore, basic quotas without credit card.
- Optional paid later: Firebase Storage uploads. To stay 100% free, paste image URLs in the Create Post form instead of uploading files.

---

## 1) Prerequisites (step‑by‑step)

1. Install Node.js 18+ from https://nodejs.org (LTS recommended). Verify: `node -v`
2. Install pnpm globally: `npm i -g pnpm` then verify: `pnpm -v`
3. Install VS Code: https://code.visualstudio.com/ and open this project folder
4. Recommended VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense

---

## 2) Install dependencies

Open VS Code terminal (View > Terminal) in the project root and run:

```bash
pnpm install
```

If you hit network/firewall issues, try:

- `pnpm config set strict-ssl false` (corporate networks)
- use a different network or VPN

---

## 3) Create Firebase project (free tier)

1. Go to https://console.firebase.google.com and click “Add project”
2. Name it (e.g., foodlink‑dev). Disable Google Analytics (optional)
3. After creation, click the gear (Project settings) > Your apps > Web app
4. Register a Web app to get the config values

### Enable Auth providers

- Build > Authentication > Get started
- Sign‑in method:
  - Email/Password: Enable
  - Google: Enable (configure project support email)
  - Anonymous: Enable (for guest mode)

### Create Firestore

- Build > Firestore Database > Create database
- Start in test mode for development

### (Optional) Storage

- You can skip Storage to remain fully free
- If you later enable it: Build > Storage > Get started

---

## 4) Set environment variables

You’ll need to provide the Firebase config to the frontend (Vite uses VITE\_ prefix).
Create a `.env` file in the project root (do NOT commit secrets) or use your dev server environment settings.

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

Notes:

- If you skip Storage, you can still leave STORAGE_BUCKET blank; the app won’t require it.
- For Builder’s hosted dev server, prefer setting variables in the server settings instead of committing `.env`.

---

## 5) Run the project locally

```bash
pnpm dev
```

- Opens the app + API on one port (Vite + Express)
- Use the in‑app navigation to explore Home, Donor/Receiver dashboards, Create Post, Profile, Help

Build production:

```bash
pnpm build
```

Run production build locally:

```bash
pnpm start
```

---

## 6) Using the app

### Auth

- Sign up with email/password and select role (Donor/Receiver)
- Continue with Google (works for signup and login)
- Forgot password (email reset)
- Guest mode (anonymous or local guest): browse without account

### Create Post (free images)

- Enter details and optionally click “Use my location” for coordinates
- Paste image URLs (comma‑separated). Host images anywhere free (e.g., an existing CDN/site). The post saves these URLs.
- Optional: If you enable Firebase Storage, you can also upload files directly

### Receiver Dashboard

- Allow geolocation for best results
- Adjust distance slider (1–25 km) and veg‑only filter
- Get browser notifications for new nearby donations

### Profile

- View name, email, and role
- Edit name and role, saved to Firestore

### Chatbot (offline)

- Ask about posting, nearby search, Google/guest sign‑in, password reset, profile, safety
- No external API required; responses are fast and private

---

## 7) Firestore data model

- Users/{uid}
  - name, email, role ('donor'|'receiver'), createdAt
- Posts/{postId}
  - uid, title, description, quantity, tags[], pickupStart, pickupEnd, address
  - coords { lat, lon } | null
  - images[] (URLs)
  - status ('draft'|'published'), createdAt
- Requests/{requestId}
  - postId, donorId, receiverId, status ('pending'|'accepted'|'rejected'), createdAt
- ChatbotLogs/{id}
  - sessionId, userId, message, response, intent, timestamp

---

## 8) Tips for free tier

- Prefer URL��based images to avoid Storage costs
- Keep Firestore reads/writes efficient (batch UI updates; avoid polling)
- Use browser Geolocation + Notifications (free APIs)
- Only enable providers you use (Email/Password, Google, Anonymous)

---

## 9) Deployment

- Netlify or Vercel recommended
- Ensure environment variables are set in hosting provider
- In Builder, you can [Connect Netlify MCP] or [Connect Vercel MCP] and deploy directly

---

## 10) Troubleshooting & FAQ

- I can’t sign in: check Firebase Auth providers and authorized domain
- Firestore permission errors: in development, use test rules; in prod, lock down rules
- Geolocation blocked: requires HTTPS and user permission
- Notifications missing: browser permission or OS focus assist may block
- Images not showing: verify URL is reachable and CORS allows display

---

## 11) Scripts

- `pnpm dev` – start dev server (SPA + API)
- `pnpm build` – build client and server
- `pnpm start` – run production build
- `pnpm test` – run tests
- `pnpm typecheck` – TypeScript check

---

## 12) Project structure (important files)

- client/App.tsx – routes & providers
- client/layouts/MainLayout.tsx – header/nav/footer, auth/guest controls
- client/pages/Index.tsx – food‑themed home page
- client/pages/Auth.tsx – email/password, Google, reset, guest
- client/pages/CreatePost.tsx – post form; image URLs + optional uploads
- client/pages/ReceiverDashboard.tsx – geolocation + filters + notifications
- client/pages/Profile.tsx – profile view/edit
- client/components/Chatbot/ChatWidget.tsx – floating chat assistant
- server/index.ts – Express server
- server/routes/chatbot.ts – offline rule‑based chatbot
