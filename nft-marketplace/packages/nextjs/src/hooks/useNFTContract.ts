import { useCallback } from 'react'
import { parseEther } from 'viem'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'

// 这里需要替换为实际部署后的合约地址
const NFT_CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS'
const NFT_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "mintNft",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestNft",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokenCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export function useNFTContract() {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { data: tokenCounter } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'getTokenCounter',
  })

  const mintBasicNFT = useCallback(async () => {
    if (!address) throw new Error('No wallet connected')
    
    const hash = await writeContractAsync({
      address: NFT_CONTRACT_ADDRESS,
      abi: NFT_CONTRACT_ABI,
      functionName: 'mintNft',
    })
    
    return hash
  }, [address, writeContractAsync])

  const mintRandomNFT = useCallback(async () => {
    if (!address) throw new Error('No wallet connected')
    
    const hash = await writeContractAsync({
      address: NFT_CONTRACT_ADDRESS,
      abi: NFT_CONTRACT_ABI,
      functionName: 'requestNft',
      value: parseEther('0.001'), // 这里的值需要根据合约中设置的mintFee来调整
    })
    
    return hash
  }, [address, writeContractAsync])

  return {
    tokenCounter,
    mintBasicNFT,
    mintRandomNFT,
  }
} 