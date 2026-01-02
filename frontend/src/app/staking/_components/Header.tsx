"use client";

import { Box, Button, HStack, Icon, IconButton, Image } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { HiMenu } from "react-icons/hi";

const WalletConnect = dynamic(
  () =>
    import("../../_components/WalletConnect").then((mod) => ({
      default: mod.WalletConnect,
    })),
  { ssr: false }
);

export function Header() {
  return (
    <HStack
      as="header"
      w="full"
      justify="space-between"
      align="center"
      px={{ base: 4, md: 8 }}
      py={4}
    >
      {/* Logo */}
      <Box>
        <Image src="/assets/favicon.svg" alt="Logo" h={10} />
      </Box>

      {/* Menu Button */}
      <Button
        variant="ghost"
        display={{ base: "none", md: "flex" }}
        color="fg.default"
      >
        Open menu
      </Button>

      {/* Mobile Menu */}
      <IconButton
        aria-label="Open menu"
        variant="ghost"
        display={{ base: "flex", md: "none" }}
      >
        <Icon as={HiMenu} />
      </IconButton>

      {/* Wallet Connect */}
      <Box>
        <WalletConnect />
      </Box>
    </HStack>
  );
}
