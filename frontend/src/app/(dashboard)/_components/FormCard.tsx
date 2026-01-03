import { VStack } from "@chakra-ui/react";
import { ReactNode } from "react";

type FormCardProps = {
  children: ReactNode;
  gradient?: boolean;
};

export function FormCard({ children, gradient = false }: FormCardProps) {
  return (
    <VStack
      gap={4}
      align="stretch"
      bgImage={
        gradient
          ? "linear-gradient(0deg, #F8931F 0%, #EED9C5 44.23%, #EED9C5 70.49%)"
          : undefined
      }
      bg={gradient ? undefined : "bg.subtle"}
      borderRadius="24px"
      p={4}
    >
      {children}
    </VStack>
  );
}
