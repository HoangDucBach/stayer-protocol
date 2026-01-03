import { HStack, VStack } from "@chakra-ui/react";
import { Header } from "../_components/Header";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <VStack w="full" h={"full"}>
      <Header />
      {children}
    </VStack>
  );
}
