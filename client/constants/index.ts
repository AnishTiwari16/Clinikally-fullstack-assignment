// Toast Configuration
export const TOAST_CONFIG = {
    style: {
        padding: '8px',
        color: '#000',
        backgroundColor: '#9ca3af',
    },
    iconTheme: {
        primary: '#00b8db',
        secondary: '#000',
    },
} as const;

// Query Keys
export const QUERY_KEYS = {
    USER_INFO: ['users_info'],
    SESSION_LIST: ['session_list'],
    SESSION_HISTORY: (sessionId?: string) =>
        sessionId
            ? ['get_session_history', sessionId]
            : ['get_session_history'],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
} as const;

// Default Messages
export const DEFAULT_MESSAGES = {
    GREETING: 'Hi there! What would you like to ask?',
    THINKING: 'Thinking…',
    FAILED: 'Failed to fetch response.',
    NO_RESPONSE: 'No response from AI',
} as const;

