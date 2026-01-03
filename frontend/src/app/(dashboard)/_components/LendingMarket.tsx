import { Box, HStack, Text, VStack } from "@chakra-ui/react";

export function LendingMarket() {
  return (
    <Box bg="primary.solid" borderRadius="32px" w="full" p={8}>
      <HStack justify="space-between" w="full">
        <VStack align="start" w="full">
          <TextContent text="Total Debt" value="$5,600,000" />
          <TextContent text="Liq. Threshold" value="96%" />
        </VStack>
        <VStack align="start" w="full">
          <TextContent text="Max LTV" value="6.5%" />
          <TextContent text="Stability" value="9.2%" />
        </VStack>
      </HStack>
    </Box>
  );
}

interface TextContentProps {
  text: string;
  value: string;
}

const TextContent = ({ text, value }: TextContentProps) => {
  return (
    <VStack gap={0} align="flex-start">
      <Text fontSize="2xl" fontWeight="semibold" color="fg.inverted">
        {text}
      </Text>
      <Text fontSize="2xl" fontWeight="semibold" color="fg.inverted">
        {value}
      </Text>
    </VStack>
  );
};
