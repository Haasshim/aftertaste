// Typed error model so the UI can show real, actionable messages instead of
// raw exceptions or silent failures.
export const ErrorTypes = {
  NETWORK: 'network',
  AUTH: 'auth',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  RATE_LIMIT: 'rate_limit',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  UNKNOWN: 'unknown',
};

export class AppError extends Error {
  constructor(type, message, { retryable = false, cause } = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.retryable = retryable;
    this.cause = cause;
  }
}

const FRIENDLY = {
  [ErrorTypes.NETWORK]: "You're offline or the connection failed. Check your network and try again.",
  [ErrorTypes.AUTH]: 'Your session expired. Please sign in again.',
  [ErrorTypes.PERMISSION]: "You don't have access to this.",
  [ErrorTypes.VALIDATION]: 'Some details look invalid. Please review and try again.',
  [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorTypes.NOT_FOUND]: "We couldn't find what you were looking for.",
  [ErrorTypes.SERVER]: 'The server had a problem. Please try again shortly.',
  [ErrorTypes.UNKNOWN]: 'Something went wrong. Please try again.',
};

// Normalize anything thrown (fetch error, Supabase PostgrestError, HTTP status)
// into an AppError with a friendly message.
export function toAppError(err) {
  if (err instanceof AppError) return err;

  // Browser network failure (fetch/AbortController) has no HTTP status.
  if (err?.name === 'AbortError' || err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
    return new AppError(ErrorTypes.NETWORK, FRIENDLY[ErrorTypes.NETWORK], { retryable: true, cause: err });
  }

  const status = err?.status ?? err?.statusCode;
  if (status === 401) return new AppError(ErrorTypes.AUTH, FRIENDLY[ErrorTypes.AUTH], { cause: err });
  if (status === 403) return new AppError(ErrorTypes.PERMISSION, FRIENDLY[ErrorTypes.PERMISSION], { cause: err });
  if (status === 404) return new AppError(ErrorTypes.NOT_FOUND, FRIENDLY[ErrorTypes.NOT_FOUND], { cause: err });
  if (status === 422 || status === 400) return new AppError(ErrorTypes.VALIDATION, err?.message || FRIENDLY[ErrorTypes.VALIDATION], { cause: err });
  if (status === 429) return new AppError(ErrorTypes.RATE_LIMIT, FRIENDLY[ErrorTypes.RATE_LIMIT], { retryable: true, cause: err });
  if (status >= 500) return new AppError(ErrorTypes.SERVER, FRIENDLY[ErrorTypes.SERVER], { retryable: true, cause: err });

  // Supabase RLS denials surface as permission, not raw 401.
  if (err?.code === 'PGRST301' || err?.code === '42501') {
    return new AppError(ErrorTypes.PERMISSION, FRIENDLY[ErrorTypes.PERMISSION], { cause: err });
  }

  return new AppError(ErrorTypes.UNKNOWN, err?.message || FRIENDLY[ErrorTypes.UNKNOWN], { cause: err });
}
