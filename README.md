

# Aftertaste

**Remember every bite.**

Aftertaste is a personal food journaling app that lets you log, rate, and rediscover the dishes you've eaten at restaurants. This is so that you never forget what you had or how it tasted.

## The Problem

When dining out in India, there was no good way for me to remember what I ordered, how it tasted, or whether it was good or not. I ended up scribbling reviews in my notes app, and forgetting to update it. Aftertaste fixes that. 

## Repo

This is a mockup demo of how I would want the this app to be and feel like and is not a finalized version. Using AI tools, I was able to make this mockup for the application in less than a week and requires multiple refinements for which Swiggy's MCP would be the start. 

## Features

- **Dish Logging** - Search for a restaurant, pick a dish, and log your experience in seconds
- **10-Point Rating System** - Rate dishes from "Disappointing" to "Outstanding" with visual feedback
- **Stamps / Tags** - Quick-tag dishes as Must Try, Will Try Again, Comfort Food, Spice Bomb, Do Not Order, and more
- **Rich Attachments** - Add photos, record voice notes, and save links to a dish entry
- **Comments** - Write freeform tasting notes
- **Your Journal** - Browse all your past logs with restaurant, dish, rating, and tags at a glance
- **Restaurant Search** - Filter restaurants by name, location, or cuisine type

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router DOM 6 (HashRouter) |
| Storage | LocalForage (IndexedDB) |
| Media | MediaRecorder API (voice notes), File API (photos) |
| Fonts | Playfair Display (Google Fonts) |

## Architecture

```
src/
├── App.jsx                      # Root router
├── screens/
│   ├── SplashScreen.jsx         # Animated intro
│   ├── LoginScreen.jsx          # Auth entry
│   ├── HomeScreen.jsx           # Journal feed
│   ├── SearchRestaurantScreen.jsx  # Restaurant discovery
│   ├── RestaurantDetailScreen.jsx  # Menu & dishes
│   ├── AddDishLogScreen.jsx     # Log new entry (rating, stamps, media)
│   └── DishDetailScreen.jsx     # View full log entry
├── data/
│   └── restaurants.js           # Restaurant & dish dataset
└── utils/
    ├── constants.js             # Stamps & rating labels
    └── storage.js               # LocalForage CRUD operations
```

All data is stored client-side in IndexedDB via LocalForage. No backend required.

## Changes to be done
The most impactful change would be moving from LocalForage to a proper backend database like PostgreSQL with a lightweight Node.js or Express API layer, which would enable data persistence across devices and browsers instead of being locked to a single browser's storage. On the authentication side, replacing the hardcoded credentials with a real auth system like Supabase or Firebase Auth would give users secure, account-based access with Google Sign-In which is already stubbed in the UI. For media storage, specifically photos and voice notes are currently saved as raw base64 blobs directly in IndexedDB which bloats storage fast. Moving these to an object storage service like AWS S3 or Cloudflare R2 would make the app significantly faster and more scalable. Long term, adding end-to-end encryption on journal entries before they leave the device would make Aftertaste genuinely private, meaning even the server never sees your unencrypted dining history.

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`

**Test credentials:** `test@aftertaste.com` / `taste123`

## Demo

https://github.com/user-attachments/assets/aftertaste-demo

## Future Improvements

### 1. UI

The current UI is user friendly and basic and I would want to make it visually better, add more pages and features to make the entire flow robust. A more sleek look to ensure there is a cleaner flow for the user and integrating features like dark mode, paginations, placeholder animations,editing logs, sort logs, add unlisted dishes, log history based on restaurrants, and a logo.

---
### 2. Security

Currently, everything is stored as plain text in IndexedDB. Anyone who opens DevTools on your browser, or has physical access to your machine, can read every entry in seconds. There is also no real authentication and the credentials are hardcoded in the source code. 
- **Authentication** - JWT access tokens (15min, stored in memory) + refresh tokens (30 days, HttpOnly cookie) to prevent XSS token theft
- **Password Storage** - All passwords hashed with bcrypt (work factor 12) before hitting the database, never stored in plain text
- **Data in Transit** - HTTPS enforced on all routes with HSTS header to block man-in-the-middle attacks
- **Data at Rest** - Sensitive fields encrypted with AES-256-GCM at the application layer before writing to the database
- **Disk Encryption** - Full-disk encryption enabled at the database server level as a second layer
- **Rate Limiting** - Auth endpoints capped at 5 attempts per IP per 15 minutes to block brute-force attacks
- **Input Validation** - All incoming data validated against a strict schema (Zod/Joi) before touching the database
- **SQL Injection Prevention** - Parameterised queries or ORM (Prisma) used throughout, no raw string concatenation
- **CORS Policy** - Restricted to the production frontend domain only, no wildcard origins
- **Authorisation** - Every API route verifies the requesting user owns the resource via userId match before returning data
- **Secrets Management** - No keys or credentials committed to the repo, all secrets managed through environment variables and a secrets manager

### 3. Live Restaurant & Menu Data (Swiggy MCP)

The current dataset is a static list of Chennai restaurants hardcoded in `src/data/restaurants.js`. This limits the app to a single city and quickly becomes outdated. Integrating Swiggy's food MCP would replace the static file with live API queries, unlocking:

- **Real-time restaurant search** across all Indian cities instead of a fixed local list
- **Up-to-date menus** with actual dish names, categories, and prices fetched on demand
- **Location-aware discovery** - surface nearby open restaurants automatically
- **Enriched dish metadata** - dietary tags, cuisine type, and community ratings alongside the user's personal rating

**Implementation path:** The integration is surgical — swap `restaurants.js` with async MCP calls in `SearchRestaurantScreen.jsx` and `RestaurantDetailScreen.jsx`. The existing log structure already stores `restaurantId` and `dishId` as keys, so every past log remains mappable to Swiggy's catalog.

---

### 4. Cloud Sync & Multi-Device Support

All data currently lives in the browser's IndexedDB, meaning logs are tied to a single device and lost if the browser is cleared. A lightweight backend (or a BaaS like Supabase/Firebase) would sync logs across devices and enable:

- Cross-device access to the full journal
- Backup and restore
- Google Sign-In

---

### 5. Social Sharing

Allow users to share a dish log card — a styled image with the dish name, restaurant, rating badge, stamps, and tasting note — directly to Instagram Stories or WhatsApp.

---

### 6. Dish Recommendations

Analyse the user's rating history to surface personalised suggestions: "You love spicy South Indian food rated 8+ — here are dishes you haven't tried yet at restaurants you've visited."
