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
      <Tabs.List bg="transparent" borderBottom="none" gap="4" mb={6}>
        <Tabs.Trigger 
          value="stake"
          fontSize="md"
          fontWeight="semibold"
          px={0}
          pb={0}
        >
          Stake
        </Tabs.Trigger>
        <Tabs.Trigger 
          value="unstake"
          fontSize="md"
          fontWeight="semibold"
          color="fg.subtle"
          _selected={{ color: "fg.default", borderBottom: "none" }}
          px={0}
          pb={0}
        >
          Unstake
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="stake" pt={0}>
        {stakeStep === 1 ? (
          <ChooseValidatorForm onNext={handleValidatorNext} />
        ) : (
          <StakeForm validator={selectedValidator} onBack={handleBack} />
        )}
      </Tabs.Content>
      <Tabs.Content value="unstake" pt={0}>
        <UnstakeForm />
      </Tabs.Content>
    </Tabs.Root>
  );
}
