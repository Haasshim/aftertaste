# Aftertaste — Setup & Deployment

The app runs in two modes:

- **Local mode** (no config): data stays in the browser (LocalForage). Good for quick dev.
  Sign in with any email/password — it creates a local guest session. No cloud, no security.
- **Cloud mode** (Supabase configured): real accounts, Row-Level Security, file storage, and
  the optional Google Places restaurant discovery integration.

---

## 1. Run locally (no backend)

```bash
npm install
npm run dev        # http://localhost:3000
```

## 2. Enable Supabase (cloud mode)

1. Create a project at https://supabase.com and copy the **Project URL** and **anon key**
   (Project Settings → API).
2. Create the frontend env file:
   ```bash
   cp .env.example .env
   # set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```
3. Apply the database schema + security policies. Either run the SQL files in the dashboard
   SQL editor in order, or with the Supabase CLI:
   ```bash
   supabase link --project-ref YOUR_REF
   supabase db push                       # applies supabase/migrations/000{1,2,3}.sql
   ```
   This creates `profiles`, `dish_logs` (multi-dimensional ratings + generated overall),
   `attachments`, all RLS policies, and the private `attachments` storage bucket.
4. In Auth settings, enable Email provider. (Email confirmation on/off changes the signup UX —
   the app handles both.)
5. Restart `npm run dev`. The login screen now uses real Supabase accounts, and any existing
   local logs are migrated into your account on first sign-in.

### Verify security
- Sign up as user A, log a dish. Sign up as user B in another browser — B sees none of A's
  data, and opening A's `#/dish/:id` URL shows nothing.
- `npm run build && grep -ri "service_role\|sk-ant" dist/` → no matches.

## 3. Google Places discovery (optional, read-only)

> Live restaurant search across India via Google Places. The app falls back to the bundled
> static catalog whenever the integration is off or fails, so it always works. Restaurants
> discovered via Places have no menu — you log a custom dish name on the restaurant page.

**Google Cloud setup (one time):**
1. At https://console.cloud.google.com create a project and **enable billing** (a card is
   required even for the free tier — you get $200/month free credit).
2. **APIs & Services → Library** → enable **Places API (New)** and **Geocoding API**.
3. **Credentials → Create credentials → API key.** Restrict it to those two APIs.
4. **Billing → Budgets & alerts** → create a $200/month budget with alerts so you can't be
   surprised by charges.

**Wire it into Aftertaste:**
1. Deploy both Edge Functions. The photo proxy must use `--no-verify-jwt` (an `<img>`
   tag can't send an auth header; the function validates a token query param itself):
   ```bash
   supabase functions deploy places-search
   supabase functions deploy places-photo --no-verify-jwt
   ```
2. Set the server-only secret (NEVER put this in `.env` — it must not ship to the browser).
   Both functions read the same secret:
   ```bash
   supabase secrets set GOOGLE_PLACES_API_KEY=AIza...
   ```
3. Turn on the feature flag in `.env`: `VITE_ENABLE_PLACES=true`, then rebuild.
4. Add your deployed web origin to the allow-list in
   `supabase/functions/_shared/cors.ts`.

Location: the search screen lets users type an area/city or tap **Use GPS** (browser
geolocation). The Edge Function geocodes text to coordinates and biases results within ~10 km.

## 4. Build the Android APK (Capacitor)

The Capacitor project is already scaffolded (`android/`, `capacitor.config.json`). Building the
APK requires **JDK 17** and the **Android SDK** (install Android Studio).

```bash
npm run build
npx cap sync android
# Option A — open in Android Studio and Run/Build:
npx cap open android
# Option B — command line debug APK:
cd android && ./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

Notes:
- Mic permission for voice notes is wired in `MainActivity.java` + `AndroidManifest.xml`
  (`RECORD_AUDIO`). Test recording on a physical device.
- A **release** APK/AAB needs a signing keystore (`keytool` + `android/app` signing config).
- Add the Capacitor origins (`https://localhost`, `capacitor://localhost`) to Supabase Auth
  redirect URLs / CORS and to the Edge Function allow-list.

## 5. Useful scripts

```bash
npm run dev        # dev server
npm run build      # production web build -> dist/
npm run preview    # preview the build
```
