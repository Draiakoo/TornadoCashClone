"use client"

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { uint256ToBin, uint256ToHex, reverseCoordinate } from "@/helperFunctions";
import { decodeEventLog } from "viem"
import { contractAddress, contractABI } from "@/constants";
import Script from "next/script";
import { toast } from 'react-toastify';
import { Web3Context } from "../context/Web3Context";
import { useContext } from "react";
import Image from "next/image";


const wc = require("../circuit/witness_calculator.js")

export default function InteractionWindow() {

  const {
    state: { isAuthenticated, address, currentChainId, walletClient, publicClient, balance },
  } = useContext(Web3Context);

  const deposit = async () => {
    setDepositButtonDisabled(true);
    const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString()
    const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString()
    const input = {
      secret: uint256ToBin(secret),
      nullifier: uint256ToBin(nullifier)
    }
    
    let res = await fetch("/deposit.wasm")
    let buffer = await res.arrayBuffer()
    let depositWC = await wc(buffer)

    const result = await depositWC.calculateWitness(input, 0)
    const commitment = result[1]
    const nullifierHash = result[2]

    const value = BigInt("100000000000000000");     // 0.1 ETH

    try {
      const txHash = await walletClient.writeContract({
        account: address,
        address: contractAddress,
        abi: contractABI,
        functionName: "deposit",
        args: [commitment],
        value: value
      })

      await publicClient.waitForTransactionReceipt({ hash: txHash })

      const txReceipt = await publicClient.getTransactionReceipt({ 
        hash: txHash
      })

      const decodedData = decodeEventLog({
        abi: contractABI,
        eventName: "Deposit",
        data: txReceipt.logs[0].data,
        topics: txReceipt.logs[0].topics
      })

      const proofElements = {
        root: decodedData.args.root.toString(),
        nullifierHash: nullifierHash.toString(),
        secret: secret,
        nullifier: nullifier,
        commitment: commitment.toString(),
        hashPairings: decodedData.args.hashPairings.map((num) => (num.toString())),
        hashDirections: decodedData.args.pairDirections
      }

      setProofString(btoa(JSON.stringify(proofElements)))
      toast.success('Your deposit has been executed successfully!', {
          position: toast.POSITION.TOP_RIGHT
      });
      setDepositButtonDisabled(false)
    } catch (error) {
      toast.error('Error depositing ETH', {
        position: toast.POSITION.TOP_RIGHT
      });
      console.log(error)
      setDepositButtonDisabled(false)
    }

  }

  const copyProof = () => {
    toast.success('Copied to clipboard!', {
      position: toast.POSITION.TOP_RIGHT
  });
    navigator.clipboard.writeText(proofString);
  }

  const withdraw = async () => {
    setWithdrawButtonDisabled(true)
    var inputProof = proofContent.current.value
    if(inputProof == ""){
      toast.error('Please input the proof of deposit string', {
          position: toast.POSITION.TOP_RIGHT
      });
      setWithdrawButtonDisabled(false)
      return;
    }

    try{
      const proofElements = JSON.parse(atob(inputProof));
      const SnarkJS = window["snarkjs"]

      const withdrawInputs = {
        "root": proofElements.root,
        "nullifierHash": proofElements.nullifierHash,
        "recipient": ethers.BigNumber.from(address).toString(),
        "secret": uint256ToBin(proofElements.secret),
        "nullifier": uint256ToBin(proofElements.nullifier),
        "hashPairings": proofElements.hashPairings,
        "hashDirections": proofElements.hashDirections
      }

      const { proof, publicSignals } = await SnarkJS.groth16.fullProve(withdrawInputs, "/withdraw.wasm", "/setup_final.zkey")

      const calldata = [
        proof.pi_a.slice(0, 2).map(uint256ToHex),
        proof.pi_b.slice(0, 2).map((row) => (reverseCoordinate(row.map(uint256ToHex)))),
        proof.pi_c.slice(0, 2).map(uint256ToHex),
        publicSignals.slice(0, 2).map(uint256ToHex)
      ]

      try {
        const txHash = await walletClient.writeContract({
          account: address,
          address: contractAddress,
          abi: contractABI,
          functionName: "withdraw",
          args: calldata,
        })

        await publicClient.waitForTransactionReceipt( { hash: txHash })
        
        const txReceipt = await publicClient.getTransactionReceipt({ 
          hash: txHash
        })
  
        setWithdrawSuccess(true)
        setWithdrawButtonDisabled(false)
        toast.success('Your withdraw has been executed successfully!', {
            position: toast.POSITION.TOP_RIGHT
        });
  
      } catch (error) {
        toast.error('Error encountered!', {
            position: toast.POSITION.TOP_RIGHT
        });
        setWithdrawButtonDisabled(false)
        console.log(error)
      }
    }catch(e){
      toast.error('Error withdrawing ETH', {
        position: toast.POSITION.TOP_RIGHT
      });
      console.log(e);
      setWithdrawButtonDisabled(false)
    }

  }

  const [depositSeleted, setDepositSelected] = useState(true);
  const [depositButtonDisabled, setDepositButtonDisabled] = useState(false);
  const [withdrawButtonDisabled, setWithdrawButtonDisabled] = useState(false);
  const [proofString, setProofString] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const proofContent = useRef(null);

  useEffect(() => {
    if(!isAuthenticated){
      setDepositButtonDisabled(true)
      setWithdrawButtonDisabled(true)
    } else {
      setDepositButtonDisabled(false)
      setWithdrawButtonDisabled(false)
    }
  }, [isAuthenticated])

  return (
    <div className="border-grey border-2 block w-2/3 h-fit mx-auto mt-20 p-10 rounded-3xl w-1/3 shadow-2xl">
      <Script src="/snarkjs.min.js"/>
      <Image 
        className="mx-auto"
        src="/logo.jpg"
        width="200"
        height="200"
      />
      <div className="flex mb-10">
        {depositSeleted ?
          <>
            <div className="w-1/2">
              <button className="text-center bg-blue-500 py-4 w-44 block mx-auto rounded-lg border-2 border-blue-700 cursor-default">Desposit</button>
            </div>
            <div className="w-1/2">
              <button className="w-1/2 text-center bg-white py-4 w-44 block mx-auto rounded-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-900 hover:text-white mx-4" onClick={() => {setDepositSelected(false)}}>Withdraw</button>
            </div>
          </>
          :
          <>
            <div className="w-1/2">
              <button className="w-1/2 text-center bg-white py-4 w-44 block mx-auto rounded-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-900 hover:text-white" onClick={() => {setDepositSelected(true)}}>Desposit</button>
            </div>
            <div className="w-1/2">
              <button className="w-1/2 text-center bg-blue-500 py-4 w-44 block mx-auto rounded-lg border-2 border-blue-700 mx-4 cursor-default">Withdraw</button>
            </div>
          </>
        }
      </div>
      {depositSeleted ?
        // Deposit section
        <>
          {
            proofString != "" ?
              <>
              <div className="bg-green-400 p-4 rounded-lg mb-4 break-words">
                <h1 className="text-green-700 font-extrabold text-xl mb-3">Generated proof</h1>
                <p className="text-green-700 font-extrabold text-sm">{proofString}</p>
              </div>
              {
                !isAuthenticated
                ?
                  <>
                    <p className="text-black mb-7 text-center">
                    Please connect your wallet to interact with the blockchain
                    </p>
                    <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed" disabled>
                      Deposit an other 0.1 ETH
                    </button>
                  </>
                :
                  currentChainId != 11155111
                  ?
                    <>
                      <p className="text-black mb-7 text-center">
                        Change to Sepolia testnet to interact with this contract
                      </p>
                      <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed" disabled>
                      Deposit an other 0.1 ETH
                      </button>
                    </>
                  : 
                  depositButtonDisabled
                    ? <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed block mx-auto" disabled>
                        Deposit an other 0.1 ETH
                      </button>
                    : <button className="bg-green-500 p-3 rounded-lg block mx-auto hover:bg-green-700 block mx-auto" onClick={deposit}>
                        Deposit an other 0.1 ETH
                      </button>
              }
              <button className="bg-orange-600 mt-4 p-2 rounded-lg block mx-auto hover:bg-orange-800" onClick={copyProof}>
                Copy proof
              </button>
              </>
            :
              <>
              {
                !isAuthenticated
                ?
                  <>
                    <p className="text-black mb-7 text-center">
                    Please connect your wallet to interact with the blockchain
                    </p>
                    <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed" disabled>
                      Deposit 0.1 ETH
                    </button>
                  </>
                :
                  currentChainId != 11155111
                  ?
                    <>
                      <p className="text-black mb-7 text-center">
                        Change to Sepolia testnet to interact with this contract
                      </p>
                      <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed" disabled>
                        Deposit 0.1 ETH
                      </button>
                    </>
                  : 
                  depositButtonDisabled
                    ? <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed block mx-auto" disabled>
                        Deposit 0.1 ETH
                      </button>
                    : <button className="bg-green-500 p-3 rounded-lg block mx-auto hover:bg-green-700 block mx-auto" onClick={deposit}>
                        Deposit 0.1 ETH
                      </button>
              }
              </>
          }
        </>
        :
        // Withdraw section
        <>
          {
            withdrawSuccess ?
              <>
                <div className="bg-green-400 p-4 rounded-lg mb-4 break-words">
                  <h1 className="text-green-700 font-extrabold text-xl mb-3">Success</h1>
                  <p className="text-green-700 font-extrabold text-sm">You have received the funds succesfully!</p>
                </div>
                <button className="bg-green-500 p-3 rounded-lg block mx-auto hover:bg-green-700" onClick={() => {setWithdrawSuccess(false)}}>
                  Make an other withdraw
                </button>
              </>
            :
              <>
                <p className="text-black mb-2">Insert your proof</p>
                <textarea className="border-2 border-black rounded-lg w-full text-black p-3" ref={proofContent}></textarea>
                {
                  !isAuthenticated
                    ?
                      <>
                        <p className="text-black mt-5 text-center">
                          Please connect your wallet to interact with the blockchain
                        </p>
                        <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed mt-5" disabled>
                          Withdraw 0.1 ETH
                        </button>
                      </>
                    :
                      currentChainId != 11155111
                        ?
                          <>
                            <p className="text-black mt-5 text-center">
                              Change to Sepolia testnet to interact with this contract
                            </p>
                            <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed mt-5" disabled>
                              Withdraw 0.1 ETH
                            </button>
                          </>
                        :
                          withdrawButtonDisabled
                            ?
                              <button className="bg-green-300 p-3 rounded-lg block mx-auto cursor-not-allowed mt-5" disabled>
                                Withdraw 0.1 ETH
                              </button>
                            :
                              <button className="bg-green-500 p-3 rounded-lg block mx-auto hover:bg-green-700 mt-3" onClick={withdraw}>
                                Withdraw 0.1 ETH
                              </button>

              }
              </>
          }
        </>
      }
      <p className="text-black text-center mt-10">
        Disclaimer: this project has been made for education purpouses only. It is not intended for money laundering, that is why it has been deployed in a testnet
      </p>
    </div>
  )
}
