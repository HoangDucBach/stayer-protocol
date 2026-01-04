"use client";

import {
  Button,
  Text,
  Icon,
  createListCollection,
  Portal,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { InfoLine } from "./InfoLine";
import { FormCard } from "./FormCard";
import { Select } from "@chakra-ui/react";
import { HiArrowDown, HiArrowRight } from "react-icons/hi";
import { useGetValidator } from "@/app/hooks/useValidatorRegistry";

type Props = {
  onNext: (validator: string) => void;
};

// Mock validator data - replace with actual data from contract
const validatorAddresses = [
  { value: "0x323a...ac32", label: "Validator 1" },
  { value: "0x456b...de78", label: "Validator 2" },
  { value: "0x789c...fg90", label: "Validator 3" },
];

export function ChooseValidatorForm({ onNext }: Props) {
  const [selectedValidator, setSelectedValidator] = useState<string[]>([]);

  const collection = useMemo(
    () =>
      createListCollection({
        items: validatorAddresses,
        itemToValue: (item) => item.value,
        itemToString: (item) => item.label,
      }),
    []
  );

  const { data: validatorData } = useGetValidator(selectedValidator[0] || "", {
    enabled: !!selectedValidator[0],
  });

  const selectedValidatorInfo = validatorAddresses.find(
    (v) => v.value === selectedValidator[0]
  );

  const handleNext = () => {
    if (selectedValidator[0]) {
      onNext(selectedValidator[0]);
    }
  };

  const multiplier = validatorData?.p_score
    ? (validatorData.p_score / 1000).toFixed(2) + "x"
    : "1.00x";
  const apy = validatorData?.fee
    ? ((100 - validatorData.fee) / 10).toFixed(1) + "%"
    : "0.0%";

  return (
    <FormCard gradient>
      <Select.Root
        size="lg"
        collection={collection}
        value={selectedValidator}
        onValueChange={(e) => setSelectedValidator(e.value)}
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

      {/* Info Lines */}
      {selectedValidatorInfo && validatorData && (
        <>
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
        </>
      )}

      <Button
        size="lg"
        bg="#82756840"
        color="primary.contrast"
        fontWeight="medium"
        fontSize="md"
        borderRadius="xl"
        mt={2}
        _hover={{ opacity: 0.9 }}
        onClick={handleNext}
        disabled={!selectedValidator[0]}
        justifyContent={"space-between"}
        w="full"
      >
        Next
        <Icon as={HiArrowRight} />
      </Button>
    </FormCard>
  );
}
