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
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { InfoLine } from "./InfoLine";
import { FormCard } from "./FormCard";
import { formatCompact, formatAddress } from "@/utils";
import { useClickRef } from "@make-software/csprclick-ui";
import { useBalanceOf } from "@/app/(dashboard)/hooks/useYSCSPR";
import { useUnstake, useGetExchangeRate } from "@/app/(dashboard)/hooks/useLiquidStaking";
import { useGetAccount, useGetCurrentEra } from "@/app/(dashboard)/hooks/useCasper";
import BigNumber from "bignumber.js";
import { motion } from "framer-motion";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { SelectedValidator } from "./StakeWidget";

type Props = {
  validator: SelectedValidator;
  onBack?: () => void;
};

type UnstakeFormData = {
  amount: string;
};

const MOTE_RATE = new BigNumber(1_000_000_000);

export function UnstakeForm({ validator, onBack }: Props) {
  const clickRef = useClickRef();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UnstakeFormData>({
    defaultValues: {
      amount: "",
    },
  });

  const amount = watch("amount");

  // const { data: yscspr_balance } = useBalanceOf(
  //   clickRef?.currentAccount?.public_key || "",
  //   { options: { enabled: !!clickRef?.currentAccount } }
  // );
  const { data: yscspr_balance } = useGetAccount(
    clickRef?.currentAccount?.public_key || ""
  )
  const { data: currentEra } = useGetCurrentEra();
  const { data: exchangeRate } = useGetExchangeRate();

  const unstakeMutation = useUnstake({
    options: {
      onSuccess: (hash) => {
        toaster.create({
          title: "Unstake Successful",
          description: `Transaction hash: ${hash}`,
          type: "success",
        });
      },
      onError: (error) => {
        toaster.create({
          title: "Unstake Failed",
          description: error.message,
          type: "error",
        });
      },
    },
  });
  console.log(yscspr_balance);

  const balance = useMemo(() => {
    if (!yscspr_balance) return "0";

    return new BigNumber(0).dividedBy(MOTE_RATE).toFixed(2);
  }, [yscspr_balance]);
  const unbondingTime = "14 hours";

  const receiveAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || !exchangeRate) return "0";

    const amountBN = new BigNumber(amount);
    const exchangeRateBN = new BigNumber(exchangeRate).dividedBy(MOTE_RATE);

    const cspr = amountBN.multipliedBy(exchangeRateBN);

    return cspr.toFixed(2);
  }, [amount, exchangeRate]);

  const isValidAmount = useMemo(() => {
    if (!amount || amount === "0") return false;
    const amountBN = new BigNumber(amount);
    const balanceBN = new BigNumber(balance);
    return amountBN.isGreaterThan(0) && amountBN.isLessThanOrEqualTo(balanceBN);
  }, [amount, balance]);

  const handleMaxClick = () => {
    setValue("amount", balance);
  };

  const onSubmit = async (data: UnstakeFormData) => {
    if (!isValidAmount || !currentEra) {
      toaster.create({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        type: "error",
      });
      return;
    }

    unstakeMutation.mutate({
      validatorPublicKey: validator.publicKey,
      yscspr_amount: amount,
      currentEra,
      waitForConfirmation: false,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          {/* Amount Input Box */}
          <HStack
            bg="bg.emphasized"
            borderRadius="3xl"
            p={3}
            position="relative"
          >
            <VStack align="stretch" flex={1} gap={1}>
              <Text fontSize="md" color="fg.inverted">
                Amount
              </Text>

              <HStack gap={3} align="center">
                <Input
                  {...register("amount")}
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
                  onKeyDown={(e) => {
                    // Allow: backspace, delete, tab, escape, enter, decimal point
                    if (
                      [
                        "Backspace",
                        "Delete",
                        "Tab",
                        "Escape",
                        "Enter",
                        ".",
                      ].includes(e.key) ||
                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      (e.ctrlKey &&
                        ["a", "c", "v", "x"].includes(e.key.toLowerCase())) ||
                      // Allow: home, end, left, right
                      ["Home", "End", "ArrowLeft", "ArrowRight"].includes(e.key)
                    ) {
                      return;
                    }
                    // Prevent if not a number
                    if (!/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
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
                <Avatar src="/assets/yscspr-token-icon.svg" size="2xs" />
              </HStack>
            }
          />

          {/* Validator */}
          <InfoLine
            leftText="Validator"
            rightNode={
              <HStack gap={2}>
                <Avatar
                  src={
                    validator.logo ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${validator.publicKey}`
                  }
                  size="2xs"
                />
                <Text fontSize="sm" color="fg" textDecoration="underline">
                  {validator.formattedAddress}
                </Text>
              </HStack>
            }
          />

          {/* Unbonding Time */}
          <InfoLine leftText="Unbonding takes" rightText={unbondingTime} />

          {/* Unstake Button */}
          <Button
            type="submit"
            size="xl"
            bg="primary.solid"
            color="primary.contrast"
            fontWeight="bold"
            fontSize="lg"
            borderRadius="2xl"
            mt={2}
            _hover={{ opacity: 0.9 }}
            disabled={!isValidAmount || unstakeMutation.isPending}
            loading={unstakeMutation.isPending}
            py={7}
            w="full"
          >
            {unstakeMutation.isPending ? "Unstaking..." : "Unstake"}
          </Button>
        </FormCard>
      </form>
    </motion.div>
  );
}
