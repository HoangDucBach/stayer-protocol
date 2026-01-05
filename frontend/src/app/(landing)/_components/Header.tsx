"use client";

import {
  chakra,
  For,
  HStack,
  HTMLChakraProps,
  Image,
  Link,
  Text,
} from "@chakra-ui/react";

interface Props extends HTMLChakraProps<"header"> {}
export function Header(props: Props) {
  const items = [
    {
      label: "Whitepaper",
      href: "https://stayer.finance/stayer.pdf",
    },
    {
      label: "Docs",
      href: "https://docs.stayer.finance",
    },
    {
      label: "Social",
      href: "https://x.com/StayerFinance",
    },
  ];

  return (
    <chakra.header p={"4"} w={"full"} {...props}>
      <HStack w={"full"} justify={"space-between"} gap={"4"}>
        <HStack>
          <Image
            src="/assets/casper-network-logo.png"
            alt="Casper Logo"
            h={8}
          />
          <Text fontSize=" md" color="fg.subtle">
            Build on Casper
          </Text>
        </HStack>
        <HStack gap="4">
          <For each={items}>
            {(item) => (
              <Link key={item.href} href={item.href} colorPalette="fg">
                {item.label}
              </Link>
            )}
          </For>
        </HStack>
      </HStack>
    </chakra.header>
  );
}
