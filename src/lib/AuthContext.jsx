import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider
      value={{
        user: null,
        isAuthenticated: false,
        isLoadingAuth: false,
        isLoadingPublicSettings: false,
        authError: null,
        navigateToLogin: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
