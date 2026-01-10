"use client";

import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  VStack,
  Image,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InfoLine } from "./InfoLine";
import { FormCard } from "./FormCard";
import { formatCurrency } from "@/utils";
import { useClickRef } from "@make-software/csprclick-ui";
import {
  useGetPosition,
  useGetVaultParams,
  useDepositWithApproval,
} from "@/app/(dashboard)/hooks/useStayerVault";
import { useBalanceOf as useYSCSPRBalance } from "@/app/(dashboard)/hooks/useYSCSPR";
import { useGetPrice } from "@/app/(dashboard)/hooks/usePriceOracle";
import BigNumber from "bignumber.js";
import { toaster } from "@/components/ui/toaster";

const MOTE_RATE = new BigNumber(1_000_000_000);

const addCollateralSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => /^\d*\.?\d+$/.test(val), "Must be a valid number")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
});

type AddCollateralFormData = z.infer<typeof addCollateralSchema>;

export function AddCollateralForm() {
  const clickRef = useClickRef();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AddCollateralFormData>({
    resolver: zodResolver(addCollateralSchema),
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

  const depositMutation = useDepositWithApproval({
    options: {
      onSuccess: (hash) => {
        toaster.create({
          title: "Add Collateral Successful",
          description: `Transaction hash: ${hash}`,
          type: "success",
        });
      },
      onError: (error) => {
        toaster.create({
          title: "Add Collateral Failed",
          description: error.message,
          type: "error",
        });
      },
    },
  });

  const walletBalance = useMemo(() => {
    if (!yscspr_balance) return "0";
    return new BigNumber(yscspr_balance).dividedBy(MOTE_RATE).toFixed(2);
  }, [yscspr_balance]);

  const currentCollateral = useMemo(() => {
    if (!position?.collateral) return "0";
    return new BigNumber(position.collateral).dividedBy(MOTE_RATE).toFixed(2);
  }, [position]);

  const newCollateral = useMemo(() => {
    if (!amount || isNaN(Number(amount))) return currentCollateral;

    const current = position?.collateral
      ? new BigNumber(position.collateral).dividedBy(MOTE_RATE)
      : new BigNumber(0);
    const addAmount = new BigNumber(amount);

    return current.plus(addAmount).toFixed(2);
  }, [amount, position, currentCollateral]);

  const collateralValueUSD = useMemo(() => {
    if (!newCollateral || !cspr_price) return "0";
    const collateralBN = new BigNumber(newCollateral);
    const priceBN = new BigNumber(cspr_price).dividedBy(MOTE_RATE);
    return collateralBN.multipliedBy(priceBN).toFixed(2);
  }, [newCollateral, cspr_price]);

  const isValidAmount = useMemo(() => {
    if (!amount || amount === "0") return false;
    const amountBN = new BigNumber(amount);
    const balanceBN = new BigNumber(walletBalance);
    return amountBN.isGreaterThan(0) && amountBN.isLessThanOrEqualTo(balanceBN);
  }, [amount, walletBalance]);

  const handleMaxClick = () => {
    setValue("amount", walletBalance);
  };

  const onSubmit = async (data: AddCollateralFormData) => {
    if (!isValidAmount) {
      toaster.create({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your balance",
        type: "error",
      });
      return;
    }

    depositMutation.mutate({
      amount: data.amount,
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
                placeholder="Collateral amount"
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
                    [
                      "Backspace",
                      "Delete",
                      "Tab",
                      "Escape",
                      "Enter",
                      ".",
                    ].includes(e.key) ||
                    (e.ctrlKey &&
                      ["a", "c", "v", "x"].includes(e.key.toLowerCase())) ||
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
                ySCSPR
              </Text>
            </HStack>
            <HStack justify="space-between" w="full">
              <Text fontSize="md" color="fg.inverted">
                Balance: {walletBalance} ySCSPR
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
            src="/assets/yscspr-token-icon.svg"
            alt="ySCSPR Token Icon"
            w="64px"
            h="64px"
            p={2}
            bg="bg"
            borderRadius="full"
          />
        </HStack>

        <InfoLine
          leftText="Current collateral"
          rightNode={
            <HStack gap={1.5}>
              <Text fontSize="sm" color="fg">
                {currentCollateral}
              </Text>
              <Image
                src="/assets/yscspr-token-icon.svg"
                alt="ySCSPR Token Icon"
                w={4}
                h={4}
              />
            </HStack>
          }
        />

        <InfoLine
          leftText="New collateral"
          rightNode={
            <HStack gap={1.5}>
              <Text fontSize="sm" color="fg">
                {newCollateral}
              </Text>
              <Image
                src="/assets/yscspr-token-icon.svg"
                alt="ySCSPR Token Icon"
                w={4}
                h={4}
              />
            </HStack>
          }
        />

        <InfoLine
          leftText="Collateral value"
          rightText={`$${formatCurrency(Number(collateralValueUSD))}`}
        />

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
          disabled={!isValidAmount || depositMutation.isPending}
          loading={depositMutation.isPending}
          py={7}
          w="full"
        >
          {depositMutation.isPending ? "Adding Collateral..." : "Add Collateral"}
        </Button>
      </FormCard>
    </form>
  );
}
