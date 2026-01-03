import { ProtectedContent } from "@/app/_components/ProtectedContent";
import { HStack } from "@chakra-ui/react";
import { ValidatorList } from "./_components/ValidatorList";

export default function Page() {
  return (
    <HStack>
      <ValidatorList />
    </HStack>
  );
}
