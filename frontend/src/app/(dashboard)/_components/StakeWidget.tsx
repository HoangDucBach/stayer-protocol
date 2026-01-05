"use client";

import { Tabs, TabsRootProps } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChooseValidatorForm } from "./ChooseValidatorForm";
import { StakeForm } from "./StakeForm";
import { UnstakeForm } from "./UnstakeForm";
import { AnimatePresence } from "framer-motion";
import { formatAddress } from "@/utils";

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

  // Check for prefilled validator from URL params on mount
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
    // Reset to step 1 when changing tabs
    setStakeStep(1);
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
    </Tabs.Root>
  );
}
