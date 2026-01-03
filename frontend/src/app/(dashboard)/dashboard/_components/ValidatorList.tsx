"use client";
import {
  useGetValidators,
  type Validator,
} from "@/app/hooks/useCasper";
import { useGetValidator as useGetValidatorRegistry } from "@/app/hooks/useValidatorRegistry";
import { HStack, StackProps, Text, VStack } from "@chakra-ui/react";
import { RiCoinLine } from "react-icons/ri";
import { FiClock } from "react-icons/fi";
import { PiUsersBold } from "react-icons/pi";

import { formatAddress } from "@/utils";
import { Avatar } from "@/components/ui/avatar";

interface Props extends StackProps {}
export function ValidatorList(props: Props) {
  // Hook returns: { data: Validator[], item_count: number, era_id: number }
  // Validator = { public_key, era_id, is_active, inactive, fee, total_stake, weight, delegators_number, rank }
  const { data, isLoading, error } = useGetValidators({});

  return <div>Validator List Component</div>;
}

interface StayerValidatorProps extends StackProps {
  validator: Validator;
}
export function StayerValidator({ validator, ...rest }: StayerValidatorProps) {
  const {
    data: registryData,
    isLoading: isRegistryLoading,
    error: registryError,
  } = useGetValidatorRegistry(validator.public_key, {
    options: {
      enabled: !!validator.public_key,
      staleTime: 1 * 60 * 60 * 1000, // 1 hour
    },
  });

  const metricFields = [
    {
        label: "Fee",
    },
    {
        label: "Era",
    },
    {
        label: "Delegators",
    }
  ];

  if (isRegistryLoading) {
    return <div>Loading...</div>;
  }

  if (!registryData) {
    return null;
  }

  return (
    <HStack align={"start"} justify={"start"} gap={"4"} p={"4"}>
      <Avatar />
      <VStack>
        <Text fontWeight={"medium"}>{formatAddress(validator.public_key)}</Text>
      </VStack>
    </HStack>
  );
}
