"use client";

import { formatPercentage } from "@/utils";
import {
  Box,
  Button,
  Heading,
  HStack,
  Image,
  StackProps,
  Text,
  VStack,
} from "@chakra-ui/react";

type Props = StackProps;

export function PositionCard(props: Props) {
  const handleAddCollateral = () => {
    // Implement the logic to add collateral here
  };

  return (
    <VStack
      w="full"
      h="fit-content"
      bg="bg.subtle"
      borderRadius="4xl"
      p="8"
      gap={6}
      align="start"
      {...props}
    >
      <Heading size="4xl" mb={1} textAlign="left" fontWeight="semibold">
        Position
      </Heading>
      <HStack w="full" justify="space-between">
        <StatItem
          label="Total Deposits"
          value="10,000 USDC"
          estimateMoneyValue="$10,000"
          imageUrl="/assets/yscspr-token-icon.svg"
        />
        <StatItem
          label="Total Borrows"
          value="2,500 USDC"
          estimateMoneyValue="$2,500"
          imageUrl="/assets/cusd-token-icon.svg"
        />
      </HStack>
      <StatusBar currentPercentage={0.7} />
      <Button size="md" onClick={handleAddCollateral}>
        Add Collateral
      </Button>
    </VStack>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  estimateMoneyValue?: string;
  imageUrl?: string;
  imageAlt?: string;
}

const StatItem = ({
  label,
  value,
  estimateMoneyValue,
  imageUrl,
  imageAlt,
}: StatItemProps) => {
  return (
    <VStack align="start" gap={1}>
      <Heading size="md" color="#AEA28E">
        {label}
      </Heading>
      <HStack gap={4}>
        <Heading size="2xl">{value}</Heading>
        <Image src={imageUrl} alt={imageAlt || "img"} boxSize="32px" />
      </HStack>
      <Text fontSize="md" color="fg">
        ≈ {estimateMoneyValue}
      </Text>
    </VStack>
  );
};

interface StatusBarProps {
  currentPercentage?: number;
}

const StatusBar = ({ currentPercentage }: StatusBarProps) => {
  const levelText = () => {
    if (currentPercentage === undefined) return "Safe";
    if (currentPercentage >= 0.7) return "Safe";
    if (currentPercentage > 0.4) return "Warning";
    return "Critical";
  };

  const levelColor = () => {
    if (currentPercentage === undefined) return "green.400";
    if (currentPercentage >= 0.7) return "green.500";
    if (currentPercentage > 0.4) return "yellow.500";
    return "red.400";
  };

  const pct = formatPercentage(currentPercentage || 0, 0);

  return (
    <HStack w="full" gap={4}>
      <Text fontSize="xs" fontWeight="medium" color={levelColor()}>
        {levelText()}
      </Text>
      <Box
        bg="#FCE5CF"
        flex={1}
        h="8px"
        borderRadius="4px"
        overflow="hidden"
        w="full"
      >
        <Box
          bg={levelColor()}
          h="8px"
          borderTopLeftRadius="4px"
          borderBottomLeftRadius="4px"
          borderTopRightRadius={pct === "100%" ? "4px" : "0px"}
          borderBottomRightRadius={pct === "100%" ? "4px" : "0px"}
          w={pct}
        />
      </Box>
      <Text fontSize="xs" fontWeight="medium" color="text.fg">
        {pct}
      </Text>
    </HStack>
  );
};
