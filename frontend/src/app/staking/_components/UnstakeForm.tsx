"use client";

import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  IconButton,
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
      <Box bg="bg.emphasized" borderRadius="4xl" p={4} position="relative">
        <Text fontSize="xl" color="fg.inverted">
          Amount
        </Text>

        <HStack gap={3} align="center">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1,000"
            fontSize="2xl"
            fontWeight="bold"
            border="none"
            bg="transparent"
            color="fg.inverted"
            _placeholder={{ color: "fg.inverted", opacity: 0.7 }}
            _focus={{ outline: "none", boxShadow: "none" }}
            flex={1}
            px={0}
          />
          <Text fontSize="2xl" fontWeight="bold" color="fg.inverted">
            | ySCSPR
          </Text>
          <IconButton
            aria-label="Max"
            bg="red.500"
            color="white"
            borderRadius="full"
            size="lg"
            _hover={{ bg: "red.600" }}
            onClick={handleMaxClick}
            fontSize="xl"
            fontWeight="bold"
          >
            C
          </IconButton>
        </HStack>

        <Text fontSize="md" color="fg.inverted">
          Balance {balance} ySCSPR
        </Text>
      </Box>

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
      <InfoLine
        leftText="Unbonding takes"
        rightText={unbondingTime}
      />

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
