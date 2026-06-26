// CORS allow-list. Because requests carry a user JWT we never use "*".
// Exact origins for local dev + Capacitor's native WebView, plus regex
// patterns so Vercel preview/production deploys (whose subdomain changes on
// every build) are allowed without editing this file each time.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://localhost", // Capacitor android (androidScheme: 'https')
  "capacitor://localhost",
  // "https://your-production-domain.com",
];

// Any deploy of this Vercel project, e.g.
//   https://aftertaste.vercel.app
//   https://aftertaste-blush.vercel.app
//   https://aftertaste-d4wesalam-aftertaste.vercel.app
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/aftertaste[a-z0-9-]*\.vercel\.app$/,
];

function isAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin) ||
    ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin && isAllowed(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
