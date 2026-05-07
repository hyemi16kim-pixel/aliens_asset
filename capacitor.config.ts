import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alienbank.app",
  appName: "Alien Bank",
  webDir: "out",
  server: {
    url: "http://192.168.219.101:3000",
    cleartext: true,
  },
};

export default config;