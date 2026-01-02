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
          ? "linear-gradient(180deg, var(--chakra-colors-bg-subtle) 0%, var(--chakra-colors-bg-subtle) 50%, var(--chakra-colors-primary-solid))"
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
