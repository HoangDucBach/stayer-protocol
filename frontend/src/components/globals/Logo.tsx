import {
  Box,
  BoxProps,
  Heading,
  HeadingProps,
  HStack,
  Text,
} from "@chakra-ui/react";
import { Favicon } from "./Favicon";

interface Props extends BoxProps {
  size?: number | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  nameProps?: HeadingProps;
}
export function Logo({ size = "md", nameProps, ...props }: Props) {
  const textSizeMap: Record<string, string> = {
    // > 1 size up from Favicon size
    "2xs": "xs",
    xs: "sm",
    sm: "md",
    md: "lg",
    lg: "xl",
    xl: "2xl",
    "2xl": "3xl",
  };

  const resolvedTextSize =
    typeof size === "number"
      ? `${size + 4}px`
      : textSizeMap[size] || textSizeMap["md"];

  return (
    <Box {...props}>
      <HStack align={"center"} gap={"2"}>
        <Favicon size={size} />
        <Heading
          as="h1"
          fontSize={resolvedTextSize}
          fontWeight="semibold"
          display="inline"
          {...nameProps}
        >
          Stayer
        </Heading>
      </HStack>
    </Box>
  );
}
