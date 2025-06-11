import { createContext, useContext } from 'react';

// This is a minimal implementation to fix the import error
const AuthContext = createContext();

export function AuthProvider({ children }) {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
