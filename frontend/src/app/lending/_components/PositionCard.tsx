"use client";

import { formatPercentage } from "@/utils";
import {
  Box,
  Button,
  Heading,
  HStack,
  Image,
  Input,
  StackProps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useClickRef } from "@make-software/csprclick-ui";
import { useGetPosition, useGetVaultParams, useDeposit } from "@/app/hooks/useStayerVault";
import { useGetPrice } from "@/app/hooks/usePriceOracle";
import { useBalanceOf as useYSCSPRBalance } from "@/app/hooks/useYSCSPR";
import { useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import {
  DialogRoot,
  DialogContent,
  DialogCloseTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";

const MOTE_RATE = new BigNumber(1_000_000_000);

type Props = StackProps;

export function PositionCard(props: Props) {
  const clickRef = useClickRef();

  // Fetch user position
  const { data: position } = useGetPosition(
    clickRef?.currentAccount?.public_key || "",
    { options: { enabled: !!clickRef?.currentAccount } }
  );

  // Fetch vault parameters
  const { data: vaultParams } = useGetVaultParams();

  // Fetch CSPR price
  const { data: cspr_price } = useGetPrice();

  // Calculate collateral value in USD
  const collateralValue = useMemo(() => {
    if (!position?.collateral || !cspr_price) return "0";
    
    const collateralBN = new BigNumber(position.collateral).dividedBy(MOTE_RATE);
    const priceBN = new BigNumber(cspr_price).dividedBy(MOTE_RATE);
    
    return collateralBN.multipliedBy(priceBN).toFixed(2);
  }, [position, cspr_price]);

  // Debt value
  const debtValue = useMemo(() => {
    if (!position?.debt) return "0";
    return new BigNumber(position.debt).dividedBy(MOTE_RATE).toFixed(2);
  }, [position]);

  // Calculate health factor
  const healthFactor = useMemo(() => {
    if (!position?.collateral || !position?.debt || !vaultParams?.liq_threshold || !cspr_price) return 1;
    
    const collateralBN = new BigNumber(position.collateral).dividedBy(MOTE_RATE);
    const debtBN = new BigNumber(position.debt).dividedBy(MOTE_RATE);
    const priceBN = new BigNumber(cspr_price).dividedBy(MOTE_RATE);
    const liqThresholdBN = new BigNumber(vaultParams.liq_threshold).dividedBy(100);
    
    if (debtBN.isZero()) return 1;
    
    const hf = collateralBN.multipliedBy(priceBN).multipliedBy(liqThresholdBN).dividedBy(debtBN);
    
    return hf.toNumber();
  }, [position, vaultParams, cspr_price]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const { data: yscspr_balance } = useYSCSPRBalance(
    clickRef?.currentAccount?.public_key || "",
    { options: { enabled: !!clickRef?.currentAccount } }
  );

  const depositMutation = useDeposit({
    options: {
      onSuccess: (hash) => {
        toaster.create({
          title: "Deposit Successful",
          description: `Transaction hash: ${hash}`,
          type: "success",
        });
        setIsDialogOpen(false);
        setDepositAmount("");
      },
      onError: (error) => {
        toaster.create({
          title: "Deposit Failed",
          description: error.message,
          type: "error",
        });
      },
    },
  });

  const handleAddCollateral = () => {
    setIsDialogOpen(true);
  };

  const handleMaxClick = () => {
    if (yscspr_balance) {
      setDepositAmount(new BigNumber(yscspr_balance).dividedBy(MOTE_RATE).toString());
    }
  };

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      toaster.create({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        type: "error",
      });
      return;
    }

    const amountInMotes = new BigNumber(depositAmount).multipliedBy(MOTE_RATE).toString();

    depositMutation.mutate({
      amount: amountInMotes,
      waitForConfirmation: false,
    });
  };

  return (
    <VStack
      w="full"
      h="fit-content"
      bg="bg.subtle"
      borderRadius="4xl"
      p="8"
      gap={6}
      align="start"
      {...props}
    >
      <Heading size="4xl" mb={1} textAlign="left" fontWeight="semibold">
        Position
      </Heading>
      <HStack w="full" justify="space-between">
        <StatItem
          label="Total Deposits"
          value={`${new BigNumber(position?.collateral || 0).dividedBy(MOTE_RATE).toFixed(2)} ySCSPR`}
          estimateMoneyValue={`$${collateralValue}`}
          imageUrl="/assets/yscspr-token-icon.svg"
        />
        <StatItem
          label="Total Borrows"
          value={`${debtValue} cUSD`}
          estimateMoneyValue={`$${debtValue}`}
          imageUrl="/assets/cusd-token-icon.svg"
        />
      </HStack>
      <StatusBar currentPercentage={healthFactor} />
      <Button size="md" onClick={handleAddCollateral}>
        Add Collateral
      </Button>

      <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
        <DialogContent>
          <VStack gap={4} p={2}>
            <Heading size="xl">Add Collateral</Heading>
            <Field label="Amount (ySCSPR)">
              <Input
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                type="number"
                min="0"
                step="any"
              />
            </Field>
            <HStack w="full" justify="space-between">
              <Text fontSize="sm" color="fg.muted">
                Available: {new BigNumber(yscspr_balance || 0).dividedBy(MOTE_RATE).toFixed(4)} ySCSPR
              </Text>
              <Button size="xs" variant="ghost" onClick={handleMaxClick}>
                MAX
              </Button>
            </HStack>
          </VStack>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              loading={depositMutation.isPending}
              disabled={!depositAmount || Number(depositAmount) <= 0}
            >
              Deposit
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  estimateMoneyValue?: string;
  imageUrl?: string;
  imageAlt?: string;
}

const StatItem = ({
  label,
  value,
  estimateMoneyValue,
  imageUrl,
  imageAlt,
}: StatItemProps) => {
  return (
    <VStack align="start" gap={1}>
      <Heading size="md" color="#AEA28E">
        {label}
      </Heading>
      <HStack gap={4}>
        <Heading size="2xl">{value}</Heading>
        <Image src={imageUrl} alt={imageAlt || "img"} boxSize="32px" />
      </HStack>
      <Text fontSize="md" color="fg">
        ≈ {estimateMoneyValue}
      </Text>
    </VStack>
  );
};

interface StatusBarProps {
  currentPercentage?: number;
}

const StatusBar = ({ currentPercentage }: StatusBarProps) => {
  const levelText = () => {
    if (currentPercentage === undefined) return "Safe";
    if (currentPercentage >= 0.7) return "Safe";
    if (currentPercentage > 0.4) return "Warning";
    return "Critical";
  };

  const levelColor = () => {
    if (currentPercentage === undefined) return "green.400";
    if (currentPercentage >= 0.7) return "green.500";
    if (currentPercentage > 0.4) return "yellow.500";
    return "red.400";
  };

  const pct = formatPercentage(currentPercentage || 0, 0);

  return (
    <HStack w="full" gap={4}>
      <Text fontSize="xs" fontWeight="medium" color={levelColor()}>
        {levelText()}
      </Text>
      <Box
        bg="#FCE5CF"
        flex={1}
        h="8px"
        borderRadius="4px"
        overflow="hidden"
        w="full"
      >
        <Box
          bg={levelColor()}
          h="8px"
          borderTopLeftRadius="4px"
          borderBottomLeftRadius="4px"
          borderTopRightRadius={pct === "100%" ? "4px" : "0px"}
          borderBottomRightRadius={pct === "100%" ? "4px" : "0px"}
          w={pct}
        />
      </Box>
      <Text fontSize="xs" fontWeight="medium" color="text.fg">
        {pct}
      </Text>
    </HStack>
  );
};
