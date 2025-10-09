import React, { createContext, useContext } from 'react';

const LoginContext = createContext(null);

export const LoginProvider = ({ children, loginData }) => {
  console.log('🔍 LoginProvider: Providing loginData:', loginData);
  return (
    <LoginContext.Provider value={loginData}>
      {children}
    </LoginContext.Provider>
  );
};

export const useLoginData = () => {
  const context = useContext(LoginContext);
  console.log('🔍 useLoginData: Retrieved context:', context);
  return context;
};
