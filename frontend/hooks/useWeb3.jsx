import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, createPublicClient, http, formatEther } from "viem"
import { sepolia } from 'viem/chains'
import { toast } from 'react-toastify';

const useWeb3 = () => {

  const initialWeb3State = {
    address: null,
    currentChainId: null,
    walletClient: null,
    publicClient: null,
    balance: 0,
    isAuthenticated: false,
  };

  const [state, setState] = useState(initialWeb3State);
  const [interv, setInterv] = useState(null);

  const getBalance = async () => {
    try {
      var balance = formatEther(await state.publicClient.getBalance({address: state.address}));
      setState({ ...state, balance: balance,});
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if(!state.isAuthenticated || state.currentChainId != 11155111){
      setState({ ...state, balance: "0"});
      if(interv){
        setInterv(clearInterval(interv))
      }
    } else {
      if(!interv){
        setInterv(setInterval(()=>{
          getBalance()
          }, 1000))
      }
    }
  }, [state.isAuthenticated, state.currentChainId])

  const connectWallet = useCallback(async () => {

    if (state.isAuthenticated) return;
    
    if(window.ethereum === undefined){
      toast.error('No metamask detected, please install it', {
        position: toast.POSITION.TOP_RIGHT
      });
    }

    try {
        const walletClient = createWalletClient({
            chain: sepolia,
            transport: custom(window.ethereum)
        })
    
        const publicClient = createPublicClient({ 
            chain: sepolia,
            transport: http("https://ethereum-sepolia.publicnode.com")
        })

      try {
        await walletClient.requestAddresses()
      } catch (error) {
        if (error.code === 4001) {
          toast.error('User denied account authorization', {
            position: toast.POSITION.TOP_RIGHT
          });
        } else {
          toast.error('Unexpected error ' + error, {
            position: toast.POSITION.TOP_RIGHT
          });
        }
      }
        const chain = await walletClient.getChainId();
        const accounts = await walletClient.requestAddresses();
        const balance =  formatEther(await publicClient.getBalance({address: accounts[0]}));

        setState({
          ...state,
          address: accounts[0],
          currentChainId: chain,
          walletClient: walletClient,
          publicClient: publicClient,
          balance: balance,
          isAuthenticated: true,
        });
        localStorage.setItem("isAuthenticated", "true");
    } catch(error) {
      console.log(error)
    }
  }, [state]);

  const disconnect = () => {
    setState(initialWeb3State);
    localStorage.removeItem("isAuthenticated");
  };

  useEffect(() => {
    if (window == null) return;

    if (localStorage.hasOwnProperty("isAuthenticated")) {
      connectWallet();
    }
  }, [connectWallet, state.isAuthenticated]);

  useEffect(() => {
    if (typeof window.ethereum === "undefined") return;

    window.ethereum.on("accountsChanged", (accounts) => {
      setState({ ...state, address: accounts[0]});
    });

    window.ethereum.on("chainChanged", (network) => {
      const chain = Number(network);
      setInterv(clearInterval(interv))
      setState({ ...state, currentChainId: chain});
    });

  //   window.ethereum.on('disconnect', () => {
  //     console.log("Disconnected")
  //     disconnect();
  //  });

    return () => {
      window.ethereum.removeAllListeners();
    };
  }, [state]);

  return {
    connectWallet,
    disconnect,
    state,
  };
};

export default useWeb3;