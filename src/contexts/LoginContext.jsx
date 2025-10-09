import React, { createContext, useContext } from 'react';

const LoginContext = createContext(null);

export const LoginProvider = ({ children, loginData }) => {
  return (
    <LoginContext.Provider value={loginData}>
      {children}
    </LoginContext.Provider>
  );
};

export const useLoginData = () => {
  const context = useContext(LoginContext);
  return context;
};
