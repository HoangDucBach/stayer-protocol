"use client";

import { MarketStatsCard } from "@/app/(dashboard)/_components/MarketStatsCard";
import { StackProps, VStack } from "@chakra-ui/react";
import { PositionCard } from "./PositionCard";
import { AnimatePresence, motion } from "framer-motion";

type Props = StackProps;

export function LeftPanel(props: Props) {
  return (
    <AnimatePresence mode="wait">
      <VStack w="full" h="full" gap={8} {...props}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ width: "100%" }}
        >
          <MarketStatsCard />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ width: "100%" }}
        >
          <PositionCard />
        </motion.div>
      </VStack>
    </AnimatePresence>
  );
}
