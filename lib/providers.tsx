"use client";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { ConversationProvider } from "./conversation-store";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "gray.50",
      },
    },
  },
  colors: {
    brand: {
      50: "#e6f0ff",
      100: "#b3d1ff",
      200: "#80b3ff",
      300: "#4d94ff",
      400: "#1a75ff",
      500: "#1a56db",
      600: "#1544b0",
      700: "#0f3385",
      800: "#0a225a",
      900: "#051130",
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <ConversationProvider>{children}</ConversationProvider>
    </ChakraProvider>
  );
}
