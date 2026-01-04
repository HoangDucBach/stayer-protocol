"use client";
import { useGetValidators, type Validator } from "@/app/hooks/useCasper";
import { useGetValidator as useGetValidatorRegistry } from "@/app/hooks/useValidatorRegistry";
import {
  Button,
  For,
  HStack,
  Icon,
  Link,
  Skeleton,
  StackProps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RiCoinLine } from "react-icons/ri";
import { FiClock } from "react-icons/fi";
import { PiUsersBold } from "react-icons/pi";
import { useRouter } from "next/navigation";

import { formatAddress, formatToken } from "@/utils";
import { Avatar } from "@/components/ui/avatar";
import { useMemo } from "react";
import { CASPER_EXPLORER_URL } from "@/configs/constants";
import { Tooltip } from "@/components/ui/tooltip";

interface Props extends StackProps {}
export function ValidatorList(props: Props) {
  const router = useRouter();
  const { data, isLoading, error } = useGetValidators({
    includes: "account_info,average_performance,cspr_name",
  });

  const sortedPerfValidators = useMemo(() => {
    if (!data) return [];
    return [...data.data].sort((a, b) => {
      const rankA = a.rank ?? 0;
      const rankB = b.rank ?? 0;
      if (rankA !== rankB) return rankA - rankB;
      return (b.performance ?? 0) - (a.performance ?? 0);
    });
  }, [data]);

  const handleDelegate = (validatorPublicKey: string) => {
    router.push(`/staking?validator=${validatorPublicKey}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>No validators found.</div>;
  }

  return (
    <VStack flex={1} h={"full"} overflow={"auto"} {...props}>
      <For each={sortedPerfValidators} fallback={<div>Loading...</div>}>
        {(validator) => (
          <StayerValidator 
            key={validator.public_key} 
            validator={validator} 
            onDelegate={handleDelegate}
          />
        )}
      </For>
    </VStack>
  );
}

interface StayerValidatorProps extends StackProps {
  validator: Validator;
  onDelegate?: (validatorPublicKey: string) => void;
}
export function StayerValidator({ validator, onDelegate, ...rest }: StayerValidatorProps) {
  const { data: registryData, isLoading: isRegistryLoading } =
    useGetValidatorRegistry(validator.public_key, {
      enabled: !!validator.public_key,
      staleTime: 1 * 60 * 60 * 1000, // 1 hour
    });

  const metricFields = [
    {
      label: "Fee",
      value: validator.fee,
      icon: RiCoinLine,
    },
    {
      label: "Era",
      value: validator.era_id,
      icon: FiClock,
    },
    {
      label: "Delegators",
      value: validator.delegators_number,
      icon: PiUsersBold,
    },
  ];

  if (isRegistryLoading) {
    return <Skeleton height="80px" width="100%" borderRadius={"2xl"} />;
  }

  return (
    <HStack
      align={"start"}
      justify={"space-between"}
      gap={"4"}
      p={"4"}
      w={"full"}
    >
      <Avatar
        src={
          validator.account_info?.info.owner?.branding?.logo?.svg ||
          `https://api.dicebear.com/7.x/identicon/svg?seed=${validator.public_key}`
        }
      />
      <VStack flex={1} align={"start"}>
        <Tooltip
          contentProps={{
            maxW: "fit",
          }}
          content={
            <Text w={"fit"} fontWeight={"medium"}>
              {validator.public_key}
            </Text>
          }
        >
          <Link
            href={`${CASPER_EXPLORER_URL}/validator/${validator.public_key}`}
            fontSize={"lg"}
            fontWeight={"medium"}
          >
            {formatAddress(validator.public_key)}
          </Link>
        </Tooltip>
        <Text fontSize={"sm"} color={"fg.subtle"} fontWeight={"medium"}>
          {validator.account_info?.info.owner?.name}
        </Text>
        <HStack gap={"8"}>
          {metricFields.map((field) => (
            <Tooltip content={`${field.label}`} key={field.label}>
              <HStack key={field.label} gap={"2"} cursor={"pointer"}>
                <Icon as={field.icon} boxSize={"4"} />
                <Text>{field.value}</Text>
              </HStack>
            </Tooltip>
          ))}
        </HStack>
      </VStack>
      <VStack w={"fit"}>
        <Text fontSize={"lg"} fontWeight={"semibold"} w={"fit"}>
          {formatToken(validator.total_stake, {
            symbol: "CSPR",
            chainDecimals: 9,
          })}
        </Text>
        <Button 
          size={"sm"} 
          w={"full"}
          onClick={() => onDelegate?.(validator.public_key)}
        >
          Delegate
        </Button>
      </VStack>
    </HStack>
  );
}
