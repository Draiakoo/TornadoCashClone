"use client"

import { createContext } from "react";
import useWeb3 from "../hooks/useWeb3";


export const Web3Context = createContext(null);

const Web3ContextProvider = ({ children }) => {
  const { connectWallet, disconnect, state } = useWeb3();

  return (
    <Web3Context.Provider
      value={{
        connectWallet,
        disconnect,
        state,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export default Web3ContextProvider;