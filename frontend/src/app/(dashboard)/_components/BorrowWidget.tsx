"use client";

import { Tabs, TabsRootProps } from "@chakra-ui/react";
import { useState } from "react";
import { StakeForm } from "./StakeForm";
import { UnstakeForm } from "./UnstakeForm";
import { BorrowForm } from "./BorrowForm";
import { RepayForm } from "./RepayForm";

type Props = TabsRootProps;

export function BorrowWidget(props: Props) {
  return (
    <Tabs.Root defaultValue="borrow" {...props}>
      <Tabs.List bg="transparent" colorPalette="fg">
        <Tabs.Trigger value="borrow">Borrow</Tabs.Trigger>
        <Tabs.Trigger value="repay">Repay</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="borrow">
        <BorrowForm />
      </Tabs.Content>
      <Tabs.Content value="repay">
        <RepayForm />
      </Tabs.Content>
    </Tabs.Root>
  );
}
