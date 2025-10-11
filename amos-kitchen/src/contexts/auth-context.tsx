"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, logOut as firebaseLogOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

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

  const refreshToken = async () => {
    try {
      if (!user) {
        console.log('No user to refresh token for');
        return;
      }

      // Get a fresh ID token from Firebase
      const idToken = await user.getIdToken(true); // Force refresh

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

        // If refresh fails with 401, the token is invalid - sign out
        if (response.status === 401) {
          console.error('Token refresh returned 401 - signing out user');
          await signOut();
        }
      } else {
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Don't sign out on network errors, only on auth failures
    }
  };

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
        // Function to refresh token with current user
        const doRefresh = async () => {
          try {
            const idToken = await firebaseUser.getIdToken(true);

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

              // If refresh fails with 401, sign out the user
              if (response.status === 401) {
                console.error('Auto-refresh returned 401 - signing out user');
                await signOut();
              }
            } else {
              console.log('Token refreshed successfully');
            }
          } catch (error) {
            console.error('Error refreshing token:', error);
            // Don't sign out on network errors
          }
        };

        // Refresh token immediately to sync cookie
        await doRefresh();

        // Set up interval to refresh token every 50 minutes
        // (Firebase tokens expire after 1 hour)
        refreshIntervalRef.current = setInterval(async () => {
          console.log('Auto-refreshing token...');
          await doRefresh();
        }, 50 * 60 * 1000); // 50 minutes in milliseconds
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const signOut = async () => {
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
  };

  const value = {
    user,
    loading,
    signOut,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};