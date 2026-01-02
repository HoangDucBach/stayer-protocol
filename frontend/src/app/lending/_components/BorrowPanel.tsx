"use client";

import { Box, BoxProps, Heading, HStack } from "@chakra-ui/react";
import { BorrowWidget } from "../../dashboard/_components/BorrowWidget";

type Props = BoxProps;

export function BorrowPanel(props: Props) {
  return (
    <Box w="full" h="full" {...props}>
      <Heading size="4xl" mb={1} textAlign="left" fontWeight="semibold">
          Borrow Stablecoin
      </Heading>
      <BorrowWidget />
    </Box>
  );
}
