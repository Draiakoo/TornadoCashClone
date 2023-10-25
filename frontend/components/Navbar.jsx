"use client"

import { sepolia } from 'viem/chains'
import { useState } from "react"
import { Web3Context } from "../context/Web3Context";
import { useContext } from "react";
import { toast } from 'react-toastify';

const Navbar = () => {

    const {
        connectWallet,
        disconnect,
        state: { isAuthenticated, address, currentChainId, walletClient, publicClient, balance },
      } = useContext(Web3Context);

    const switchChain = async () => {
        setSwitchChainDisabled(true)
        try {
            await walletClient.switchChain({ id: sepolia.id })
        } catch (error) {
            if(error.code === 4001){
                toast.error('Network change rejected', {
                    position: toast.POSITION.TOP_RIGHT
                });
            } else {
                toast.error('Unexpected error', {
                    position: toast.POSITION.TOP_RIGHT
                });
                console.log(error)
            }
        }
        setSwitchChainDisabled(false)
    }

    const [switchChainDisabled, setSwitchChainDisabled] = useState(false);

    return(
        <div className="w-full bg-slate-600 flex">
            <h1 className="py-10 w-1/2 font-extrabold text-slate-200 text-4xl center pl-10">
                Tornado Cash Clone
            </h1>
            {isAuthenticated
                ? 
                    currentChainId === sepolia.id
                        ?
                        <>
                            <div className="w-1/2 w-fit h-fit ml-auto my-auto">
                                <p className="font-extrabold text-slate-400">
                                    <span className="inline-block font-extrabold text-slate-200 mr-2">
                                        Address:
                                    </span>
                                    {address.substring(0, 6)}...{address.substring(address.length-4, address.length)}
                                </p>
                                {
                                    balance.substring(0, 8) === "0.000000" ?
                                        <p className="font-extrabold text-slate-400">
                                            <span className="inline-block font-extrabold text-slate-200 mr-2">
                                                Balance:
                                            </span>
                                            0 ETH
                                        </p>
                                    :
                                        <p className="font-extrabold text-slate-400">
                                            <span className="inline-block font-extrabold text-slate-200 mr-2">
                                                Balance:
                                            </span>
                                            {balance.substring(0, 8)} ETH
                                        </p>
                                }
                                <p className="font-extrabold text-slate-400">
                                    <span className="inline-block font-extrabold text-slate-200 mr-2">
                                        Chain ID:
                                    </span>
                                    {currentChainId}
                                </p>
                            </div>
                            <button onClick={disconnect} className="w-1/2 w-fit h-fit ml-10 my-auto mr-10 bg-yellow-300 p-3 rounded-lg text-black hover:bg-yellow-500">
                                Disconnect
                            </button>
                        </>
                        :   switchChainDisabled ?
                            <>
                                <div className="w-1/2 w-fit h-fit ml-auto my-auto">
                                    <p className="font-extrabold text-slate-400">
                                        <span className="inline-block font-extrabold text-slate-200 mr-2">
                                            Address:
                                        </span>
                                        {address.substring(0, 6)}...{address.substring(address.length-4, address.length)}
                                    </p>
                                    <p className="font-extrabold text-slate-400">
                                        <span className="inline-block font-extrabold text-slate-200 mr-2">
                                            Chain ID:
                                        </span>
                                        {currentChainId}
                                    </p>
                                </div>
                                <button disabled className="w-1/2 w-fit h-fit ml-10 my-auto mr-10 bg-yellow-200 p-3 rounded-lg text-black cursor-not-allowed">
                                    Switch chain
                                </button>
                            </>
                            
                            :
                            <>
                                <div className="w-1/2 w-fit h-fit ml-auto my-auto">
                                    <p className="font-extrabold text-slate-400">
                                        <span className="inline-block font-extrabold text-slate-200 mr-2">
                                            Address:
                                        </span>
                                        {address.substring(0, 6)}...{address.substring(address.length-4, address.length)}
                                    </p>
                                    <p className="font-extrabold text-slate-400">
                                        <span className="inline-block font-extrabold text-slate-200 mr-2">
                                            Chain ID:
                                        </span>
                                        {currentChainId}
                                    </p>
                                </div>
                                <button onClick={switchChain} className="w-1/2 w-fit h-fit ml-10 my-auto mr-10 bg-yellow-400 p-3 rounded-lg text-black hover:bg-yellow-500">
                                    Switch chain
                                </button>
                            </>
                :
                <button onClick={connectWallet} className="w-1/2 w-fit h-fit ml-auto my-auto mr-10 bg-yellow-300 p-3 rounded-lg text-black hover:bg-yellow-500">
                    Connect wallet
                </button>
            }
        </div>
    )
}

export default Navbar;