import { Center, VStack } from "@chakra-ui/react";
import { Header } from "../_components/Header";
import { Footer } from "@/app/_components/Footer";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <VStack w="full" h={"full"}>
      <Header />
      <Center w="full" flex={1} overflow={"hidden"}>
        {children}
      </Center>
      <Footer />
    </VStack>
  );
}
