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
import { formatCompact, formatCurrency } from "@/utils";

type Props = {
  validator: string;
  onBack?: () => void;
};

export function UnstakeForm({ validator, onBack }: Props) {
  const [amount, setAmount] = useState("");
  const balance = "2,340";
  const receiveAmount = "1,150";
  const unbondingTime = "≈ 14 hours";

  const handleMaxClick = () => {
    setAmount(balance);
  };

  const handleUnstake = () => {
    console.log("Unstaking:", amount);
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
              placeholder="Amount to unstake"
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
            <Text fontSize="2xl" fontWeight="semibold" color="fg.inverted">
              ySCSPR
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.inverted">
            Balance {formatCompact(balance)} ySCSPR
          </Text>
        </VStack>

        <Image
          src="/assets/yscspr-token-icon.svg"
          alt="ySCSPR Token Icon"
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
          <HStack gap={1.5}>
            <Text fontSize="sm" color="fg">
              {receiveAmount}
            </Text>
            <Image
              src="/assets/cspr-token-icon.svg"
              alt="CSPR Token Icon"
              w={4}
              h={4}
            />
          </HStack>
        }
      />

      {/* Validator */}
      <InfoLine
        leftText="Validator"
        rightNode={
          <HStack gap={2}>
            <Image
              src="/assets/yscpr-token-icon.svg"
              alt="Validator Icon"
              w={4}
              h={4}
            />
            <Text fontSize="sm" color="fg" textDecoration="underline">
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
