import { HStack } from "@chakra-ui/react";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <HStack>
      {children}
    </HStack>
  );
}
