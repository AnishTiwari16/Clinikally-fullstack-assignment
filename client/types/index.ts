export type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
};

export type Thread = {
    id: string;
    title: string;
    lastUpdated: string;
    preview: string;
    messages: Message[];
};

// API Response Types
export type LoginResponse = {
    access_token: string;
    user?: {
        email: string;
        profile_url: string;
    };
};

export type UserInfoResponse = {
    user: {
        email: string;
        profile_url: string;
    };
};

export type Session = {
    id: string;
    created_at: string;
};

export type SessionListResponse = {
    sessions: Session[];
};

export type SessionHistoryItem = {
    role: string;
    content: string;
};

export type QueryResponse = {
    response: string;
    session_id: string;
};

export type AddSessionResponse = {
    session: Session;
};

// Error Response
export type ErrorResponse = {
    error: string;
};
