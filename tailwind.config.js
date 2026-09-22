const flowbite = require("flowbite-react/tailwind");
const { heroui } = require("@heroui/react");
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}",
    flowbite.content(),
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",

  ],
  "darkMode": "class",
  theme: {
    extend: {
      screens: {
        drag: {
          "-webkit-app-region": "drag",
        },
        "no-drag": {
          "-webkit-app-region": "no-drag",
        },
      },
    },
  },
  plugins: [
    flowbite.plugin(),
    heroui()
  ],
}

