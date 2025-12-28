import siteConfig from "@/configs/site";
import {
  CONTENT_MODE,
  CsprClickInitOptions,
  WALLET_KEYS,
} from "@make-software/csprclick-core-types";

export const clickOptions: CsprClickInitOptions = {
  appName: siteConfig.app.name,
  appId: "csprclick-template",
  contentMode: CONTENT_MODE.IFRAME,
  providers: [
    WALLET_KEYS.CASPER_WALLET,
    WALLET_KEYS.LEDGER,
    WALLET_KEYS.METAMASK_SNAP,
  ],
};
