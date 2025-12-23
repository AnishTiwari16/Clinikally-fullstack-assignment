import { API_URL } from '@/config';
import { setAccessToken } from '@/utils/storage';
import { authorizedFetch, parseJsonResponse } from '@/utils/api';
import type {
    LoginResponse,
    UserInfoResponse,
    SessionListResponse,
    SessionHistoryItem,
    QueryResponse,
    AddSessionResponse,
} from '@/types';

/**
 * Login with Google ID token
 */
export const loginApi = async ({
    id_token,
}: {
    id_token: string;
}): Promise<LoginResponse> => {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            Authorization: `Bearer ${id_token}`,
        },
    });

    const data = await parseJsonResponse<LoginResponse | { error: string }>(
        res
    );

    if ('error' in data) {
        throw new Error(data.error || 'Login failed');
    }

    if (data.access_token) {
        setAccessToken(data.access_token);
    }

    return data;
};

/**
 * Get current user information
 */
export const getUserInfo = async (): Promise<UserInfoResponse> => {
    const res = await authorizedFetch(`${API_URL}/user-info`, {
        method: 'GET',
    });

    return parseJsonResponse<UserInfoResponse>(res);
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/refresh-token`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!res.ok) return false;

        const data = await parseJsonResponse<{ access_token: string }>(res);
        setAccessToken(data.access_token);
        return true;
    } catch (err) {
        console.error('Failed to refresh access token:', err);
        return false;
    }
};

/**
 * Query LLM with input and session
 */
export const queryLLM = async ({
    input_query,
    session_id,
}: {
    input_query: string;
    session_id: string;
}): Promise<QueryResponse> => {
    const res = await authorizedFetch(`${API_URL}/query`, {
        method: 'POST',
        body: JSON.stringify({
            input_query,
            session_id,
        }),
    });

    return parseJsonResponse<QueryResponse>(res);
};

/**
 * Create a new session
 */
export const addSession = async (): Promise<AddSessionResponse> => {
    const res = await authorizedFetch(`${API_URL}/add-session`, {
        method: 'POST',
    });

    return parseJsonResponse<AddSessionResponse>(res);
};

/**
 * Get all user sessions
 */
export const getAllSessions = async (): Promise<SessionListResponse> => {
    const res = await authorizedFetch(`${API_URL}/get-sessions`, {
        method: 'GET',
    });

    return parseJsonResponse<SessionListResponse>(res);
};

/**
 * Get messages for a specific session
 */
export const getSessionMessges = async ({
    session_id,
}: {
    session_id: string;
}): Promise<SessionHistoryItem[]> => {
    const res = await authorizedFetch(
        `${API_URL}/sessions/${session_id}/messages`,
        {
            method: 'GET',
        }
    );

    return parseJsonResponse<SessionHistoryItem[]>(res);
};
