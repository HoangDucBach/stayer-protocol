"use client";

import { chakra, HTMLChakraProps } from "@chakra-ui/react";
import dynamic from "next/dynamic";

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
      }}
    >
      <h1>Dashboard Header</h1>
      <WalletConnect />
    </chakra.header>
  );
}
