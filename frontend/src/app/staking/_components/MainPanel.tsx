"use client";

import { Box, BoxProps, Heading, HStack } from "@chakra-ui/react";
import { StakeTabs } from "../../dashboard/_components/StakeWidget";

type Props = BoxProps;

export function MainPanel(props: Props) {
  return (
    <Box w="full" maxW="600px" h="full" {...props}>
      <Heading size="2xl" mb={8} textAlign="center" fontWeight="bold">
        <HStack justify="center" gap={2} flexWrap="wrap">
          <Box as="span" color="fg.default">
            Stake
          </Box>
          <Box as="span" color="red.500">
            CSPR
          </Box>
          <Box as="span" color="fg.default">
          </Box>
          <Box as="span" color="primary.fg">
            ySCSPR
          </Box>
        </HStack>
      </Heading>
      <StakeTabs />
    </Box>
  );
}
