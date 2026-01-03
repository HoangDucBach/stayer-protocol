"use client";

import { Tabs, TabsRootProps } from "@chakra-ui/react";
import { useState } from "react";
import { ChooseValidatorForm } from "./ChooseValidatorForm";
import { StakeForm } from "./StakeForm";
import { UnstakeForm } from "./UnstakeForm";

type Props = TabsRootProps;

export function StakeTabs(props: Props) {
  const [stakeStep, setStakeStep] = useState<1 | 2>(1);
  const [selectedValidator, setSelectedValidator] = useState("");

  const handleValidatorNext = (validator: string) => {
    setSelectedValidator(validator);
    setStakeStep(2);
  };

  const handleBack = () => {
    setStakeStep(1);
  };

  return (
    <Tabs.Root defaultValue="stake" {...props}>
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
      <Tabs.Content value="stake">
        {stakeStep === 1 ? (
          <ChooseValidatorForm onNext={handleValidatorNext} />
        ) : (
          <StakeForm validator={selectedValidator} onBack={handleBack} />
        )}
      </Tabs.Content>
      <Tabs.Content value="unstake">
        {stakeStep === 1 ? (
          <ChooseValidatorForm onNext={handleValidatorNext} />
        ) : (
          <UnstakeForm validator={selectedValidator} onBack={handleBack} />
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
