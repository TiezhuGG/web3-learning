import { PinataSDK } from "pinata";
import path from "path";
import fs from "fs";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_JWT,
  pinataGateway: "example-gateway.mypinata.cloud",
});

export async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  console.log("上传图片到pinata", files);
}

export async function storeTokenUriMetadata() {}

