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
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InfoLine } from "./InfoLine";
import { FormCard } from "./FormCard";
import { HiArrowLeft } from "react-icons/hi";
import { formatCompact, formatAddress } from "@/utils";
import { useGetAccount, useGetCurrentEra } from "@/app/(dashboard)/hooks/useCasper";
import {
  useGetValidator,
  useGetNetworkPAvg,
} from "@/app/(dashboard)/hooks/useValidatorRegistry";
import { useStake, useGetExchangeRate } from "@/app/(dashboard)/hooks/useLiquidStaking";
import { useClickRef } from "@make-software/csprclick-ui";
import BigNumber from "bignumber.js";
import { motion } from "framer-motion";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { SelectedValidator } from "./StakeWidget";
import { LIQUID_STAKING_CONSTANTS } from "@/configs/constants";

type Props = {
  validator: SelectedValidator;
  onBack?: () => void;
  onStakeComplete?: (txHash: string) => void;
};

const MOTE_RATE = new BigNumber(1_000_000_000);

const stakeSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => /^\d*\.?\d+$/.test(val), "Must be a valid number")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0")
    .refine(
      (val) => parseFloat(val) >= LIQUID_STAKING_CONSTANTS.MIN_STAKE_CSPR,
      `Minimum stake is ${LIQUID_STAKING_CONSTANTS.MIN_STAKE_CSPR} CSPR`
    )
    .refine(
      (val) => parseFloat(val) <= LIQUID_STAKING_CONSTANTS.MAX_STAKE_CSPR,
      `Maximum stake is ${LIQUID_STAKING_CONSTANTS.MAX_STAKE_CSPR.toLocaleString()} CSPR`
    ),
});

type StakeFormData = z.infer<typeof stakeSchema>;

export function StakeForm({ validator, onBack, onStakeComplete }: Props) {
  const clickRef = useClickRef();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StakeFormData>({
    resolver: zodResolver(stakeSchema),
    defaultValues: {
      amount: "",
    },
  });

  const amount = watch("amount");
  const { data: accountBalance } = useGetAccount(
    clickRef?.currentAccount?.public_key || ""
  );
  const { data: validatorData } = useGetValidator(validator.publicKey);

  const { data: networkPAvg } = useGetNetworkPAvg();
  const { data: currentEra } = useGetCurrentEra();
  const { data: exchangeRate } = useGetExchangeRate();  

  const stakeMutation = useStake({
    options: {
      onSuccess: (hash) => {
        toaster.create({
          title: "Stake Successful",
          description: `Transaction hash: ${hash}`,
          type: "success",
        });
        // Trigger completion callback
        if (onStakeComplete) {
          onStakeComplete(hash);
        }
      },
      onError: (error) => {
        toaster.create({
          title: "Stake Failed",
          description: error.message,
          type: "error",
        });
      },
    },
  });

  const balance = useMemo(() => {
    if (!accountBalance?.balance) return "0";
    return new BigNumber(accountBalance.balance)
      .dividedBy(MOTE_RATE)
      .toFixed(2);
  }, [accountBalance]);
  const unbondingTime = "14 hours";

  // Calculate validator multiplier
  const multiplier = useMemo(() => {
    if (!validatorData?.p_score || !networkPAvg) return 1;
    return validatorData.p_score / networkPAvg;
  }, [validatorData, networkPAvg]);

  // Calculate receive amount with multiplier and exchange rate
  const receiveAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || !exchangeRate) return "0";

    const amountBN = new BigNumber(amount);
    const exchangeRateBN = new BigNumber(exchangeRate).dividedBy(MOTE_RATE);
    const multiplierBN = new BigNumber(multiplier);

    // Base ySCSPR = amount / exchange_rate
    // With multiplier: ySCSPR = (amount / exchange_rate) * multiplier
    const yscspr = amountBN
      .dividedBy(exchangeRateBN)
      .multipliedBy(multiplierBN);

    return yscspr.toFixed(2);
  }, [amount, exchangeRate, multiplier]);

  const bonusAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || !exchangeRate) return "+0";

    const amountBN = new BigNumber(amount);
    const exchangeRateBN = new BigNumber(exchangeRate).dividedBy(MOTE_RATE);
    const multiplierBN = new BigNumber(multiplier);
    const baseYSCSPR = amountBN.dividedBy(exchangeRateBN);
    const bonus = baseYSCSPR.multipliedBy(multiplierBN.minus(1));

    return bonus.isGreaterThan(0) ? `+${bonus.toFixed(2)}` : "+0";
  }, [amount, exchangeRate, multiplier]);

  const isValidAmount = useMemo(() => {
    if (!amount || amount === "0") return false;
    const amountBN = new BigNumber(amount);
    const balanceBN = new BigNumber(balance);
    return amountBN.isGreaterThan(0) && amountBN.isLessThanOrEqualTo(balanceBN);
  }, [amount, balance]);


  const onSubmit = async (data: StakeFormData) => {
    if (!isValidAmount || !currentEra) {
      toaster.create({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        type: "error",
      });
      return;
    }

    stakeMutation.mutate({
      validatorPublicKey: validator.publicKey,
      amount: amount,
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
                  CSPR
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.inverted">
                Balance {formatCompact(balance)} CSPR
              </Text>
            </VStack>

            <Image
              src="/assets/yscspr-token-icon.svg"
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
              <HStack gap={1.5}>
                <Text fontSize="sm" color="fg">
                  {receiveAmount}
                </Text>
                <Text fontSize="sm" color="primary.fg">
                  ({bonusAmount} bonus)
                </Text>
                <Avatar
                  src="/assets/yscspr-token-icon.svg"
                  size="2xs"
                />
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
            disabled={!isValidAmount || stakeMutation.isPending}
            loading={stakeMutation.isPending}
            py={7}
            w="full"
          >
            {stakeMutation.isPending ? "Staking..." : "Stake"}
          </Button>
        </FormCard>
      </form>
    </motion.div>
  );
}
