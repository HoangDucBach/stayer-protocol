"use client";
import { useStake } from "@/app/(dashboard)/hooks/useLiquidStaking";
import { useGetNetworkPAvg } from "@/app/(dashboard)/hooks/useValidatorRegistry";
import { Box, Heading, StackProps, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { MarketStatsCard } from "../../_components/MarketStatsCard";
import { formatCurrency } from "@/utils";

const MotionBox = motion.create(Box);
const MotionHeading = motion.create(Heading);
const MotionText = motion.create(Text);

interface Props extends StackProps {}
export function MarketOverviewBoard(props: Props) {
  const { data, error } = useGetNetworkPAvg();
  const stakeMutation = useStake();

  useEffect(() => {
    console.log("Network PAvg data:", data);
    if (error) {
      console.error("Error fetching Network PAvg data:", error);
    }
  }, [data, error]);

  return (
    <VStack
      flex={1}
      h={"full"}
      rounded={"3xl"}
      justifyContent={"space-between"}
      alignItems={"start"}
      bg={"primary"}
      p={"8"}
    >
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <MotionHeading
          as="h2"
          size="6xl"
          fontWeight={"bold"}
          color={"fg.inverted"}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          MARKET OVERVIEW
        </MotionHeading>
        <MotionText
          fontSize={"4xl"}
          fontWeight={"semibold"}
          color={"fg"}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          TVL: {formatCurrency(1740000, 2).toUpperCase()}
        </MotionText>
      </MotionBox>
      <motion.div
        style={{ width: "100%" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      >
        <MarketStatsCard p={0} />
      </motion.div>
    </VStack>
  );
}
