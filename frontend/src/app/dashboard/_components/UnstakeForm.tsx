"use client";

import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  IconButton,
  Image,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { InfoLine } from "./InfoLine";
import { FormCard } from "./FormCard";

export function UnstakeForm() {
  const [amount, setAmount] = useState("");
  const balance = "2,340";
  const receiveAmount = "1,150";
  const validator = "0x323a...ac32";
  const unbondingTime = "≈ 14 hours";

  const handleMaxClick = () => {
    setAmount(balance);
  };

  const handleUnstake = () => {
    console.log("Unstaking:", amount);
  };

  return (
    <FormCard>
      <HStack bg="bg.emphasized" borderRadius="3xl" p={3} position="relative">
        <VStack align="stretch" flex={1} gap={1}>
          <Text fontSize="md" color="fg.inverted">
            Amount
          </Text>

          <HStack gap={3} align="center">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount to stake"
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
              | CSPR
            </Text>
          </HStack>
          <Text fontSize="md" color="fg.inverted">
            Balance {balance} CSPR
          </Text>
        </VStack>

        <Image
          src="/assets/cspr-token-icon.svg"
          alt="CSPR Token Icon"
          w="64px"
          h="64px"
          p={2}
          bg="bg"
          borderRadius="full"
        />
      </HStack>

      {/* Receive Amount */}
      <InfoLine
        leftText="Receive"
        rightNode={
          <Text fontSize="md" color="fg.default">
            {receiveAmount} CSPR
          </Text>
        }
      />

      {/* Validator */}
      <InfoLine
        leftText="Validator"
        rightNode={
          <HStack gap={2}>
            <Box w={2} h={2} borderRadius="full" bg="teal.400" />
            <Text fontSize="md" color="fg.default">
              {validator}
            </Text>
          </HStack>
        }
      />

      {/* Unbonding Time */}
      <InfoLine leftText="Unbonding takes" rightText={unbondingTime} />

      {/* Unstake Button */}
      <Button
        size="xl"
        bg="primary.solid"
        color="primary.contrast"
        fontWeight="bold"
        fontSize="lg"
        borderRadius="2xl"
        mt={2}
        _hover={{ opacity: 0.9 }}
        onClick={handleUnstake}
        py={7}
        w="full"
      >
        Unstake
      </Button>
    </FormCard>
  );
}
