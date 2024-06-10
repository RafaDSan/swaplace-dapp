import {
  ALCHEMY_PUBLIC_RPC,
  getCurrentNetworkHttpUrl,
} from "../client/constants";
import { kakarot } from "@/lib/client/wagmi-custom-chains";
import {
  sepolia,
  optimismSepolia,
  optimism,
  avalancheFuji,
  baseSepolia,
  arbitrumSepolia,
} from "@wagmi/core/chains";
import { configureChains, createConfig } from "wagmi";
import {
  trustWallet,
  ledgerWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

export const { chains, webSocketPublicClient, publicClient } = configureChains(
  [sepolia, kakarot, optimismSepolia, optimism, baseSepolia, arbitrumSepolia],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: getCurrentNetworkHttpUrl(chain.id) || ALCHEMY_PUBLIC_RPC,
      }),
    }),
  ],
);

const connectorArgs = {
  appName: "Swaplace dApp",
  chains: [
    sepolia,
    kakarot,
    optimismSepolia,
    optimism,
    avalancheFuji,
    baseSepolia,
    arbitrumSepolia,
  ],
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
};

const connectors = connectorsForWallets([
  {
    groupName: "Which wallet will you use?",
    wallets: [
      injectedWallet(connectorArgs),
      coinbaseWallet(connectorArgs),
      ledgerWallet(connectorArgs),
      trustWallet(connectorArgs),
      walletConnectWallet(connectorArgs),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

const getSiweMessageOptions = () => ({
  statement: "Swaplace dApp",
});

export interface AccountProps {
  account: {
    address: string;
    balanceDecimals?: number;
    balanceFormatted?: string;
    balanceSymbol?: string;
    displayBalance?: string;
    displayName: string;
    ensAvatar?: string;
    ensName?: string;
    hasPendingTransactions: boolean;
  };
}

export { wagmiConfig, getSiweMessageOptions };
