import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { generateCSRFToken } from '@/utils/inputValidation';

interface SecurityContextType {
  csrfToken: string;
  refreshCSRFToken: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  const [csrfToken, setCSRFToken] = useState<string>('');

  const refreshCSRFToken = () => {
    const newToken = generateCSRFToken();
    setCSRFToken(newToken);
    sessionStorage.setItem('csrf_token', newToken);
  };

  useEffect(() => {
    // Initialize CSRF token
    const existingToken = sessionStorage.getItem('csrf_token');
    if (existingToken) {
      setCSRFToken(existingToken);
    } else {
      refreshCSRFToken();
    }

    // Refresh token every 30 minutes
    const interval = setInterval(refreshCSRFToken, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    csrfToken,
    refreshCSRFToken,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};