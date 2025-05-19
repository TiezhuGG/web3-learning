import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm";

const connectBtn = document.getElementById("connectButton");
const fundBtn = document.getElementById("fundButton");
connectBtn.onclick = connect;
fundBtn.onclick = fund;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    document.getElementById("connectButton").innerHTML = "Connected";
  } else {
    document.getElementById("connectButton").innerHTML =
      "Please install MetaMask";
  }
}

async function fund(ethAmount) {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log(signer);
  }
}
