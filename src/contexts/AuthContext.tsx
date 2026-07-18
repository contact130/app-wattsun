import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoredCode, saveCode, clearCode } from '../api/client';
import { verifyCode, Partenaire } from '../api/portail';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  partenaire: Partenaire | null;
  code: string | null;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [partenaire, setPartenaire] = useState<Partenaire | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  async function checkStoredAuth() {
    try {
      const storedCode = await getStoredCode();
      if (storedCode) {
        const p = await verifyCode(storedCode);
        setPartenaire(p);
        setCode(storedCode);
        setIsAuthenticated(true);
      }
    } catch (e) {
      // Code invalide ou expiré, on nettoie
      await clearCode();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(inputCode: string) {
    setError(null);
    setIsLoading(true);
    try {
      const p = await verifyCode(inputCode);
      // Accepter les techniciens ET les admins (qui sont aussi de type technicien)
      if (p.type === 'donneur_ordre') {
        throw new Error("Ce code n'est pas un code technicien/admin");
      }
      await saveCode(inputCode);
      setPartenaire(p);
      setCode(inputCode);
      setIsAuthenticated(true);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || 'Code invalide';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await clearCode();
    setPartenaire(null);
    setCode(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, partenaire, code, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
