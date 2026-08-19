import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ballfill.game',
  appName: 'Ball Fill',
  webDir: 'dist',
  backgroundColor: '#eef7f9',
  android: {
    allowMixedContent: false,
  },
};

export default config;
