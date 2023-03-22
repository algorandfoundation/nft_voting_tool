export const getWalletAddresses = (snapshotFile: string | undefined) => {
  return snapshotFile?.split("\n") ?? [];
};

export const getWalletLabel = (address: string) => `${address.substring(0, 5)}...${address.substring(address.length - 5)}`;

export const getIsAllowedToVote = (address: string, allowList: string[]) => !allowList.length || allowList.includes(address);
