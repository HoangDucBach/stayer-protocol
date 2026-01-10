"use client";

import { HStack, Skeleton } from "@chakra-ui/react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const ValidatorList = dynamic(
  () => import("./_components/ValidatorList").then((mod) => mod.ValidatorList),
  {
    ssr: false,
    loading: () => <Skeleton height="full" flex={1} borderRadius="3xl" />,
  }
);

const MarketOverviewBoard = dynamic(
  () =>
    import("./_components/MarketOverviewBoard").then(
      (mod) => mod.MarketOverviewBoard
    ),
  {
    ssr: false,
    loading: () => <Skeleton height="full" flex={1} borderRadius="3xl" />,
  }
);

const MotionHStack = motion.create(HStack);

export default function Page() {
  return (
    <MotionHStack
      w={"full"}
      height={"full"}
      gap={"54px"}
      pl={"4"}
      pr={"8"}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.15 }}
    >
      <motion.div
        style={{ flex: 1, height: "100%" }}
        variants={{
          hidden: { opacity: 0, x: -30 },
          visible: { opacity: 1, x: 0 },
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <MarketOverviewBoard />
      </motion.div>
      <motion.div
        style={{ flex: 1, height: "100%" }}
        variants={{
          hidden: { opacity: 0, x: 30 },
          visible: { opacity: 1, x: 0 },
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <ValidatorList />
      </motion.div>
    </MotionHStack>
  );
}
