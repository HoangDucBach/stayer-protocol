"use client";
import { useGetValidators, type Validator } from "@/app/hooks/useCasper";
import { useGetValidator as useGetValidatorRegistry } from "@/app/hooks/useValidatorRegistry";
import {
  Badge,
  Button,
  For,
  Heading,
  HStack,
  Icon,
  Link,
  Skeleton,
  StackProps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { RiAwardFill, RiCoinLine } from "react-icons/ri";
import { FiCircle, FiClock } from "react-icons/fi";
import { PiUsersBold } from "react-icons/pi";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";

import {
  formatAddress,
  formatNumber,
  formatPercentage,
  formatToken,
} from "@/utils";
import { Avatar } from "@/components/ui/avatar";
import { useMemo } from "react";
import { CASPER_EXPLORER_URL } from "@/configs/constants";
import { Tooltip } from "@/components/ui/tooltip";
import { Tag } from "@/components/ui/tag";

const MotionVStack = motion.create(VStack);
const MotionHeading = motion.create(Heading);
const MotionText = motion.create(Text);
const MotionHStack = motion.create(HStack);

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
      return (
        (b.average_performance.score ?? 0) - (a.average_performance.score ?? 0)
      );
    });
  }, [data]);

  const handleDelegate = (validator: Validator) => {
    router.push(
      `/staking?validator=${validator.public_key}&logo=${validator.account_info?.info.owner?.branding?.logo?.svg || ""}`
    );
  };

  if (isLoading) {
    return <Skeleton height="full" flex={1} borderRadius={"3xl"} />;
  }

  if (!data) {
    return <div>No validators found.</div>;
  }

  return (
    <VStack flex={1} h={"full"} {...props}>
      <MotionVStack
        w={"full"}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
      >
        <MotionHeading
          as="h2"
          size="4xl"
          fontWeight={"bold"}
          w={"full"}
          variants={{
            hidden: { opacity: 0, y: -20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Validators
        </MotionHeading>
        <MotionText
          color={"fg.subtle"}
          w={"full"}
          variants={{
            hidden: { opacity: 0, y: -20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Choose your favorite and delegate to earn{" "}
        </MotionText>
      </MotionVStack>
      <motion.div
        style={{ width: "100%", height: "100%", overflow: "auto" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <VStack
          w={"full"}
          h={"full"}
          overflow={"auto"}
          css={{
            "::-webkit-scrollbar": {
              width: "8px",
              background: "transparent",
            },
            "::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "8px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "#555",
            },
            scrollbarWidth: "thin",
            scrollbarColor: "#888 transparent",
          }}
        >
          <For each={sortedPerfValidators} fallback={<div>Loading...</div>}>
            {(validator, index) => (
              <StayerValidator
                key={validator.public_key}
                validator={validator}
                onDelegate={handleDelegate}
                index={index}
              />
            )}
          </For>
        </VStack>
      </motion.div>
    </VStack>
  );
}

interface StayerValidatorProps extends StackProps {
  validator: Validator;
  onDelegate?: (validator: Validator) => void;
  index?: number;
}
export function StayerValidator({
  validator,
  onDelegate,
  index = 0,
  ...rest
}: StayerValidatorProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "100px 0px",
    threshold: 0,
  });

  const { data: registryData, isLoading: isRegistryLoading } =
    useGetValidatorRegistry(validator.public_key, {
      enabled: !!validator.public_key && inView,
      staleTime: 1 * 60 * 60 * 1000, // 1 hour
    });

  const performance = formatNumber(
    registryData?.p_score ?? validator.average_performance?.score ?? 0,
    {
      decimals: 1,
    }
  );

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
      ref={ref}
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
        <HStack w={"full"}>
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
          <Tooltip
            content={
              <Text fontWeight={"medium"}>Performance: {performance}</Text>
            }
          >
            <Badge
              color={"primary.solid"}
              bg={"primary.solid/25"}
              borderRadius={"lg"}
            >
              <Icon as={RiAwardFill} fill={"primary.solid"} boxSize={"3"} />
              {performance}
            </Badge>
          </Tooltip>
          <Tooltip
            content={
              <Text fontWeight={"medium"}>
                Status: {validator.is_active ? "Active" : "Inactive"}
              </Text>
            }
          >
            <Badge
              color={validator.is_active ? "#94DC18" : "red.500"}
              bg={validator.is_active ? "#94DC18/25" : "red.500/25"}
              borderRadius={"md"}
            >
              <Icon
                as={FiCircle}
                fill={validator.is_active ? "#94DC18" : "red"}
                w="2"
                h="2"
              />
              {validator.is_active ? "Active" : "Inactive"}
            </Badge>
          </Tooltip>
        </HStack>
        <Text fontSize={"sm"} color={"fg.subtle"} fontWeight={"medium"}>
          {validator.account_info?.info.owner?.name}
        </Text>
        <HStack gap={8}>
          {metricFields.map((field) => (
            <Tooltip content={`${field.label}`} key={field.label}>
              <HStack key={field.label} gap={"2"} cursor={"pointer"}>
                <Icon as={field.icon} boxSize={"4"} />
                <Text>{formatFields(field.value, field.label)}</Text>
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
        <Button size={"sm"} w={"full"} onClick={() => onDelegate?.(validator)}>
          Delegate
        </Button>
      </VStack>
    </HStack>
  );
}

function formatFields(value: number | string, label: string) {
  switch (label) {
    case "Fee":
      console.log("Formatting fee:", value);
      return formatPercentage(Number(value), 2, false);
    case "Era":
      return formatNumber(value, { decimals: 0 });
    case "Delegators":
      return formatNumber(value, { decimals: 0 });
    default:
      return value.toString();
  }
}
