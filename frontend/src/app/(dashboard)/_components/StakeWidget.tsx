"use client";

import { Tabs, TabsRootProps } from "@chakra-ui/react";
import { useState } from "react";
import { ChooseValidatorForm } from "./ChooseValidatorForm";
import { StakeForm } from "./StakeForm";
import { UnstakeForm } from "./UnstakeForm";
import { motion, AnimatePresence } from "framer-motion";

type Props = TabsRootProps;

export function StakeTabs(props: Props) {
  const [stakeStep, setStakeStep] = useState<1 | 2>(1);
  const [selectedValidator, setSelectedValidator] = useState("");
  const [currentTab, setCurrentTab] = useState("stake");

  const handleValidatorNext = (validator: string) => {
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
        <Tabs.Trigger 
          value="stake"
        >
          Stake
        </Tabs.Trigger>
        <Tabs.Trigger 
          value="unstake"
        >
          Unstake
        </Tabs.Trigger>
      </Tabs.List>
      <AnimatePresence mode="wait">
        <Tabs.Content value="stake" key="stake-content">
          <AnimatePresence mode="wait">
            {stakeStep === 1 ? (
              <ChooseValidatorForm onNext={handleValidatorNext} key="choose-validator-stake" />
            ) : (
              <StakeForm validator={selectedValidator} onBack={handleBack} key="stake-form" />
            )}
          </AnimatePresence>
        </Tabs.Content>
        <Tabs.Content value="unstake" key="unstake-content">
          <AnimatePresence mode="wait">
            {stakeStep === 1 ? (
              <ChooseValidatorForm onNext={handleValidatorNext} key="choose-validator-unstake" />
            ) : (
              <UnstakeForm validator={selectedValidator} onBack={handleBack} key="unstake-form" />
            )}
          </AnimatePresence>
        </Tabs.Content>
      </AnimatePresence>
    </Tabs.Root>
  );
}
