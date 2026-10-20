export const constants = {
  appName: 'BhanuTron',
  appVersion: '1.0.0',
  storageKeys: {
    theme: 'bhanutron-theme',
    token: 'bhanutron-token',
  },
  defaultPageSize: 10,
  debounce: {
    search: 300,
    input: 250,
  },
} as const;

export type Constants = typeof constants;
