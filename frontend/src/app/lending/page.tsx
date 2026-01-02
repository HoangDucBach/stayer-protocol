import { Center, Flex } from "@chakra-ui/react";
import { BorrowPanel } from "./_components/BorrowPanel";
import { LeftPanel } from "./_components/LeftPanel";
import { ProtectedContent } from "@/app/_components/ProtectedContent";

export default function Home() {
  return (
    <Flex width="full" minH="calc(100vh - 200px)" px={8} gap={8}>
      <LeftPanel flex={1} />
      <BorrowPanel flex={1} />
    </Flex>
  );
}
