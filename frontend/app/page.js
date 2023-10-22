"use client"

import Navbar from "@/components/Navbar";
import { useState, useRef } from "react";
import { ethers } from "ethers";
import { uint256ToBin, uint256ToHex, reverseCoordinate } from "@/helperFunctions";
import { createWalletClient, custom, createPublicClient, http, decodeEventLog } from "viem"
import { sepolia } from 'viem/chains'
import { contractAddress, contractABI } from "@/constants";
import Script from "next/script";

const wc = require("../circuit/witness_calculator.js")

export default function Home() {

  const deposit = async () => {
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

    // TODO: remove this part
    const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum)
    })

    const publicClient = createPublicClient({ 
        chain: sepolia,
        transport: http()
    })

    const address = await walletClient.requestAddresses()
    //


    console.log(commitment)
    try {
      const txHash = await walletClient.writeContract({
        account: address[0],
        address: contractAddress,
        abi: contractABI,
        functionName: "deposit",
        args: [commitment],
        value: value
      })

      await publicClient.waitForTransactionReceipt( { hash: txHash })

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

      setProofString(btoa(JSON.stringify(proofElements)));

    } catch (error) {
      alert("Error encountered")
      console.log(error)
    }

  }

  const copyProof = () => {
    navigator.clipboard.writeText(proofString);
  }

  const withdraw = async () => {
    var inputProof = proofContent.current.value
    if(inputProof == ""){ alert("Please input the proof of deposit string.")}

    try{
      const proofElements = JSON.parse(atob(inputProof));
      const SnarkJS = window["snarkjs"]

      // TODO remove this part
      const walletClient = createWalletClient({
          chain: sepolia,
          transport: custom(window.ethereum)
      })

      const publicClient = createPublicClient({ 
          chain: sepolia,
          transport: http()
      })

      const address = await walletClient.requestAddresses()
      //

      const withdrawInputs = {
        "root": proofElements.root,
        "nullifierHash": proofElements.nullifierHash,
        "recipient": ethers.BigNumber.from(address[0]).toString(),
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
          account: address[0],
          address: contractAddress,
          abi: contractABI,
          functionName: "withdraw",
          args: calldata,
        })
  
        await publicClient.waitForTransactionReceipt( { hash: txHash })
  
        const txReceipt = await publicClient.getTransactionReceipt({ 
          hash: txHash
        })
  
        console.log(txReceipt)
  
      } catch (error) {
        alert("Error encountered")
        console.log(error)
      }
      

    }catch(e){
      alert("Something went wrong")
      console.log(e);
    }

  }

  const [proofString, setProofString] = useState("");
  const proofContent = useRef(null);

  return (
    <div>
      <Script src="/snarkjs.min.js"/>
      <Navbar />
      <button className="bg-orange-600" onClick={deposit}>
        Deposit 1 ETH
      </button>
      <p>{proofString.substring(0,10)}...{proofString.substring(proofString.length-11,proofString.length-1)}</p>
      <button className="bg-orange-600" onClick={copyProof}>
        Copy proof
      </button>
      <button className="bg-orange-600" onClick={withdraw}>
        Withdraw 1 ETH
      </button>
      <textarea className="bg-orange-600" ref={proofContent}></textarea>
    </div>
  )
}
