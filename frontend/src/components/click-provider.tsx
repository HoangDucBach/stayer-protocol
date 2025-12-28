"use client";

import {
  ClickProvider,
  ClickUI,
  CsprClickThemes,
} from "@make-software/csprclick-ui";
import { clickOptions } from "@/libs/click";
import { ThemeProvider } from "styled-components";

type Props = React.PropsWithChildren;

export function CasperClickProvider({ children }: Props) {
  return (
    <ThemeProvider theme={CsprClickThemes.light}>
      <ClickProvider options={clickOptions}>
        <ClickUI />
        {children}
      </ClickProvider>
    </ThemeProvider>
  );
}
