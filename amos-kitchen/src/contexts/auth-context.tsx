"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, logOut as firebaseLogOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { AUTH_CONFIG } from "@/lib/constants/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshToken: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Centralized token refresh function that works with any Firebase user
  const doTokenRefresh = useCallback(async (firebaseUser: User, onAuthFailure?: () => Promise<void>) => {
    try {
      // Get a fresh ID token from Firebase (force refresh)
      const idToken = await firebaseUser.getIdToken(true);

      // Send the new token to our backend to update the cookie
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to refresh token cookie:', response.status, errorText);

        // If refresh fails with 401, the token is invalid - trigger auth failure handler
        if (response.status === 401 && onAuthFailure) {
          console.error('Token refresh returned 401 - triggering auth failure handler');
          await onAuthFailure();
        }
      } else {
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Don't sign out on network errors, only on auth failures
    }
  }, []);

  // Exposed refresh function that uses current user state
  const refreshToken = useCallback(async () => {
    if (!user) {
      console.log('No user to refresh token for');
      return;
    }
    await doTokenRefresh(user);
  }, [user, doTokenRefresh]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      // Clear refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      // Sign out from Firebase client-side
      await firebaseLogOut();

      // Also call backend logout to clear cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Clear any existing refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      // If user is logged in, set up token refresh
      if (firebaseUser) {
        // Refresh token immediately to sync cookie
        await doTokenRefresh(firebaseUser, signOut);

        // Set up interval to refresh token before expiry
        // Firebase tokens expire after 1 hour, refresh at 50 minutes
        refreshIntervalRef.current = setInterval(async () => {
          console.log('Auto-refreshing token...');
          await doTokenRefresh(firebaseUser, signOut);
        }, AUTH_CONFIG.TOKEN_REFRESH_INTERVAL_MS);
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [doTokenRefresh, signOut]);

  const value = {
    user,
    loading,
    signOut,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};