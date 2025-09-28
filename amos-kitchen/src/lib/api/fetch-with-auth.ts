// lib/api/fetch-with-auth.ts
import { auth } from '@/lib/firebase/config';

interface FetchOptions extends RequestInit {
  skipRetry?: boolean;
}

/**
 * Wrapper around fetch that automatically includes credentials and handles auth errors
 */
export async function fetchWithAuth(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipRetry = false, ...fetchOptions } = options;

  // Always include credentials to send cookies
  const optionsWithCredentials: RequestInit = {
    ...fetchOptions,
    credentials: 'include',
  };

  // Make the initial request
  const response = await fetch(url, optionsWithCredentials);

  // If response is OK or we should skip retry, return as is
  if (response.ok || skipRetry) {
    return response;
  }

  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401) {
    console.log('Got 401, attempting to refresh token...');

    try {
      // Get current user from Firebase
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error('No authenticated user, cannot refresh token');
        return response;
      }

      // Get a fresh token
      const idToken = await currentUser.getIdToken(true);

      // Update the cookie with the fresh token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      if (!refreshResponse.ok) {
        console.error('Failed to refresh token');
        return response;
      }

      console.log('Token refreshed, retrying original request...');

      // Retry the original request with the new token
      const retryResponse = await fetch(url, {
        ...optionsWithCredentials,
        // Mark as a retry to prevent infinite loops
        headers: {
          ...optionsWithCredentials.headers,
          'X-Retry-After-Auth': 'true',
        },
      });

      return retryResponse;

    } catch (error) {
      console.error('Error during token refresh:', error);
      return response;
    }
  }

  return response;
}

/**
 * Convenience method for GET requests
 */
export async function getWithAuth(url: string, options?: FetchOptions): Promise<Response> {
  return fetchWithAuth(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * Convenience method for POST requests
 */
export async function postWithAuth(url: string, body?: any, options?: FetchOptions): Promise<Response> {
  return fetchWithAuth(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function putWithAuth(url: string, body?: any, options?: FetchOptions): Promise<Response> {
  return fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function deleteWithAuth(url: string, options?: FetchOptions): Promise<Response> {
  return fetchWithAuth(url, {
    ...options,
    method: 'DELETE',
  });
}