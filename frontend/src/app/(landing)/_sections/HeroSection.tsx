"use client";

import { LinkButton } from "@/components/ui/link-button";
import {
  Center,
  chakra,
  Heading,
  HStack,
  HTMLChakraProps,
  Image,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Header } from "../_components/Header";
import { Logo } from "@/components/globals/Logo";

interface Props extends HTMLChakraProps<"section"> {}
export function HeroSection({ children, ...rest }: Props) {
  return (
    <chakra.section w={"full"} h={"96vh"} {...rest}>
      <HStack w={"full"} h={"full"} align={"start"} gap={"8"}>
        <Center w={"fit"} h={"full"}>
          <Image
            h={"full"}
            aspectRatio={"576/781"}
            rounded={"4xl"}
            src="/assets/stayer-primary-poster.png"
          />
        </Center>
        <VStack
          w={"full"}
          h={"full"}
          align={"start"}
          justify={"space-between"}
          flex={1}
        >
          <Header />
          <VStack
            align={"start"}
            gap={"4"}
            justify={"center"}
            flexGrow={1}
            p={"4"}
          >
            <Heading as="h1" size={["6xl", "7xl"]} fontWeight={"bold"}>
              Stake Smart, <br />
              Earn More
            </Heading>
            <Text fontSize={"lg"} color={"fg.subtle"} maxW={"3/4"}>
              Liquid staking protocol on Casper Network with performance-based
              rewards & USD borrowing
            </Text>
            <LinkButton href="/dashboard">Explore</LinkButton>
          </VStack>
          <Stack
            w={"full"}
            align={"center"}
            gap={"8"}
            direction={["column", "column", "row"]}
          >
            <Logo
              size={"lg"}
              nameProps={{
                fontWeight: "bold",
                fontSize: ["2xl", "3xl", "5xl", "6xl"],
              }}
            />
            <Heading as="h6" size="sm" fontWeight={"normal"}>
              Liquid Staking Protocol & <br /> Stablecoin
            </Heading>
          </Stack>
        </VStack>
      </HStack>
    </chakra.section>
  );
}
