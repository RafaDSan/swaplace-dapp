import { getBlockchainTimestamp, getTokenAmountOrId } from "./blockchain-utils";
import { MockERC20Abi, MockERC721Abi } from "./abi";
import {
  ERC20,
  ERC20WithTokenAmountSelection,
  ERC721,
  EthereumAddress,
  Token,
  TokenType,
} from "../shared/types";
import { getTokenUri } from "../service/getTokenUri";
import { UserConfiguration } from "../service/verifyTokenOwnershipAndParseTokenData";
import { publicClient } from "../wallet/wallet-config";
import { type WalletClient } from "wagmi";
import { getContract } from "viem";

export interface Asset {
  addr: `0x${string}`;
  amountOrId: bigint;
}

export interface Swap {
  owner: string;
  config: bigint;
  biding: Asset[];
  asking: Asset[];
}

export interface ICreateSwap {
  walletClient: WalletClient;
  expireDate: bigint;
  searchedUserTokensList: Token[];
  authenticatedUserTokensList: Token[];
  validatedAddressToSwap: string;
  authenticatedUserAddress: EthereumAddress;
  chain: number;
}

export type TokenWithSwapInfo = {
  tokenAddress: `0x${string}`;
  amountOrId: bigint;
};

export interface IApproveTokenSwap {
  walletClient: WalletClient;
  tokenContractAddress: `0x${string}`;
  spender: `0x${string}`;
  amountOrId: bigint;
  chainId: number;
  token: Token;
  onWalletConfirmation: () => void;
}

export enum TimeStampDate {
  ONE_DAY = 24 * 60 * 60 * 1000,
  ONE_WEEK = ONE_DAY * 7,
  ONE_MONTH = ONE_WEEK * 4,
  SIX_MONTH = ONE_MONTH * 6,
  ONE_YEAR = SIX_MONTH * 2,
}

export function getTokenInfoBeforeSwap(token: Token): TokenWithSwapInfo {
  const amountOrId = getTokenAmountOrId(token);

  const contractAddress = token.contract;

  if (amountOrId == undefined || contractAddress == undefined) {
    throw new Error(`Invalid token swap info: ${JSON.stringify(token)}`);
  } else {
    return {
      tokenAddress: contractAddress as `0x${string}`,
      amountOrId: amountOrId,
    };
  }
}

export const makeAsset = async (
  addr: string,
  amountOrId: bigint,
): Promise<Asset> => {
  // validate if its an ethereum address
  try {
    new EthereumAddress(addr);
  } catch {
    throw new Error("InvalidAddressFormat");
  }

  // if the amount is negative, it will throw an error
  if (BigInt(amountOrId) < 0n) {
    throw new Error("AmountOrIdCannotBeNegative");
  }

  /**
   * @dev Create a new Asset type described by the contract interface.
   *
   * NOTE: If the amount is in number format, it will be converted to bigint.
   * EVM works with a lot of decimals and might overload using number type.
   */
  const asset: Asset = {
    addr: addr as `0x${string}`,
    amountOrId,
  };

  return asset;
};

export async function fromTokensToAssets(
  tokensList: Token[],
): Promise<Asset[]> {
  const tokenAssetArray: Asset[] = [];
  const assetPromisesArray: Promise<void>[] = [];

  for (let i = 0; i < tokensList.length; i += 1) {
    const addr = tokensList[i]?.contract as `0x${string}`;
    const amountOrId = getTokenAmountOrId(tokensList[i]);

    if (amountOrId !== undefined && addr !== undefined) {
      const assetPromise = makeAsset(addr, amountOrId).then((asset) => {
        tokenAssetArray.push(asset);
      });
      assetPromisesArray.push(assetPromise);
    }
  }

  await Promise.all(assetPromisesArray);

  return tokenAssetArray;
}

export async function getSwapConfig(
  owner: EthereumAddress,
  encodeConfigData: bigint,
  expiry: bigint,
  biding: Asset[],
  asking: Asset[],
  chainId: number, // To Do remove thee chainId in params
) {
  // check for the current `block.timestamp` because `expiry` cannot be in the past
  const timestamp = await getBlockchainTimestamp(chainId);
  if (expiry < timestamp) {
    throw new Error("InvalidExpiry");
  }

  /**
   * @dev one of the swapped assets should never be empty or it should be directly
   * transfered using {ERC20-transferFrom} or {ERC721-safeTransferFrom}
   *
   * NOTE: if the purpose of the swap is to transfer the asset directly using Swaplace,
   * then any small token quantity should be used as the swap asset.
   */
  if (biding.length == 0 || asking.length == 0) {
    throw new Error("InvalidAssetsLength");
  }

  const swap: Swap = {
    owner: owner.address,
    config: encodeConfigData,
    biding: biding,
    asking: asking,
  };

  return swap;
}

/**
 * @dev Facilitate to create a swap when the swap is too large.
 *
 * Directly composing swaps to avoid to calling {ISwapFactory-makeAsset}
 * multiple times.
 *
 * NOTE:
 *
 * - This function is not implemented in the contract.
 * - This function needs to be async because it calls for `block.timestamp`.
 *
 * Requirements:
 *
 * - `owner` cannot be the zero address.
 * - `expiry` cannot be in the past timestamp.
 * - `bidingAddr` and `askingAddr` cannot be empty.
 * - `bidingAddr` and `bidingAmountOrId` must have the same length.
 * - `askingAddr` and `askingAmountOrId` must have the same length.
 */
