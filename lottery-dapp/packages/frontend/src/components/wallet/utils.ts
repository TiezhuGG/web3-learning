export function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text: ", error);
    return false;
  }
}

export function getFirstWord(text: string) {
  return text.slice(0, 1);
}
