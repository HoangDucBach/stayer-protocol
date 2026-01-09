"use client";

import {
  Box,
  Button,
  Center,
  DialogPositioner,
  Image,
  Tabs,
  TabsRootProps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChooseValidatorForm } from "./ChooseValidatorForm";
import { StakeForm } from "./StakeForm";
import { UnstakeForm } from "./UnstakeForm";
import { AnimatePresence, motion } from "framer-motion";
import { formatAddress } from "@/utils";
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { useConfetti } from "@/hooks/useConfetti";
import BackgroundVideo from "./BackgroundVideo";

type Props = TabsRootProps;

export interface SelectedValidator {
  publicKey: string;
  formattedAddress: string;
  totalStake: string;
  fee: number;
  logo?: string;
}

export function StakeWidget(props: Props) {
  const searchParams = useSearchParams();
  const [stakeStep, setStakeStep] = useState<1 | 2>(1);
  const [selectedValidator, setSelectedValidator] =
    useState<SelectedValidator | null>(null);
  const [currentTab, setCurrentTab] = useState("stake");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);
  const [isCompletedDialogOpen, setIsCompletedDialogOpen] = useState(false);

  useEffect(() => {
    const validatorParam = searchParams.get("validator");
    const logoParam = searchParams.get("logo");
    if (validatorParam) {
      setSelectedValidator({
        publicKey: validatorParam,
        formattedAddress: formatAddress(validatorParam),
        totalStake: "0",
        fee: 0,
        logo: logoParam || undefined,
      });
      setStakeStep(2);
    }
  }, [searchParams]);

  const handleValidatorNext = (validator: SelectedValidator) => {
    setSelectedValidator(validator);
    setStakeStep(2);
  };

  const handleBack = () => {
    setStakeStep(1);
  };

  const handleTabChange = (details: { value: string }) => {
    setCurrentTab(details.value);
    setStakeStep(1);
  };

  const handleStakeComplete = (txHash: string) => {
    setCompletedTxHash(txHash);
    setIsCompletedDialogOpen(true);
  };

  const handleCloseCompletedDialog = () => {
    setIsCompletedDialogOpen(false);
    setCompletedTxHash(null);
  };

  return (
    <Tabs.Root
      defaultValue="stake"
      value={currentTab}
      onValueChange={handleTabChange}
      {...props}
    >
      <Tabs.List bg="transparent">
        <Tabs.Trigger value="stake">Stake</Tabs.Trigger>
        <Tabs.Trigger value="unstake">Unstake</Tabs.Trigger>
      </Tabs.List>
      <AnimatePresence mode="wait">
        <Tabs.Content value="stake" key="stake-content">
          <AnimatePresence mode="wait">
            {stakeStep === 1 ? (
              <ChooseValidatorForm
                onNext={handleValidatorNext}
                key="choose-validator-stake"
              />
            ) : selectedValidator ? (
              <StakeForm
                validator={selectedValidator}
                onBack={handleBack}
                onStakeComplete={handleStakeComplete}
                key="stake-form"
              />
            ) : null}
          </AnimatePresence>
        </Tabs.Content>
        <Tabs.Content value="unstake" key="unstake-content">
          <AnimatePresence mode="wait">
            {stakeStep === 1 ? (
              <ChooseValidatorForm
                onNext={handleValidatorNext}
                key="choose-validator-unstake"
              />
            ) : selectedValidator ? (
              <UnstakeForm
                validator={selectedValidator}
                onBack={handleBack}
                key="unstake-form"
              />
            ) : null}
          </AnimatePresence>
        </Tabs.Content>
      </AnimatePresence>
      <Button
        onClick={(e) => setIsCompletedDialogOpen(!isCompletedDialogOpen)}
      >
        Test Completed Transaction Dialog
      </Button>
      <CompletedTransaction
        transactionHash={""}
        isOpen={isCompletedDialogOpen}
        onClose={handleCloseCompletedDialog}
      />
    </Tabs.Root>
  );
}

interface CompletedTransactionProps {
  transactionHash: string;
  isOpen: boolean;
  onClose: () => void;
}

const CompletedTransaction = ({
  transactionHash,
  isOpen,
  onClose,
}: CompletedTransactionProps) => {
  const iconRef = useRef<HTMLDivElement | null>(null);
  const { fireworks, fire } = useConfetti();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => fireworks(), 300);
    }
  }, [isOpen, fireworks]);

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size={"full"}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent colorPalette="primary" p={20}>
          <BackgroundVideo />
          <DialogHeader justifyContent="center">
            <Text fontSize="3xl" fontWeight="bold">
              Congratulations!
            </Text>
          </DialogHeader>
          <DialogBody w="full" flex="1" justifyItems="center">
            <VStack gap={6} py={4} maxW="lg">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 7, -7, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/assets/yscspr-token-icon.svg"
                  alt="ySCSPR Token Icon"
                  w={32}
                  h={32}
                />
              </motion.div>

              <VStack gap={2}>
                <Text fontSize="xl" fontWeight="semibold" color="green.600">
                  You're All Set!
                </Text>
                <Text fontSize="md" color="fg.muted" textAlign="center">
                  Sit back, relax, and maybe grab a drink — your CSPR is now
                  staked! You'll start earning ySCSPR rewards automatically.
                </Text>
              </VStack>
              <Text fontSize="sm" color="fg.muted" textAlign="center">
                Every reward counts — watch them grow!
              </Text>
              <Button
                onClick={onClose}
                borderRadius={"2xl"}
                size="lg"
                colorScheme="green"
              >
                Awesome!
              </Button>
            </VStack>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};