export async function composeSwap(
  owner: any,
  config: any,
  expiry: bigint,
  bidingAddr: any[],
  bidingAmountOrId: any[],
  askingAddr: any[],
  askingAmountOrId: any[],
) {
  // lenght of addresses and their respective amounts must be equal
  if (
    bidingAddr.length != bidingAmountOrId.length ||
    askingAddr.length != askingAmountOrId.length
  ) {
    throw new Error("InvalidAssetsLength");
  }

  // push new assets to the array of bids and asks
  const biding: any[] = [];
  bidingAddr.forEach(async (addr, index) => {
    biding.push(await makeAsset(addr, bidingAmountOrId[index]));
  });

  const asking: any[] = [];
  askingAddr.forEach(async (addr, index) => {
    asking.push(await makeAsset(addr, askingAmountOrId[index]));
  });

  const chainId = 0;

  return await getSwapConfig(owner, config, expiry, biding, asking, chainId); // To Do remove thee chainId in params
}

export function getTokensInfoBeforeSwap(
  tokensList: Token[],
): TokenWithSwapInfo[] {
  const tokensWithInfo: TokenWithSwapInfo[] = [];

  for (let i = 0; i < tokensList.length; i++) {
    let nftAmountOrTokenId = undefined;

    switch (tokensList[i].tokenType) {
      case TokenType.ERC20:
        if ((tokensList[i] as ERC20).rawBalance) {
          nftAmountOrTokenId = (tokensList[i] as ERC20).rawBalance;
        }
      case TokenType.ERC721:
        if (tokensList[i]?.id as unknown as number) {
          nftAmountOrTokenId = tokensList[i]?.id as unknown as number;
        }
    }

    const tokenContractAddress = tokensList[i]?.contract as `0x${string}`;

    if (
      nftAmountOrTokenId !== undefined &&
      tokenContractAddress !== undefined
    ) {
      tokensWithInfo.push({
        tokenAddress: tokenContractAddress,
        amountOrId: BigInt(nftAmountOrTokenId),
      });
    }
  }

  return tokensWithInfo;
}

export const addPrefixToIPFSLInk = (link: string) => {
  if (link.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${link.substring(7)}`;
  } else {
    return link;
  }
};

export const fetchTokenERC721Metadata = async (
  chainId: number,
  tokenId: string,
) => {
  const metadata: string = await getTokenUri(BigInt(tokenId), chainId);
  const updatedMetadata = addPrefixToIPFSLInk(metadata);

  const fetchJSONFromIPFSLink = async (ipfsLink: string) => {
    if (ipfsLink.startsWith("https://ipfs.io/")) {
      const response = await fetch(ipfsLink);
      const json = await response.json();
      return json;
    } else {
      return ipfsLink;
    }
  };

  const JSONDataIPFS = await fetchJSONFromIPFSLink(updatedMetadata);
  const IPFSMetadata = addPrefixToIPFSLInk(JSONDataIPFS.image);

  return { IPFSMetadata, JSONDataIPFS };
};

export const getArrayOfTokensFromArrayOfAssets = async (
  tokens: Asset[],
  user: UserConfiguration,
): Promise<Token[]> => {
  // Use map to transform tokens into an array of promises
  const promises = tokens.map((token) =>
    getERC20OrERC721MetadataBlockchain(token, user),
  );

  // Wait for all promises to resolve
  const newTokensList = await Promise.all(promises);

  return newTokensList;
};

async function getERC20OrERC721MetadataBlockchain(
  token: Asset,
  user: UserConfiguration,
): Promise<ERC20WithTokenAmountSelection | ERC721> {
  const contractERC20 = getContract({
    address: token.addr,
    publicClient: publicClient({ chainId: user.chainId }),
    abi: MockERC20Abi,
  });

  const contractERC721 = getContract({
    address: token.addr,
    publicClient: publicClient({ chainId: user.chainId }),
    abi: MockERC721Abi,
  });

  const hasDecimals = (await contractERC20.read.decimals([])) as number;
  if (hasDecimals) {
    const tokenBalance = (await contractERC20.read.balanceOf([
      user.address.address,
    ])) as bigint;
    const tokenName = (await contractERC20.read.name([])) as string;
    const tokenSymbol = (await contractERC20.read.symbol([])) as string;
    return {
      tokenType: TokenType.ERC20,
      name: tokenName,
      logo: "",
      symbol: tokenSymbol,
      contract: token.addr,
      rawBalance: token.amountOrId,
      tokenAmount: tokenBalance,
      decimals: hasDecimals,
    };
  } else {
    const tokenName = (await contractERC721.read.name([])) as string;
    const tokenSymbol = (await contractERC721.read.symbol([])) as string;
    const tokenMetadata = await fetchTokenERC721Metadata(
      user.chainId,
      token.amountOrId.toString(),
    );

    return {
      tokenType: TokenType.ERC721,
      name: tokenName,
      symbol: tokenSymbol,
      uri: tokenMetadata.IPFSMetadata,
      contract: token.addr,
      metadata: {},
    };
  }
}
