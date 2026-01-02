import { HStack, Text, Image, StackProps } from "@chakra-ui/react";

type Props = {
  leftText?: string;
  rightNode?: React.ReactNode;
  rightText?: string;
} & StackProps;

export function InfoLine(props: Props) {
  const rightNode = () => {
    if (props.rightNode) {
      return props.rightNode;
    }
    return (
      <Text fontSize="sm" color="primary">
        {props.rightText}
      </Text>
    );
  };
  return (
    <HStack justify="space-between" px={1} {...props}>
      <Text fontSize="sm" color="fg.subtle">
        {props.leftText}
      </Text>
      {rightNode()}
    </HStack>
  );
}
