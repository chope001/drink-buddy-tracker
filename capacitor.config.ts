import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.safesip',
  appName: 'SafeSip',
  webDir: 'dist',
  // NOTE: For local development with hot-reload from the Lovable sandbox,
  // temporarily uncomment the `server` block below. REMOVE it before
  // building for the App Store — Apple rejects apps that load remote URLs.
  //
  // server: {
  //   url: 'https://38061769-8160-4aab-b929-08e46d63283c.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
