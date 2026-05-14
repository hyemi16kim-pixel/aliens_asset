import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alienbank.app",
  appName: "Alien Bank",
  webDir: "out",
  server: {
    url: "https://aliens-asset.vercel.app",
    cleartext: false,
  },
};

export default config;