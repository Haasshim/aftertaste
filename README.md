# Aftertaste

**Remember every bite.**

Aftertaste is a personal food journaling app that lets you log, rate, and rediscover the dishes you've eaten at restaurants — so you never forget what you had or how it tasted.

## The Problem

When dining out in India, there's no good way to remember what you ordered, how it tasted, or whether you'd get it again. Most people end up scribbling notes in their phone's notes app, losing context over time. Aftertaste fixes that.

## Features

- **Dish Logging** — Search for a restaurant, pick a dish, and log your experience in seconds
- **10-Point Rating System** — Rate dishes from "Disappointing" to "Outstanding" with visual feedback
- **Stamps / Tags** — Quick-tag dishes as Must Try, Will Try Again, Comfort Food, Spice Bomb, Do Not Order, and more
- **Rich Attachments** — Add photos, record voice notes, and save links to a dish entry
- **Comments** — Write freeform tasting notes
- **Your Journal** — Browse all your past logs with restaurant, dish, rating, and tags at a glance
- **Restaurant Search** — Filter restaurants by name, location, or cuisine type

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

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`

**Test credentials:** `test@aftertaste.com` / `taste123`

## Roadmap

- Swiggy MCP integration for live restaurant & menu data across India
- Cloud sync across devices
- Social sharing of dish logs
- Dish recommendations based on rating history
- Google Sign-In
