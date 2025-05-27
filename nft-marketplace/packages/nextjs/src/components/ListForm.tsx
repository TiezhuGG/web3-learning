import { useState } from "react";
import { parseEther } from "viem";
import { useMarketplace } from "@/hooks/useMarketplace";
import { LoadingSpinner } from "./ui/spinner";
import { Button } from "./ui/button";

type FormDataType = {
  tokenId: string;
  price: string;
};

const initialFormData: FormDataType = {
  tokenId: "",
  price: "",
};

export default function ListForm({ formState }: { formState?: string }) {
  const {
    listNFT,
    isListing,
    isApproving,
    updateNFT,
    isUpdating,
    cancelNFT,
    isCanceling,
  } = useMarketplace();

  const [formData, setFormData] = useState(initialFormData);

  const handleActions = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormData(initialFormData);
      if (formState === "update") {
        await updateNFT(BigInt(formData.tokenId), parseEther(formData.price));
      } else if (formState === "cancel") {
        await cancelNFT(BigInt(formData.tokenId));
      } else {
        await listNFT(BigInt(formData.tokenId), parseEther(formData.price));
      }
    } catch (error) {
      console.error(error);
      setFormData({
        tokenId: formData.tokenId,
        price: formData.price,
      });
    }
  };

  return (
    <form
      onSubmit={handleActions}
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
          min="0"
          value={formData?.tokenId}
          onChange={(e) =>
            setFormData({
              ...formData,
              [e.target.name]: e.target.value,
            })
          }
          className="w-full p-2 mb-3 border border-gray-600 rounded"
        />

        {formState !== "cancel" && (
          <input
            type="number"
            name="price"
            min="0.01"
            step="0.01"
            placeholder="Price (ETH)"
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                [e.target.name]: e.target.value,
              })
            }
            className="w-full p-2 mb-4 border border-gray-600 rounded"
          />
        )}
      </div>
      <Button
        type="submit"
        disabled={
          isListing ||
          isUpdating ||
          isCanceling ||
          !formData.tokenId ||
          (formState !== "cancel" && !formData.price)
        }
      >
        {isListing || isUpdating || isApproving
          ? "Processing..."
          : formState === "update"
          ? "Update NFT"
          : formState === "cancel"
          ? "Cancel NFT"
          : "List NFT"}
        {(isListing || isApproving || isUpdating || isCanceling) && (
          <LoadingSpinner />
        )}
      </Button>
    </form>
  );
}
