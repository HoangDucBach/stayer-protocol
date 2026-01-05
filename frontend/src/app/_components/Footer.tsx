"use client";

import { Favicon } from "@/components/globals/Favicon";
import siteConfig from "@/configs/site";
import {
  chakra,
  Heading,
  HStack,
  HTMLChakraProps,
  Text,
  VStack,
} from "@chakra-ui/react";

interface Props extends HTMLChakraProps<"footer"> {}
export function Footer(props: Props) {
  return (
    <chakra.footer p={"4"} w={"full"} {...props}>
      <HStack justify={"space-between"} align={"center"} w={"full"} h={"full"}>
        <Favicon size={"sm"} />
        <VStack align={"start"} justify={"center"} gap={"0"} flex={1}>
          <Heading as="h6" size="sm" fontWeight={"semibold"}>
            {siteConfig.app.name}
          </Heading>
          <Text fontSize={"xs"} color={"fg.subtle"}>
            Liquid Staking Protocol & Collateralized Debt Position
          </Text>
        </VStack>
        <Text fontSize={"xs"} color={"fg.subtle"}>
          Wynn Chill Lab © 2025
        </Text>
      </HStack>
    </chakra.footer>
  );
}
