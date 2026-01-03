import { HStack } from "@chakra-ui/react";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <HStack w="full" h={"full"} p={"4"}>
      {children}
    </HStack>
  );
}
