import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { apiClient } from "../utils/apiClient";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token and validate with backend
    const initAuth = async () => {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        try {
          apiClient.setToken(storedToken);

          // Check if token is still valid
          if (!apiClient.isAuthenticated()) {
            console.warn("Stored token is expired or invalid");
            setIsLoading(false);
            return;
          }

          const userData = await apiClient.getCurrentUser();
          setUser(userData.user);
        } catch (error) {
          console.error("Failed to validate stored token:", error);
          // Clear invalid token
          apiClient.clearToken();
          localStorage.removeItem("emmisor-user");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(email, password);
      console.log("Login response:", response);
      setUser(response.user);
      localStorage.setItem("emmisor-user", JSON.stringify(response.user));
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiClient.logout();
    localStorage.removeItem("emmisor-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
