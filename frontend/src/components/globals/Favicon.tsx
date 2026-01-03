import { Image, ImageProps } from "@chakra-ui/react";
import NextImage from "next/image";

interface Props extends ImageProps {
  size?: number | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}
export function Favicon({ size = "md", ...rest }: Props) {
  const sizeMap: Record<string, number> = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 32,
    xl: 64,
    "2xl": 96,
  };
  const resolvedSize =
    typeof size === "number" ? size : sizeMap[size] || sizeMap["md"];

  return (
    <Image asChild boxSize={resolvedSize} {...rest}>
      <NextImage
        src="/assets/favicon.svg"
        alt="Favicon"
        width={resolvedSize as number}
        height={resolvedSize as number}
      />
    </Image>
  );
};
