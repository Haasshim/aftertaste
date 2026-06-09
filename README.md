# Aftertaste

Remember every bite.

Aftertaste is a personal food journaling app that lets you log, rate, and rediscover the dishes you have eaten at restaurants, so you never forget what you had or how it tasted.

## The Problem

When dining out in India, there is no good way to remember what you ordered, how it tasted, or whether you would get it again. Most people end up scribbling notes in their phone's notes app and losing context over time. Aftertaste fixes that.

## Features

- Dish logging: search for a restaurant, pick or type a dish, and log your experience in seconds.
- Multi-dimensional ratings: rate Taste, Ambience, and Service on a 1 to 10 scale. The overall score is the mean of the facets you rate.
- Stamps and tags: quick-tag dishes as Must Try, Will Try Again, Comfort Food, Spice Bomb, Do Not Order, and more.
- Rich attachments: add photos, record voice notes, and save links on a dish entry.
- Comments: write freeform tasting notes.
- Your journal: browse all of your past logs with restaurant, dish, rating, and tags at a glance.
- Restaurant discovery: search the bundled catalog offline, or enable live Google Places search across India with location awareness.
- Remembered dishes: dishes you have logged at a restaurant resurface as quick-pick chips next time you visit.
- Accounts and privacy: real sign-in with per-user data isolation enforced at the database level.
- Android app: packaged as an installable Android application through Capacitor.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | React Router DOM 6 (HashRouter) |
| Auth | Supabase Auth |
| Database | Supabase Postgres with Row-Level Security |
| File storage | Supabase Storage (private bucket) |
| Discovery | Google Places via Supabase Edge Functions |
| Local fallback | LocalForage (IndexedDB) when no backend is configured |
| Media | MediaRecorder API (voice notes), File API (photos) |
| Native shell | Capacitor (Android) |
| Fonts | Playfair Display |

## How It Works

The app runs in two modes:

- Local mode (no configuration): data stays in the browser via LocalForage. Useful for quick development. Sign-in creates a local guest session.
- Cloud mode (Supabase configured): real accounts, Row-Level Security, file storage, and optional Google Places discovery.

Security model:

- Only the Supabase URL and publishable (anon) key ship in the frontend. They are safe because Row-Level Security gates every query, so the key grants no access without a valid session and a matching policy.
- Secrets such as the Google Places API key live only in Edge Functions and never reach the browser.
- Restaurant discovery and photo loading go through JWT-verified Edge Functions. Place photos are proxied so the Google key is never exposed to the client.

See SETUP.md for provisioning and SECURITY.md for the full security model.

## Architecture

```
src/
  App.jsx                          Root router with protected routes
  context/AuthContext.jsx          Supabase auth session and role
  components/                      Icon set, RatingInput, ErrorBoundary, etc.
  screens/
    SplashScreen.jsx               Animated intro and session routing
    LoginScreen.jsx                Sign in
    SignupScreen.jsx               Create account
    HomeScreen.jsx                 Journal feed
    SearchRestaurantScreen.jsx     Restaurant discovery with location and GPS
    RestaurantDetailScreen.jsx     Dishes, remembered dishes, custom dish entry
    AddDishLogScreen.jsx           Log a new entry (rating, stamps, media)
    DishDetailScreen.jsx           View a full log entry
  lib/
    supabase.js                    Supabase client
    dataClient.js                  Unified data API with timeouts and retries
    places.js                      Google Places discovery with static fallback
    migrateLocalData.js            One-time local to cloud migration
    errors.js                      Typed error model
  data/restaurants.js              Bundled static catalog
  utils/                           Stamps, rating labels, local storage

supabase/
  migrations/                      Schema, Row-Level Security, storage policies
  functions/places-search          Restaurant search and details proxy
  functions/places-photo           Photo proxy (keeps the API key server-side)
```

## Getting Started

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000

To enable cloud mode and live restaurant search, follow SETUP.md to provision Supabase, apply the migrations, deploy the Edge Functions, and set the Google Places key.

## Building the Android App

The Capacitor project is scaffolded under android/. In short:

```bash
npm run build
npx cap sync android
```

Then open the android/ folder in Android Studio and run it on a connected device, or build an APK. Full steps are in SETUP.md.

## Future Improvements

- AI-assisted tasting notes: generate a draft tasting note from the dish, restaurant, rating, and stamps, which the user can edit before saving.
- Social sharing: share a styled dish-log card to Instagram Stories or WhatsApp.
- Dish recommendations: use rating history to suggest dishes the user has not tried at places they have visited.
