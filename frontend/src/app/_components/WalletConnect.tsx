"use client";
import { Button, StackProps } from "@chakra-ui/react";
import { useClickRef } from "@make-software/csprclick-ui";
import { useEffect } from "react";

import { MenuContent, MenuRoot, MenuTrigger } from "@/components/ui/menu";
import { formatAddress } from "@/utils";

interface Props extends StackProps {}

export function WalletConnect(props: Props) {
  const clickRef = useClickRef();

  useEffect(() => {
    clickRef?.on("csprclick:signed_in", async (evt) => {});
    clickRef?.on("csprclick:signed_out", async (evt) => {
      // update your app accordingly
    });
  }, [clickRef?.on]);

  if (!clickRef.isConnected) {
    return (
      <Button
        onClick={() => {
          if (!clickRef) {
            console.error("clickRef is null - CSPRClick not initialized");
            return;
          }

          console.log("Connecting wallet...");
          clickRef.signIn();
        }}
      >
        Connect wallet
      </Button>
    );
  }

  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <Button>
          {clickRef.currentAccount?.name ||
            formatAddress(clickRef.currentAccount?.public_key || "")}
        </Button>
      </MenuTrigger>
      <MenuContent></MenuContent>
    </MenuRoot>
  );
}
