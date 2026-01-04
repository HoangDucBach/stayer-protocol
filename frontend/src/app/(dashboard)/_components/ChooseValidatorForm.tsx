"use client";

import {
  Button,
  Text,
  Icon,
  createListCollection,
  Portal,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useState, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InfoLine } from "./InfoLine";
import { FormCard } from "./FormCard";
import { Select } from "@chakra-ui/react";
import { HiArrowDown, HiArrowRight } from "react-icons/hi";
import { useGetValidator, useGetNetworkPAvg } from "@/app/hooks/useValidatorRegistry";
import { useGetValidators, useGetCurrentEra } from "@/app/hooks/useCasper";
import { formatAddress } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Field } from "@/components/ui/field";

type Props = {
  onNext: (validator: string) => void;
};

const validatorSchema = z.object({
  validator: z.array(z.string()).min(1, "Please select a validator"),
});

type ValidatorFormData = z.infer<typeof validatorSchema>;

export function ChooseValidatorForm({ onNext }: Props) {
  const hasLoadedOnce = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ValidatorFormData>({
    resolver: zodResolver(validatorSchema),
    defaultValues: {
      validator: [],
    },
  });

  const selectedValidator = watch("validator");

  const { data: validatorsResponse, isLoading: isLoadingValidators } =
    useGetValidators();
  const { data: currentEra } = useGetCurrentEra();

  if (validatorsResponse && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true;
  }

  const { data: validatorData } = useGetValidator(selectedValidator[0] || "", {
    enabled: !!selectedValidator[0],
  });

  const validatorList = useMemo(() => {
    if (!validatorsResponse?.data) return [];

    return validatorsResponse.data
      .filter((validator) => validator.is_active)
      .map((validator) => ({
        value: validator.public_key,
        label: formatAddress(validator.public_key),
        totalStake: validator.total_stake,
        fee: validator.fee,
      }));
  }, [validatorsResponse]);

  const collection = useMemo(
    () =>
      createListCollection({
        items: validatorList,
        itemToValue: (item) => item.value,
        itemToString: (item) => item.label,
      }),
    [validatorList]
  );

  const selectedValidatorInfo = validatorList.find(
    (v) => v.value === selectedValidator[0]
  );

  const onSubmit = (data: ValidatorFormData) => {
    if (data.validator[0]) {
      onNext(data.validator[0]);
    }
  };

  const { data: networkPAvg } = useGetNetworkPAvg();

  // Formula: (p_score * 10000) / p_avg, clamped between 0.5x and 1.5x
  const multiplier = validatorData?.p_score && networkPAvg
    ? (() => {
        const mult = (validatorData.p_score * 10000) / networkPAvg;
        const clampedMult = Math.max(5000, Math.min(15000, mult));
        return (clampedMult / 10000).toFixed(2) + "x";
      })()
    : "1.00x";

  // Calculate APY from validator fee (simplified estimate)
  const apy = validatorData?.fee !== undefined && selectedValidatorInfo
    ? ((100 - validatorData.fee) / 10).toFixed(1) + "%"
    : "0.0%";

  console.log("Selected Validator Data:", validatorData);
  console.log("Network P Avg:", networkPAvg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
      <FormCard gradient>
        <Controller
          name="validator"
          control={control}
          render={({ field }) => (
            <Select.Root
              size="lg"
              collection={collection}
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
            >
              <Select.Control>
                <Select.Trigger
                  bg="red.border"
                  borderRadius="xl"
                  fontSize="md"
                  fontWeight="medium"
                  color="demonicRed.100"
                  border="none"
                  h="fit"
                  p={3}
                  _focus={{ outline: "none", boxShadow: "none" }}
                >
                  <Select.ValueText placeholder="Choose validators" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  {isLoadingValidators && (
                    <Spinner size="xs" borderWidth="1.5px" color="fg.muted" />
                  )}
                  <Select.Indicator asChild>
                    <Icon as={HiArrowDown} color="demonicRed.100" />
                  </Select.Indicator>
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {collection.items.map((validator) => (
                      <Select.Item key={validator.value} item={validator}>
                        <Select.ItemText>{validator.label}</Select.ItemText>
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          )}
        />

        {/* Info Lines */}
        <AnimatePresence mode="wait">
          {selectedValidatorInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <InfoLine
                leftText="Multiplier"
                rightNode={
                  <Text fontSize="md" color="fg" fontWeight="semibold">
                    {multiplier}
                  </Text>
                }
              />

              <InfoLine
                leftText="APY"
                rightNode={
                  <Text fontSize="md" color="fg" fontWeight="semibold">
                    {apy}
                  </Text>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="lg"
          bg="#82756840"
          color="primary.contrast"
          fontWeight="medium"
          fontSize="md"
          borderRadius="xl"
          mt={2}
          _hover={{ opacity: 0.9 }}
          type="submit"
          disabled={!selectedValidator[0]}
          justifyContent={"space-between"}
          w="full"
        >
          Next
          <Icon as={HiArrowRight} />
        </Button>
      </FormCard>
      </form>
    </motion.div>
  );
}
