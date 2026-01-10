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
import { formatCurrency, formatPercentage } from "@/utils";
import { useClickRef } from "@make-software/csprclick-ui";
import { useGetPosition, useGetVaultParams, useRepay } from "@/app/(dashboard)/hooks/useStayerVault";
import { useBalanceOf as useCUSDBalance } from "@/app/(dashboard)/hooks/useCUSD";
import BigNumber from "bignumber.js";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";

const MOTE_RATE = new BigNumber(1_000_000_000);

const repaySchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => /^\d*\.?\d+$/.test(val), "Must be a valid number")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
});

type RepayFormData = z.infer<typeof repaySchema>;

export function RepayForm() {
  const clickRef = useClickRef();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RepayFormData>({
    resolver: zodResolver(repaySchema),
    defaultValues: {
      amount: "",
    },
  });

  const amount = watch("amount");

  // Fetch user position
  const { data: position } = useGetPosition(
    clickRef?.currentAccount?.public_key || "",
    { options: { enabled: !!clickRef?.currentAccount } }
  );

  // Fetch vault parameters
  const { data: vaultParams } = useGetVaultParams();

  // Fetch cUSD balance
  const { data: cusd_balance } = useCUSDBalance(
    clickRef?.currentAccount?.public_key || "",
    { options: { enabled: !!clickRef?.currentAccount } }
  );

  // Repay mutation
  const repayMutation = useRepay({
    options: {
      onSuccess: (hash) => {
        toaster.create({
          title: "Repay Successful",
          description: `Transaction hash: ${hash}`,
          type: "success",
        });
      },
      onError: (error) => {
        toaster.create({
          title: "Repay Failed",
          description: error.message,
          type: "error",
        });
      },
    },
  });

  // Current cUSD balance
  const balance = useMemo(() => {
    if (!cusd_balance) return "0";
    return new BigNumber(cusd_balance).dividedBy(MOTE_RATE).toFixed(2);
  }, [cusd_balance]);

  // Current debt
  const currentDebt = useMemo(() => {
    if (!position?.debt) return "0";
    return new BigNumber(position.debt).dividedBy(MOTE_RATE).toFixed(2);
  }, [position]);

  // Calculate new debt after repayment
  const newDebt = useMemo(() => {
    if (!amount || isNaN(Number(amount))) return currentDebt;
    
    const debtBN = new BigNumber(currentDebt);
    const repayAmount = new BigNumber(amount);
    const remaining = debtBN.minus(repayAmount);
    
    return remaining.isGreaterThan(0) ? remaining.toFixed(2) : "0";
  }, [amount, currentDebt]);

  // Stability fee as APR
  const apr = useMemo(() => {
    if (!vaultParams?.stability_fee) return "0";
    return (vaultParams.stability_fee / 100).toFixed(2);
  }, [vaultParams]);

  // Validation
  const isValidAmount = useMemo(() => {
    if (!amount || amount === "0") return false;
    const amountBN = new BigNumber(amount);
    const balanceBN = new BigNumber(balance);
    const debtBN = new BigNumber(currentDebt);
    
    // Amount must be > 0, <= balance, and <= current debt
    return amountBN.isGreaterThan(0) && 
           amountBN.isLessThanOrEqualTo(balanceBN) && 
           amountBN.isLessThanOrEqualTo(debtBN);
  }, [amount, balance, currentDebt]);

  const handleMaxClick = () => {
    // Max is the minimum of balance and current debt
    const maxRepay = BigNumber.min(balance, currentDebt);
    setValue("amount", maxRepay.toFixed(2));
  };

  const onSubmit = async (data: RepayFormData) => {
    if (!isValidAmount) {
      toaster.create({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        type: "error",
      });
      return;
    }

    repayMutation.mutate({
      cusdAmount: amount,
      waitForConfirmation: false,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
    <FormCard>
      {/* Amount Input Box */}
      <HStack bg="bg.emphasized" borderRadius="3xl" p={3} position="relative">
        <VStack align="stretch" flex={1} gap={1}>
          <Text fontSize="md" color="fg.inverted">
            Amount
          </Text>

          <HStack gap={3} align="center">
            <Input
              {...register("amount")}
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
              onKeyDown={(e) => {
                if (
                  ["Backspace", "Delete", "Tab", "Escape", "Enter", "."].includes(e.key) ||
                  (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) ||
                  ["Home", "End", "ArrowLeft", "ArrowRight"].includes(e.key)
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />                
            <Text fontSize="2xl" fontWeight="semibold" color="fg.inverted">
              cUSD
            </Text>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text fontSize="md" color="fg.inverted">
              Balance {formatCurrency(Number(balance))} | Debt {formatCurrency(Number(currentDebt))}
            </Text>
            <Button
              size="xs"
              variant="ghost"
              color="fg.inverted"
              onClick={handleMaxClick}
              _hover={{ opacity: 0.7 }}
            >
              MAX
            </Button>
          </HStack>
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
        type="submit"
        size="xl"
        bg="primary.solid"
        color="primary.contrast"
        fontWeight="bold"
        fontSize="lg"
        borderRadius="2xl"
        mt={2}
        _hover={{ opacity: 0.9 }}
        disabled={!isValidAmount || repayMutation.isPending}
        loading={repayMutation.isPending}
        py={7}
        w="full"
      >
        {repayMutation.isPending ? "Repaying..." : "Repay"}
      </Button>
    </FormCard>
    </form>
  );
}
