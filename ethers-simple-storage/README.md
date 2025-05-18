## 私钥管理

1. 创建.env 文件，添加私钥信息，格式如下：

```bash
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
PRIVATE_PASSWORD=<your_password>
```

2. 创建 encryptKey 脚本，用于加密私钥，会生成一个 .encryptedKey.json 文件，内容为加密后的私钥信息，encryptKey.js 代码如下：

```javascript
import { ethers } from "ethers";
import fs from "fs";
import "dotenv/config";

async function main() {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const encryptedJsonKey = await wallet.encrypt(
    process.env.PRIVATE_KEY_PASSWORD
  );
  console.log(encryptedJsonKey);
  fs.writeFileSync("./.encryptedKey.json", encryptedJsonKey);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

之后就可以把.env 的 PRIVATE_KEY 和 PRIVATE_KEY_PASSWORD 删除了，但是要记住 PRIVATE_KEY_PASSWORD，运行 deploy 的时候要用到。

#### 部署合约

需要在命令行使用 PRIVATE_KEY_PASSWORD：

```bash
PRIVATE_KEY_PASSWORD=<your_password> node deploy.js
```

部署合约代码如下：
```javascript
import { ethers } from "ethers";
import fs from "fs";
import "dotenv/config";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  // const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const encryptedJson = fs.readFileSync("./.encryptedKey.json", "utf-8");
  console.log(encryptedJson);
  const wallet = new ethers.Wallet.fromEncryptedJson(
    encryptedJson,
    process.env.PRIVATE_KEY_PASSWORD
  );
  wallet = await wallet.connect(provider);

  const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf8");
  const binary = fs.readFileSync(
    "./SimpleStorage_sol_SimpleStorage.bin",
    "utf8"
  );
  const contractFactory = new ethers.ContractFactory(abi, binary, wallet);
  console.log("Deploying, please wait...");

  const contract = await contractFactory.deploy();
  console.log(contract.deploymentTransaction);

  await contract.deployTransaction.wait(1);
  console.log(transactionReceipt);

  const currentFavoriteNumber = await contract.retrieve();
  console.log(`Current Favorite Number: ${currentFavoriteNumber}`);
  const transactionResponse = await contract.store("7");
  const transactionReceipt = await transactionResponse.wait(1);
  const updatedFavoriteNumber = await contract.retrieve();
  console.log(`Updated Favorite Number: ${updatedFavoriteNumber}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```
