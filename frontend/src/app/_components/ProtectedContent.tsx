"use client";

import { Box, Button, Center, Skeleton } from "@chakra-ui/react";
import { useClickRef } from "@make-software/csprclick-ui";
import { ReactNode } from "react";

interface ProtectedContentProps {
  children: ReactNode;
  blurAmount?: string;
}

export function ProtectedContent({
  children,
  blurAmount = "8px",
}: ProtectedContentProps) {
  const clickRef = useClickRef();

  if (!clickRef) {
    return (
      <Box position="relative" w="full" h="full">
        <Skeleton w="full" h="full" minH="400px" />
      </Box>
    );
  }

  if (!clickRef.currentAccount) {
    return (
      <Box position="relative" w="full" h="full">
        {/* Blurred content */}
        <Box
          filter={`blur(${blurAmount})`}
          pointerEvents="none"
          userSelect="none"
        >
          {children}
        </Box>

        {/* Overlay with Connect Wallet button */}
        <Center
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.400"
          backdropFilter="blur(2px)"
        >
          <Button
            size="xl"
            bg="primary.solid"
            color="primary.contrast"
            fontWeight="bold"
            fontSize="lg"
            borderRadius="2xl"
            px={8}
            py={7}
            _hover={{ opacity: 0.9 }}
            onClick={() => clickRef.signIn()}
          >
            Connect Wallet
          </Button>
        </Center>
      </Box>
    );
  }

  return <>{children}</>;
}
