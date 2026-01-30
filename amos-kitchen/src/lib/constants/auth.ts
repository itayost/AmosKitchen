// Authentication constants

/**
 * Firebase ID tokens expire after 1 hour.
 * We refresh at 50 minutes to ensure the token is always valid.
 */
export const AUTH_CONFIG = {
  /** Firebase token expiration time in milliseconds (1 hour) */
  TOKEN_EXPIRY_MS: 60 * 60 * 1000,

  /** Token refresh interval in milliseconds (50 minutes) */
  TOKEN_REFRESH_INTERVAL_MS: 50 * 60 * 1000,

  /** Cookie expiration in seconds (7 days) */
  COOKIE_MAX_AGE_SECONDS: 60 * 60 * 24 * 7,

  /** Cookie name for Firebase auth token */
  AUTH_COOKIE_NAME: 'firebase-auth-token',
} as const

/**
 * Cookie options for auth token
 * @param isProduction - Whether the app is running in production
 */
export function getAuthCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: AUTH_CONFIG.COOKIE_MAX_AGE_SECONDS,
    path: '/',
  }
}
