# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

write a contract named SimpleStorage.sol and
write a SimpleStorage.js under directory ignition/modules.

```shell
npm install
npx hardhat compile
```

create a .env file and add the following:

```shell
ALCHEMY_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
```

hardhat.config.js example:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_URL = process.env.ALCHEMY_SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: SEPOLIA_URL,
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },
  },
};
```

deploy the contract to sepolia network
run the following command:

```shell
npx hardhat ignition deploy ./ignition/modules/SimpleStorage.js --network sepolia
```

add the etherscan apiKey to hardhat.config.js to verify the contract on etherscan:

```javascript
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  },
```
