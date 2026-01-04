"use client";

import {
  Button,
  Skeleton,
  StackProps,
  Text,
  VStack,
  HStack,
  Icon,
  Box,
} from "@chakra-ui/react";
import { useClickRef } from "@make-software/csprclick-ui";
import { useEffect, useState } from "react";
import { HiOutlineLogout, HiOutlineClipboardCopy } from "react-icons/hi";

import { MenuContent, MenuRoot, MenuTrigger, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { formatAddress } from "@/utils";

interface Props extends StackProps {}

export function WalletConnect(props: Props) {
  const clickRef = useClickRef();
  const [account, setAccount] = useState(clickRef?.currentAccount || null);

  useEffect(() => {
    if (!clickRef) return;

    const handleSignIn = () => setAccount(clickRef.currentAccount);
    const handleSignOut = () => setAccount(null);

    clickRef.on("csprclick:signed_in", handleSignIn);
    clickRef.on("csprclick:signed_out", handleSignOut);

    // Cleanup listeners on unmount
    return () => {
      clickRef.off("csprclick:signed_in", handleSignIn);
      clickRef.off("csprclick:signed_out", handleSignOut);
    };
  }, [clickRef]);

  // While Click SDK is loading
  if (!clickRef) {
    return <Skeleton height="40px" width="150px" rounded="lg" />;
  }

  // If no account connected
  if (!account) {
    return (
      <Button
        onClick={() => {
          if (!clickRef) return;
          try {
            clickRef.signIn();
          } catch (err) {
            console.error("Failed to connect wallet:", err);
          }
        }}
      >
        Connect wallet
      </Button>
    );
  }

  const publicKey = account.public_key || "";
  const accountName = account.name || formatAddress(publicKey);

  return (
    <MenuRoot >
      <MenuTrigger asChild>
        <Button>
          {accountName || formatAddress(publicKey)}
        </Button>
      </MenuTrigger>

      <MenuContent>
        <VStack align="stretch" gap={0}>
          {/* Account Info */}
          <Box px={4} py={3}>
            <Text fontSize="xs" color="fg.muted" mb={1}>
              Connected Account
            </Text>
            <Text fontSize="sm" fontWeight="semibold">
              {accountName}
            </Text>
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              {formatAddress(publicKey)}
            </Text>
          </Box>

          <MenuSeparator />

          {/* Copy Address */}
          <MenuItem
            value="copy"
            onClick={(e) => {
              e.preventDefault();
              if (publicKey) navigator.clipboard.writeText(publicKey);
            }}
          >
            <HStack gap={2}>
              <Icon as={HiOutlineClipboardCopy} />
              <Text>Copy Address</Text>
            </HStack>
          </MenuItem>

          <MenuSeparator />

          {/* Disconnect */}
          <MenuItem
            value="disconnect"
            onClick={(e) => {
              e.preventDefault();
              try {
                clickRef.signOut();
              } catch (err) {
                console.error("Failed to disconnect wallet:", err);
              }
            }}
          >
            <HStack gap={2}>
              <Icon as={HiOutlineLogout} />
              <Text>Disconnect</Text>
            </HStack>
          </MenuItem>
        </VStack>
      </MenuContent>
    </MenuRoot>
  );
}
