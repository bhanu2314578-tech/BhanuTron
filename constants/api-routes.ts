export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
  },
  documents: '/api/documents',
  upload: '/api/upload',
  chat: '/api/chat',
  user: {
    profile: '/api/user/profile',
    update: '/api/user/update',
  },
} as const;
