export const getWalletAddresses = (snapshotFile: string | undefined) => {
  return snapshotFile?.split("\n") ?? [];
};

export const getWalletLabel = (address: string) => `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
