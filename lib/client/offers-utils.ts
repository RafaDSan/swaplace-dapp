import { Asset } from "./swap-utils";
import { EthereumAddress, Token } from "../shared/types";

export interface RawSwapOfferInterface {
  // RawSwapOfferInterface represents the object interface of a Swap Offer coming from Ponder
  swapId: string;
  status: string;
  owner: string;
  allowed: string;
  expiry: bigint;
  bid: Asset[];
  ask: Asset[];
  recipient: bigint;
  value: bigint;
}
export interface FormattedSwapOfferAssets {
  id: string;
  status: string;
  expiryDate: bigint;
  bidderAssets: {
    address: EthereumAddress;
    tokens: Asset[];
  };
  askerAssets: {
    address: EthereumAddress;
    tokens: Asset[];
  };
}

export interface PopulatedSwapOfferCard {
  id: bigint;
  status: string;
  expiryDate: bigint;
  bidderTokens: {
    address: EthereumAddress;
    tokens: Token[];
  };
  askerTokens: {
    address: EthereumAddress;
    tokens: Token[];
  };
}

export interface PageInfo {
  // PageInfo is used by useInfiniteQuery for pagination
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface PageParam {
  pageParam: string | null;
}

// export const processSwaps = async (array: any[]) => {
//   // const [isLoading, setIsLoading] = useState(true);

//   // setIsLoading(true);

//   const formattedTokensPromises = array.map(async (swap) => {
//     const askedTokensWithData = await retrieveDataFromTokensArray(
//       swap.ask.tokens,
//     );
//     const bidedTokensWithData = await retrieveDataFromTokensArray(
//       swap.bid.tokens,
//     );
//     return {
//       ...swap,
//       ask: { address: swap.ask.address, tokens: askedTokensWithData },
//       bid: {
//         address: swap.bid.address,
//         tokens: bidedTokensWithData,
//       },
//     };
//   });

//   // Wait for all promises to resolve
//   const formattedTokens = await Promise.all(formattedTokensPromises);
//   return formattedTokens;
//   // setIsLoading(false);
//   // setTokensList(formattedTokens);
// };
