import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm";
import { ABI, CONTRACT_ADDRESS } from "./constants.js";

const connectBtn = document.getElementById("connectButton");
const fundBtn = document.getElementById("fundButton");
const ethAmountInput = document.getElementById("ethAmount");
const getBalanceBtn = document.getElementById("getBalance");
const withdrawBtn = document.getElementById("withdraw");
connectBtn.onclick = connect;
fundBtn.onclick = fund;
getBalanceBtn.onclick = getBalance;
withdrawBtn.onclick = withdraw;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      document.getElementById("connectButton").innerHTML = "Connected";
    } catch (error) {
      console.error("User rejected connection:", error);
    }
  } else {
    console.log("MetaMask not installed");
    document.getElementById("connectButton").innerHTML =
      "Please install MetaMask";
  }
}

async function fund() {
  const ethAmount = ethAmountInput.value;
  console.log(`Funding with ${ethAmount} ETH`);

  if (typeof window.ethereum !== "undefined") {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    try {
      const transactionResponse = await contract.fund({
        value: ethers.parseEther(ethAmount),
      });
      //   await transactionResponse.wait();
      await listenForTransactionMine(transactionResponse, provider);
      console.log("transactionResponse success", transactionResponse);
    } catch (error) {}
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = getProvider();
    const balance = await provider.getBalance(CONTRACT_ADDRESS);
    console.log("Contract Address Balance:", ethers.formatEther(balance));
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    console.log("Withdrawing...");
    const provider = getProvider();
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    try {
      const transactionResponse = await contract.withdraw();
      listenForTransactionMine(transactionResponse, provider);

      console.log("Withdrawal successful:", transactionResponse);
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  }
}

function getProvider() {
  return new ethers.BrowserProvider(window.ethereum);
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`);

  return new Promise(async (resolve, reject) => {
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log("transactionReceipt", transactionReceipt);

      resolve();
    });
  });
}
