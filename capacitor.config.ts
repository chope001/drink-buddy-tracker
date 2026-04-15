import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.safesip',
  appName: 'SafeSip',
  webDir: 'dist',
  server: {
    url: 'https://38061769-8160-4aab-b929-08e46d63283c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
