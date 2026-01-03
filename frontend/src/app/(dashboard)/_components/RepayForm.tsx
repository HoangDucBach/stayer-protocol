"use client";

import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  IconButton,
  Image,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { InfoLine } from "./InfoLine";
import { FormCard } from "./FormCard";
import { HiArrowLeft } from "react-icons/hi";
import { formatCurrency, formatPercentage } from "@/utils";

export function RepayForm() {
  const [amount, setAmount] = useState("");
  const balance = 5561;
  const newDebt = "2500";
  const apr = "0.07";


  const handleBorrow = () => {
    console.log("Borrowing:", amount);
  };

  return (
    <FormCard>
      {/* Amount Input Box */}
      <HStack bg="bg.emphasized" borderRadius="3xl" p={3} position="relative">
        <VStack align="stretch" flex={1} gap={1}>
          <Text fontSize="md" color="fg.inverted">
            Amount
          </Text>

          <HStack gap={3} align="center">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Repay amount"
              fontSize="2xl"
              fontWeight="semibold"
              border="none"
              bg="transparent"
              color="fg.inverted"
              _placeholder={{ color: "fg.inverted", opacity: 0.7 }}
              _focus={{ outline: "none", boxShadow: "none" }}
              flex={1}
              px={0}
            />
            <Text fontSize="2xl" fontWeight="bold" color="fg.inverted">
              | cUSD
            </Text>
          </HStack>
          <Text fontSize="md" color="fg.inverted">
            Max capacity {formatCurrency(balance)}
          </Text>
        </VStack>

        <Image
          src="/assets/cusd-token-icon.svg"
          alt="cUSD Token Icon"
          w="64px"
          h="64px"
          p={2}
          bg="bg"
          borderRadius="full"
        />
      </HStack>

      <InfoLine
        leftText="New debt"
        rightNode={
          <HStack gap={1.5}>
            <Text fontSize="sm" color="fg">
              {newDebt}
            </Text>
            <Image
              src="/assets/yscspr-token-icon.svg"
              alt="yCSPR Token Icon"
              w={4}
              h={4}
            />
          </HStack>
        }
      />

      <InfoLine leftText="APR" rightText={formatPercentage(parseFloat(apr), 1)} />

      <Button
        size="xl"
        bg="primary.solid"
        color="primary.contrast"
        fontWeight="bold"
        fontSize="lg"
        borderRadius="2xl"
        mt={2}
        _hover={{ opacity: 0.9 }}
        onClick={handleBorrow}
        py={7}
        w="full"
      >
        Borrow
      </Button>
    </FormCard>
  );
}
