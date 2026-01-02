"use client";

import { MenuContent, MenuRoot, MenuTrigger } from "@/components/ui/menu";
import {
  Box,
  Button,
  chakra,
  HStack,
  HTMLChakraProps,
  Icon,
  IconButton,
  Image,
  MenuRootProps,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { HiMenu } from "react-icons/hi";

const WalletConnect = dynamic(
  () =>
    import("../../_components/WalletConnect").then((mod) => ({
      default: mod.WalletConnect,
    })),
  { ssr: false }
);

interface HeaderProps extends HTMLChakraProps<"header"> {}

export function Header(props: HeaderProps) {
  return (
    <chakra.header
      {...props}
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "1rem",
        width: "100%",
      }}
    >
      {/* Logo */}
      <Box>
        <Image src="/assets/favicon.svg" alt="Logo" h={10} />
      </Box>

      {/* Menu Button */}
      <OpenMenu />

      {/* Mobile Menu */}
      <IconButton
        aria-label="Open menu"
        variant="ghost"
        display={{ base: "flex", md: "none" }}
      >
        <Icon as={HiMenu} />
      </IconButton>

      {/* Wallet Connect */}
      <Box w="fit-content">
        <WalletConnect />
      </Box>
    </chakra.header>
  );
}

interface OpenMenuProps extends Omit<MenuRootProps, "children"> {}

const OpenMenu = (props: OpenMenuProps) => {
  return (
    <MenuRoot {...props}>
      <MenuTrigger asChild>
        <Button
          variant="ghost"
          display={{ base: "none", md: "flex" }}
          colorPalette="fg"
        >
          <Icon as={HiMenu} mr={2} />
          Open menu
        </Button>
      </MenuTrigger>
      <MenuContent>
        {/* Menu items can be added here in the future */}
      </MenuContent>
    </MenuRoot>
  );
}