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
import { useGetPosition, useGetVaultParams, useBorrow } from "@/app/hooks/useStayerVault";
import { useBalanceOf as useYSCSPRBalance } from "@/app/hooks/useYSCSPR";
import { useGetPrice } from "@/app/hooks/usePriceOracle";
import BigNumber from "bignumber.js";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";

const MOTE_RATE = new BigNumber(1_000_000_000);

const borrowSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => /^\d*\.?\d+$/.test(val), "Must be a valid number")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
});

type BorrowFormData = z.infer<typeof borrowSchema>;

export function BorrowForm() {
  const clickRef = useClickRef();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BorrowFormData>({
    resolver: zodResolver(borrowSchema),
    defaultValues: {
      amount: "",
    },
  });

  const amount = watch("amount");

  const { data: position } = useGetPosition(
    clickRef?.currentAccount?.public_key || "",
    { options: { enabled: !!clickRef?.currentAccount } }
  );

  const { data: vaultParams } = useGetVaultParams();
  const { data: yscspr_balance } = useYSCSPRBalance(
    clickRef?.currentAccount?.public_key || "",
    { options: { enabled: !!clickRef?.currentAccount } }
  );

  const { data: cspr_price } = useGetPrice();

  const borrowMutation = useBorrow({
    options: {
      onSuccess: (hash) => {
        toaster.create({
          title: "Borrow Successful",
          description: `Transaction hash: ${hash}`,
          type: "success",
        });
      },
      onError: (error) => {
        toaster.create({
          title: "Borrow Failed",
          description: error.message,
          type: "error",
        });
      },
    },
  });

  const maxBorrowCapacity = useMemo(() => {
    if (!yscspr_balance || !vaultParams?.ltv || !cspr_price) return "0";
    
    const collateralBN = new BigNumber(yscspr_balance + 1000000000000).dividedBy(MOTE_RATE);
    const priceBN = new BigNumber(cspr_price).dividedBy(MOTE_RATE); // Price in USD per CSPR
    const ltvBN = new BigNumber(vaultParams.ltv).dividedBy(100); // LTV as decimal
    const maxBorrow = collateralBN.multipliedBy(priceBN).multipliedBy(ltvBN);
    
    return maxBorrow.toFixed(2);
  }, [yscspr_balance, vaultParams, cspr_price]);

  const newDebt = useMemo(() => {
    if (!amount || isNaN(Number(amount))) return position?.debt ? new BigNumber(position.debt).dividedBy(MOTE_RATE).toFixed(2) : "0";
    
    const currentDebt = position?.debt ? new BigNumber(position.debt).dividedBy(MOTE_RATE) : new BigNumber(0);
    const borrowAmount = new BigNumber(amount);
    
    return currentDebt.plus(borrowAmount).toFixed(2);
  }, [amount, position]);

  const apr = useMemo(() => {
    if (!vaultParams?.stability_fee) return "0";
    return (vaultParams.stability_fee / 100).toFixed(2);
  }, [vaultParams]);

  const isValidAmount = useMemo(() => {
    if (!amount || amount === "0") return false;
    const amountBN = new BigNumber(amount);
    const maxBorrowBN = new BigNumber(maxBorrowCapacity);
    return amountBN.isGreaterThanOrEqualTo(0);
  }, [amount, maxBorrowCapacity]);

  const handleMaxClick = () => {
    setValue("amount", maxBorrowCapacity);
  };

  const onSubmit = async (data: BorrowFormData) => {
    if (!isValidAmount) {
      toaster.create({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        type: "error",
      });
      return;
    }

    borrowMutation.mutate({
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
              placeholder="Borrow amount"
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
                  ["Backspace", "Delete", "Tab", "Escape", "Enter", "."].includes(e.key) ||
                  // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                  (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) ||
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
              cUSD
            </Text>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text fontSize="md" color="fg.inverted">
              Max capacity {formatCurrency(Number(maxBorrowCapacity))}
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
        disabled={!isValidAmount || borrowMutation.isPending}
        loading={borrowMutation.isPending}
        py={7}
        w="full"
      >
        {borrowMutation.isPending ? "Borrowing..." : "Borrow"}
      </Button>
    </FormCard>
    </form>
  );
}
