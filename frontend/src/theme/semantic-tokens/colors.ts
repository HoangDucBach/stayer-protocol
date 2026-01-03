import { defineSemanticTokens } from "@chakra-ui/react";

export const colors = defineSemanticTokens.colors({
  bg: {
    DEFAULT: {
      value: {
        _light: "#fae4cf",
        _dark: "#0a0f23",
      },
    },
    subtle: {
      value: {
        _light: "#eed9c5",
        _dark: "{colors.gray.950}",
      },
    },
    muted: {
      value: {
        _light: "{colors.gray.100}",
        _dark: "{colors.gray.900}",
      },
    },
    emphasized: {
      value: {
        _light: "#cfaa7c",
        _dark: "{colors.gray.800}",
      },
    },
    inverted: {
      value: {
        _light: "{colors.black}",
        _dark: "{colors.white}",
      },
    },
    panel: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.gray.950}",
      },
    },
    error: {
      value: {
        _light: "{colors.red.50}",
        _dark: "{colors.red.950}",
      },
    },
    warning: {
      value: {
        _light: "{colors.orange.50}",
        _dark: "{colors.orange.950}",
      },
    },
    success: {
      value: {
        _light: "{colors.green.50}",
        _dark: "{colors.green.950}",
      },
    },
    info: {
      value: {
        _light: "{colors.blue.50}",
        _dark: "{colors.blue.950}",
      },
    },
  },
  fg: {
    DEFAULT: {
      value: {
        _light: "{colors.black}",
        _dark: "{colors.gray.50}",
      },
    },
    muted: {
      value: {
        _light: "{colors.gray.600}",
        _dark: "{colors.gray.400}",
      },
    },
    subtle: {
      value: {
        _light: "#aea28e",
        _dark: "{colors.gray.400}",
      },
    },
    inverted: {
      value: {
        _light: "#ffe9d2",
        _dark: "{colors.gray.50}",
      },
    },
    error: {
      value: {
        _light: "{colors.red.500}",
        _dark: "{colors.red.400}",
      },
    },
    warning: {
      value: {
        _light: "{colors.yellow.600}",
        _dark: "{colors.orange.300}",
      },
    },
    success: {
      value: {
        _light: "{colors.green.600}",
        _dark: "{colors.green.300}",
      },
    },
    info: {
      value: {
        _light: "{colors.blue.600}",
        _dark: "{colors.blue.300}",
      },
    },
  },
  border: {
    DEFAULT: {
      value: {
        _light: "{colors.gray.200}",
        _dark: "{colors.gray.800}",
      },
    },
    muted: {
      value: {
        _light: "{colors.gray.100}",
        _dark: "{colors.gray.900}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.gray.50}",
        _dark: "{colors.gray.950}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.gray.300}",
        _dark: "{colors.gray.700}",
      },
    },
    inverted: {
      value: {
        _light: "{colors.gray.800}",
        _dark: "{colors.gray.200}",
      },
    },
    error: {
      value: {
        _light: "{colors.red.500}",
        _dark: "{colors.red.400}",
      },
    },
    warning: {
      value: {
        _light: "{colors.orange.500}",
        _dark: "{colors.orange.400}",
      },
    },
    success: {
      value: {
        _light: "{colors.green.500}",
        _dark: "{colors.green.400}",
      },
    },
    info: {
      value: {
        _light: "{colors.blue.500}",
        _dark: "{colors.blue.400}",
      },
    },
  },
  gray: {
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.black}",
      },
    },
    fg: {
      value: {
        _light: "{colors.gray.800}",
        _dark: "{colors.gray.200}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.gray.100}",
        _dark: "{colors.gray.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.gray.200}",
        _dark: "{colors.gray.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.gray.300}",
        _dark: "{colors.gray.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.gray.900}",
        _dark: "{colors.white}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.gray.400}",
        _dark: "{colors.gray.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.gray.200}",
        _dark: "{colors.gray.800}",
      },
    },
  },
  red: {
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.white}",
      },
    },
    fg: {
      value: {
        _light: "{colors.demonicRed.700}",
        _dark: "{colors.demonicRed.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.demonicRed.100}",
        _dark: "{colors.demonicRed.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.demonicRed.200}",
        _dark: "{colors.demonicRed.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.demonicRed.300}",
        _dark: "{colors.demonicRed.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.demonicRed.600}",
        _dark: "{colors.demonicRed.600}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.demonicRed.400}",
        _dark: "{colors.demonicRed.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.demonicRed.500}",
        _dark: "{colors.demonicRed.400}",
      },
    },
  },
  secondary: {
    DEFAULT: {
      value: {
        _light: "{colors.demonicRed.600}",
        _dark: "{colors.demonicRed.600}",
      },
    },
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.white}",
      },
    },
    fg: {
      value: {
        _light: "{colors.demonicRed.700}",
        _dark: "{colors.demonicRed.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.demonicRed.100}",
        _dark: "{colors.demonicRed.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.demonicRed.200}",
        _dark: "{colors.demonicRed.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.demonicRed.300}",
        _dark: "{colors.demonicRed.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.demonicRed.600}",
        _dark: "{colors.demonicRed.600}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.demonicRed.400}",
        _dark: "{colors.demonicRed.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.demonicRed.500}",
        _dark: "{colors.demonicRed.400}",
      },
    },
  },
  orange: {
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.black}",
      },
    },
    fg: {
      value: {
        _light: "{colors.orange.700}",
        _dark: "{colors.orange.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.orange.100}",
        _dark: "{colors.orange.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.orange.200}",
        _dark: "{colors.orange.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.orange.300}",
        _dark: "{colors.orange.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.orange.500}",
        _dark: "{colors.orange.500}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.orange.400}",
        _dark: "{colors.orange.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.orange.500}",
        _dark: "{colors.orange.400}",
      },
    },
  },
  primary: {
    DEFAULT: {
      value: {
        _light: "{colors.orange.500}",
        _dark: "{colors.orange.500}",
      },
    },
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.black}",
      },
    },
    fg: {
      value: {
        _light: "{colors.orange.700}",
        _dark: "{colors.orange.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.orange.100}",
        _dark: "{colors.orange.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.orange.200}",
        _dark: "{colors.orange.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.orange.300}",
        _dark: "{colors.orange.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.orange.500}",
        _dark: "{colors.orange.500}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.orange.400}",
        _dark: "{colors.orange.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.orange.500}",
        _dark: "{colors.orange.400}",
      },
    },
  },
  green: {
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.white}",
      },
    },
    fg: {
      value: {
        _light: "{colors.green.700}",
        _dark: "{colors.green.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.green.100}",
        _dark: "{colors.green.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.green.200}",
        _dark: "{colors.green.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.green.300}",
        _dark: "{colors.green.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.green.600}",
        _dark: "{colors.green.600}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.green.400}",
        _dark: "{colors.green.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.green.500}",
        _dark: "{colors.green.400}",
      },
    },
  },
  blue: {
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.white}",
      },
    },
    fg: {
      value: {
        _light: "{colors.blue.700}",
        _dark: "{colors.blue.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.blue.100}",
        _dark: "{colors.blue.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.blue.200}",
        _dark: "{colors.blue.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.blue.300}",
        _dark: "{colors.blue.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.blue.600}",
        _dark: "{colors.blue.600}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.blue.400}",
        _dark: "{colors.blue.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.blue.500}",
        _dark: "{colors.blue.400}",
      },
    },
  },
  yellow: {
    contrast: {
      value: {
        _light: "{colors.black}",
        _dark: "{colors.black}",
      },
    },
    fg: {
      value: {
        _light: "{colors.yellow.800}",
        _dark: "{colors.yellow.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.yellow.100}",
        _dark: "{colors.yellow.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.yellow.200}",
        _dark: "{colors.yellow.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.yellow.300}",
        _dark: "{colors.yellow.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.yellow.300}",
        _dark: "{colors.yellow.300}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.yellow.400}",
        _dark: "{colors.yellow.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.yellow.500}",
        _dark: "{colors.yellow.500}",
      },
    },
  },
  teal: {
    contrast: {
      value: {
        _light: "{colors.creamBrown.200}",
        _dark: "{colors.creamBrown.200}",
      },
    },
    fg: {
      value: {
        _light: "{colors.creamBrown.700}",
        _dark: "{colors.creamBrown.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.creamBrown.100}",
        _dark: "{colors.creamBrown.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.creamBrown.200}",
        _dark: "{colors.creamBrown.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.creamBrown.300}",
        _dark: "{colors.creamBrown.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.creamBrown.500}",
        _dark: "{colors.creamBrown.500}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.creamBrown.400}",
        _dark: "{colors.creamBrown.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.creamBrown.500}",
        _dark: "{colors.creamBrown.400}",
      },
    },
  },
  purple: {
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.white}",
      },
    },
    fg: {
      value: {
        _light: "{colors.purple.700}",
        _dark: "{colors.purple.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.purple.100}",
        _dark: "{colors.purple.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.purple.200}",
        _dark: "{colors.purple.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.purple.300}",
        _dark: "{colors.purple.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.purple.600}",
        _dark: "{colors.purple.600}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.purple.400}",
        _dark: "{colors.purple.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.purple.500}",
        _dark: "{colors.purple.400}",
      },
    },
  },
  pink: {
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.white}",
      },
    },
    fg: {
      value: {
        _light: "{colors.pink.700}",
        _dark: "{colors.pink.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.pink.100}",
        _dark: "{colors.pink.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.pink.200}",
        _dark: "{colors.pink.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.pink.300}",
        _dark: "{colors.pink.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.pink.600}",
        _dark: "{colors.pink.600}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.pink.400}",
        _dark: "{colors.pink.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.pink.500}",
        _dark: "{colors.pink.400}",
      },
    },
  },
  cyan: {
    contrast: {
      value: {
        _light: "{colors.white}",
        _dark: "{colors.white}",
      },
    },
    fg: {
      value: {
        _light: "{colors.cyan.700}",
        _dark: "{colors.cyan.300}",
      },
    },
    subtle: {
      value: {
        _light: "{colors.cyan.100}",
        _dark: "{colors.cyan.900}",
      },
    },
    muted: {
      value: {
        _light: "{colors.cyan.200}",
        _dark: "{colors.cyan.800}",
      },
    },
    emphasized: {
      value: {
        _light: "{colors.cyan.300}",
        _dark: "{colors.cyan.700}",
      },
    },
    solid: {
      value: {
        _light: "{colors.cyan.600}",
        _dark: "{colors.cyan.600}",
      },
    },
    focusRing: {
      value: {
        _light: "{colors.cyan.400}",
        _dark: "{colors.cyan.400}",
      },
    },
    border: {
      value: {
        _light: "{colors.cyan.500}",
        _dark: "{colors.cyan.400}",
      },
    },
  },
});
