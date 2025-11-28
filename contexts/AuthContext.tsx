
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { AuthService } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: 'google' | 'apple') => Promise<void>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = AuthService.subscribe((u) => {
      setUser(u);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (providerName: 'google' | 'apple') => {
    setError(null);
    try {
      await AuthService.login(providerName);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Failed to sign in. Please try again.");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, showAuthModal, setShowAuthModal, error }}>
      {children}
    </AuthContext.Provider>
  );
};
