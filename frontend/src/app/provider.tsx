"use client";

import { Provider as ThemeProvider } from "@/components/ui/provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";

const CasperClickProvider = dynamic<React.PropsWithChildren>(
  () => import("@/components/click-provider").then((mod) => ({ default: mod.CasperClickProvider })),
  { ssr: false }
);

const queryClient = new QueryClient();

type Props = React.PropsWithChildren;
export default function Provider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <CasperClickProvider>
        <ThemeProvider defaultTheme="light" forcedTheme="light">{children}</ThemeProvider>
      </CasperClickProvider>
    </QueryClientProvider>
  );
}
