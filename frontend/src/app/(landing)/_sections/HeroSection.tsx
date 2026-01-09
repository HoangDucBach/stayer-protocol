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
import { motion } from "framer-motion";
import { Header } from "../_components/Header";
import { Logo } from "@/components/globals/Logo";

// Create motion components
const MotionCenter = motion.create(Center);
const MotionVStack = motion.create(VStack);
const MotionHeading = motion.create(Heading);
const MotionText = motion.create(Text);
const MotionStack = motion.create(Stack);

// Animation variants
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeInLeftVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

interface Props extends HTMLChakraProps<"section"> {}
export function HeroSection({ children, ...rest }: Props) {
  return (
    <chakra.section w={"full"} h={"96vh"} {...rest}>
      <HStack w={"full"} h={"full"} align={"start"} gap={"8"}>
        <MotionCenter
          w={"fit"}
          h={"full"}
          initial="hidden"
          animate="visible"
          variants={fadeInLeftVariants}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            h={"full"}
            aspectRatio={"576/781"}
            rounded={"4xl"}
            src="/assets/stayer-primary-poster.png"
          />
        </MotionCenter>
        <VStack
          w={"full"}
          h={"full"}
          align={"start"}
          justify={"space-between"}
          flex={1}
        >
          <Header />
          <MotionVStack
            align={"start"}
            gap={"4"}
            justify={"center"}
            flexGrow={1}
            p={"4"}
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
          >
            <MotionHeading
              as="h1"
              size={["6xl", "7xl"]}
              fontWeight={"bold"}
              variants={fadeInUpVariants}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              Stake Smart, <br />
              Earn More
            </MotionHeading>
            <MotionText
              fontSize={"lg"}
              color={"fg.subtle"}
              maxW={"3/4"}
              variants={fadeInUpVariants}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              Liquid staking protocol on Casper Network with performance-based
              rewards & USD borrowing
            </MotionText>
            <motion.div
              variants={fadeInUpVariants}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <LinkButton href="/dashboard">Explore</LinkButton>
            </motion.div>
          </MotionVStack>
          <MotionStack
            w={"full"}
            align={"center"}
            gap={"8"}
            direction={["column", "column", "row"]}
            initial="hidden"
            animate="visible"
            variants={scaleInVariants}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
          </MotionStack>
        </VStack>
      </HStack>
    </chakra.section>
  );
}
