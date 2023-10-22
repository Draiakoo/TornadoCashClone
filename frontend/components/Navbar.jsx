"use client"

import { createWalletClient, custom, createPublicClient, http, formatEther  } from "viem"
import { sepolia } from 'viem/chains'
import { useState, useEffect } from "react"

const Navbar = () => {

    const connectWallet = async () => {
        if(isConnected) return
        if(window.ethereum === undefined){
            alert("Install Metamask")
            return;
        }
        const newClient = createWalletClient({
            chain: sepolia,
            transport: custom(window.ethereum)
        })
        setClient(newClient)
        try{
            await newClient.requestAddresses()
        }catch(error){
            if(error.code === 4001){
                alert("Wallet connection rejected")
                return
            }
        }
        
        setIsConnected(true)
        var connectedChainId = await newClient.getChainId()
        if(connectedChainId != sepolia.id){
            try {
                await newClient.switchChain({ id: sepolia.id })
            } catch (error) {
                alert("Network change rejected")
            } 
        }
        var connectedChainId = await newClient.getChainId()
        const connectedAddress = await newClient.requestAddresses()
        setWalletInfo({
            address: connectedAddress[0],
            chainId: connectedChainId,
            balance: formatEther(await publicClient.getBalance({address: connectedAddress[0]}))
        })
    }

    const switchChain = async () => {
        try {
            await client.switchChain({ id: sepolia.id })
        } catch (error) {
            alert("Network change rejected")
        } 
        var connectedChainId = await client.getChainId()
        setWalletInfo({
            ...walletInfo,
            chainId: connectedChainId
        })
    }

    const disconnectWallet = async () => {
        console.log(walletInfo)
        setIsConnected(false)
        setClient(null)
        setWalletInfo({address: null, chainId: null, balance: null})
    }

    const [isConnected, setIsConnected] = useState(false);
    const [client, setClient] = useState(null);
    const [publicClient, setPublicClient] = useState(null);
    const [walletInfo, setWalletInfo] = useState({address: null, chainId: null, balance: null});

    useEffect(() => {
        setPublicClient(
            createPublicClient({ 
                chain: sepolia,
                transport: http()
            }));
    }, [])

    return(
        <div className="w-full bg-slate-600 text-center relative">
            <h1 className="py-10">
                Tornado Cash Clone
            </h1>
            {isConnected
                ? 
                    walletInfo.chainId === sepolia.id
                        ?
                        <>
                            <button onClick={disconnectWallet} className="absolute right-0 top-0 bg-black mt-10 mr-10">
                                Disconnect wallet
                            </button>
                            <div>
                                <p>{walletInfo.address}</p>
                                <p>{walletInfo.chainId}</p>
                                <p>{walletInfo.balance}</p>
                            </div>
                        </>
                        :
                        <>
                            <button onClick={switchChain} className="absolute right-0 top-0 bg-black mt-10 mr-10">
                                Switch chain
                            </button>
                        </>
                :
                <button onClick={connectWallet} className="absolute right-0 top-0 bg-black mt-10 mr-10">
                    Connect wallet
                </button>
            }
        </div>
    )
}

export default Navbar;