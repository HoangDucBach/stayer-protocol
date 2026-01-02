import { Center, Flex } from "@chakra-ui/react";
import { MainPanel } from "./_components/MainPanel";
import { ProtectedContent } from "@/app/_components/ProtectedContent";

export default function Home() {
  return (
      <Flex width="full" minH="calc(100vh - 200px)" px={4} justify={"center"}>
        <MainPanel />
      </Flex>
  );
}
