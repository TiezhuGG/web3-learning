import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useMarketplace } from "@/hooks/useMarketplace";
import { parseEther } from "viem";
import { LoadingSpinner } from "./ui/spinner";
import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";

type FormDataType = {
  tokenId: string;
  price: string;
};

const initialFormData = {
  tokenId: "",
  price: "",
};
export default function ListForm({ formState }: { formState?: string }) {
  const {
    listNFT,
    isListing,
    updateNFT,
    isUpdating,
    cancelNFT,
    cancelListing,
  } = useMarketplace();
  const { isApproving } = useMintRandomNFT();

  const [formData, setFormData] = useState<FormDataType>(initialFormData);

  const handleListItem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormData(initialFormData);
      if (formState === "update") {
        await updateNFT(BigInt(formData.tokenId), parseEther(formData.price));
      } else {
        await listNFT(BigInt(formData.tokenId), parseEther(formData.price));
      }
    } catch (error) {
      setFormData({
        tokenId: formData.tokenId,
        price: formData.price,
      });
    }
  };

  return (
    <form
      onSubmit={handleListItem}
      className="bg-gray-800 p-5 rounded-lg flex flex-col justify-between"
    >
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">
          {formState === "update"
            ? "Update"
            : formState === "cancel"
            ? "Cancel"
            : "List"}{" "}
          Your NFT
        </h4>
        <input
          type="number"
          name="tokenId"
          placeholder="Token ID"
          value={formData?.tokenId}
          onChange={(e) =>
            setFormData({
              ...formData,
              [e.target.name]: e.target.value,
            })
          }
          className="w-full p-2 mb-3 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue"
        />

        {formState !== "cancel" && (
          <input
            type="number"
            name="price"
            step="0.01"
            placeholder="Price (ETH)"
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                [e.target.name]: e.target.value,
              })
            }
            className="w-full p-2 mb-4 bg-gray-800 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        )}
      </div>
      <Button
        type="submit"
        disabled={
          isListing ||
          isApproving ||
          isUpdating ||
          !formData.tokenId ||
          !formData.price
        }
        className="text-white rounded-lg"
      >
        {isListing || isApproving || isUpdating
          ? "Processing..."
          : formState === "update"
          ? "Update NFT"
          : formState === "cancel"
          ? "Cancel NFT"
          : "List NFT"}
        {(isListing || isApproving || isUpdating) && <LoadingSpinner />}
        {/* {isApprovingTx || isApproving || isListingItem || isListItemConfirming
          ? "Processing..."
          : "List Item"}
        {(isApprovingTx ||
          isApproving ||
          isListingItem ||
          isListItemConfirming) && <LoadingSpinner />} */}
      </Button>
    </form>
  );
}
