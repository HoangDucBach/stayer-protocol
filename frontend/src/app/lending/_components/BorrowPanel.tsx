"use client";

import { Box, BoxProps, Heading, HStack } from "@chakra-ui/react";
import { BorrowWidget } from "../../(dashboard)/_components/BorrowWidget";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";

type Props = BoxProps;

export function BorrowPanel(props: Props) {
  return (
    <AnimatePresence mode="wait">
        <Box w="full" h="full" {...props}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <Heading size="4xl" mb={1} textAlign="left" fontWeight="semibold">
              Borrow Stablecoin
            </Heading>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: +10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <BorrowWidget />
          </motion.div>
        </Box>

    </AnimatePresence>
  );
}
