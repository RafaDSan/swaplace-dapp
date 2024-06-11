import { ForWhom } from "../03-organisms";
import { SwapContext } from "@/lib/client/contexts";
import { ADDRESS_ZERO } from "@/lib/client/constants";
import { EthereumAddress } from "@/lib/shared/types";
import { useContext, useState } from "react";
import cc from "classcat";

export const SwappingSearchTab = () => {
  const [activeTab, setIsActiveTab] = useState(ForWhom.Their);

  // PUBLIC OFFER
  const {
    setValidatedAddressToSwap,
    setAnyUserToSwap,
    validatedAddressToSwap,
  } = useContext(SwapContext);
  interface SwappingSearchTab {
    id: number;
    name: string;
  }

  const swappingTabs: Array<SwappingSearchTab> = [
    {
      id: ForWhom.Yours,
      name: "User",
    },
    {
      id: ForWhom.Their,
      name: "Public offer",
    },
  ];

  const handleTabChange = (tabId: number) => {
    setIsActiveTab(tabId);

    switch (tabId) {
      case ForWhom.Yours:
        console.log("User");
        setAnyUserToSwap(false);
        setValidatedAddressToSwap(null);
        setValidatedAddressToSwap(validatedAddressToSwap);
        break;
      case ForWhom.Their:
        console.log("Public offer");
        setAnyUserToSwap(true);
        setValidatedAddressToSwap(new EthereumAddress(ADDRESS_ZERO));
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex gap-[6px]">
      {swappingTabs.map((tab) => {
        return (
          <div
            key={tab.id}
            className={cc([
              activeTab === tab.id && "dark:bg-[#DDF23D]",
              "flex cursor-pointer rounded-lg py-2 px-3 justify-center items-center dark:p-medium-bold-variant-black w-[100px]",
            ])}
            role="tab"
            onClick={() => {
              handleTabChange(tab.id);
            }}
          >
            <div className="flex items-center justify-center contrast-50">
              {tab.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};
