// Explicit CORS allow-list. Because requests carry a user JWT we never use "*".
// Add your deployed web origin(s) here. Capacitor's native WebView origins are
// included for the Android app.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://localhost", // Capacitor android (androidScheme: 'https')
  "capacitor://localhost",
  "aftertaste-d4wesalam-aftertaste.vercel.app"
  // "https://your-production-domain.com",
];

export function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
