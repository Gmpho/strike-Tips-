

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Defines the shape of the authentication context's value.
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

// Create the context with an undefined default value.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The AuthProvider component wraps parts of the app that need access to authentication state.
 * It provides the `isAuthenticated` status and `login`/`logout` functions to its children.
 * 
 * NOTE: This is a simplified, in-memory simulation of an authentication system.
 * In a real-world application, this would involve API calls, token management (JWTs),
 * and potentially integration with third-party authentication services.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State to hold the user's authentication status.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simulates a user logging in.
  const login = () => {
    console.log("Simulating user login.");
    setIsAuthenticated(true);
  };

  // Simulates a user logging out.
  const logout = () => {
    console.log("Simulating user logout.");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook `useAuth` to easily access the authentication context.
 * This simplifies consumption in components and includes a check to ensure
 * it's used within an AuthProvider.
 * @returns The authentication context value.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};