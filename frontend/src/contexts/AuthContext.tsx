"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken } from "@/src/lib/auth";
import { getUserToken } from "@/src/lib/userAuth";

interface UserInfo {
  id: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  role: "user" | "organizer" | null;
  user: UserInfo | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, userInfo: UserInfo, role: "user" | "organizer") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT token (without verification, just for client-side display)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    user: null,
  });

  // Initialize auth state from tokens on mount
  useEffect(() => {
    // Check for organizer token
    const organizerToken = getToken();
    if (organizerToken) {
      const decoded = decodeJWT(organizerToken);
      const userId = decoded?.sub || "";
      const email = typeof window !== "undefined" 
        ? localStorage.getItem("organizer_email") || ""
        : "";
      
      if (userId && email) {
        setAuthState({
          isAuthenticated: true,
          role: "organizer",
          user: { id: userId, email },
        });
        return;
      }
    }

    // Check for user token
    const userToken = getUserToken();
    if (userToken) {
      const decoded = decodeJWT(userToken);
      const userId = decoded?.sub || "";
      const email = typeof window !== "undefined"
        ? localStorage.getItem("user_email") || ""
        : "";
      
      if (userId && email) {
        setAuthState({
          isAuthenticated: true,
          role: "user",
          user: { id: userId, email },
        });
        return;
      }
    }

    // No valid tokens
    setAuthState({
      isAuthenticated: false,
      role: null,
      user: null,
    });
  }, []);

  const login = (token: string, email: string, role: "user" | "organizer") => {
    const decoded = decodeJWT(token);
    const userId = decoded?.sub || "";
    
    // Store email in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem(`${role}_email`, email);
    }
    
    setAuthState({
      isAuthenticated: true,
      role,
      user: {
        id: userId,
        email,
      },
    });
  };

  const logout = () => {
    // Clear tokens and email
    if (typeof window !== "undefined") {
      localStorage.removeItem("organizer_token");
      localStorage.removeItem("user_token");
      localStorage.removeItem("organizer_email");
      localStorage.removeItem("user_email");
    }
    setAuthState({
      isAuthenticated: false,
      role: null,
      user: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

