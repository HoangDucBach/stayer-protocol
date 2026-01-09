"use client";

import { Tabs, TabsRootProps } from "@chakra-ui/react";
import { useState } from "react";
import { BorrowForm } from "./BorrowForm";
import { RepayForm } from "./RepayForm";
import { AddCollateralForm } from "./AddCollateralForm";
import { motion, AnimatePresence } from "framer-motion";

type Props = TabsRootProps;

const tabContentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export function BorrowWidget(props: Props) {
  const [activeTab, setActiveTab] = useState("deposit");

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(e) => setActiveTab(e.value)}
      {...props}
    >
      <Tabs.List bg="transparent" colorPalette="fg">
        <Tabs.Trigger value="deposit">Deposit</Tabs.Trigger>
        <Tabs.Trigger value="borrow">Borrow</Tabs.Trigger>
        <Tabs.Trigger value="repay">Repay</Tabs.Trigger>
      </Tabs.List>
      <AnimatePresence mode="wait">
        {activeTab === "deposit" && (
          <Tabs.Content value="deposit" key="deposit">
            <motion.div
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AddCollateralForm />
            </motion.div>
          </Tabs.Content>
        )}
        {activeTab === "borrow" && (
          <Tabs.Content value="borrow" key="borrow">
            <motion.div
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <BorrowForm />
            </motion.div>
          </Tabs.Content>
        )}
        {activeTab === "repay" && (
          <Tabs.Content value="repay" key="repay">
            <motion.div
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <RepayForm />
            </motion.div>
          </Tabs.Content>
        )}
      </AnimatePresence>
    </Tabs.Root>
  );
}
