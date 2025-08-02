import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.795aa452ff264a5cb5be3c647e01e484',
  appName: 'dual-sphere-app',
  webDir: 'dist',
  server: {
    url: 'https://795aa452-ff26-4a5c-b5be-3c647e01e484.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;