"use client";

import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
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
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { HiMenu } from "react-icons/hi";

const WalletConnect = dynamic(
  () =>
    import("./WalletConnect").then((mod) => ({
      default: mod.WalletConnect,
    })),
  { ssr: false }
);

interface HeaderProps extends HTMLChakraProps<"header"> {}

export function Header(props: HeaderProps) {
  return (
    <chakra.header
      {...props}
      position="relative"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem",
        width: "98%",
      }}
    >
      {/* Logo */}
      <NextLink href="/dashboard">
        <Image src="/assets/favicon.svg" alt="Logo" h={10} />
      </NextLink>

      {/* Centered Menu Button */}
      <Box
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        zIndex={1}
        display={{ base: "none", md: "block" }}
      >
        <OpenMenu />
      </Box>

      {/* Mobile Menu */}
      <IconButton
        aria-label="Open menu"
        variant="ghost"
        display={{ base: "flex", md: "none" }}
      >
        <Icon as={HiMenu} />
      </IconButton>

      {/* Wallet Connect */}
      <Box w="fit-content" ml="auto">
        <WalletConnect />
      </Box>
    </chakra.header>
  );
}

interface OpenMenuProps extends Omit<MenuRootProps, "children"> {}

const OpenMenu = (props: OpenMenuProps) => {
  const router = useRouter();
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
        {links.map((link) => (
          <MenuItem
            key={link.href}
            value={link.label}
            onSelect={router.push.bind(null, link.href)}
          >
            {link.label}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuRoot>
  );
};

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Staking", href: "/staking" },
  { label: "Lending", href: "/lending" },
];
