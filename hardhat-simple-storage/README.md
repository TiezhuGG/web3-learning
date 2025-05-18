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

deploy the contract to sepolia network and verify it
run the following command:

```shell
npx hardhat ignition deploy ./ignition/modules/SimpleStorage.js --network sepolia --verify
```

The --verify flag is optional, but it tells Hardhat Ignition to verify the contracts after a successful deployment.

If you have an existing deployment and want to verify it, you can also run the verify task directly by passing the deployment ID:
```shell
npx hardhat verify --network sepolia chain-11155111
```

also you can add the etherscan apiKey to .env and hardhat.config.js to verify the contract on etherscan:

```shell
ETHERSCAN_KEY=your_etherscan_key
```

```javascript
  import "@nomicfoundation/hardhat-verify";
  const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  sourcify: {
    enabled: true
  }
```

then run the following command to verify the contract:
```shell
npx hardhat verify --network sepolia your_contract_address
```