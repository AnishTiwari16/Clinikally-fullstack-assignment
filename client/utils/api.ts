import { API_URL } from '@/config';
import { getAccessToken, removeAccessToken, setAccessToken } from '@/utils/storage';
import { refreshAccessToken } from '@/api';

/**
 * Create headers with authorization token
 */
const createAuthHeaders = (): HeadersInit => {
    const token = getAccessToken();
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

/**
 * Handle 403 errors by refreshing token and retrying
 */
const handleAuthError = async (
    input: RequestInfo,
    init: RequestInit
): Promise<Response | null> => {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
        const newToken = getAccessToken();
        const retryInit: RequestInit = {
            ...init,
            headers: {
                ...init.headers,
                Authorization: `Bearer ${newToken}`,
            },
            credentials: 'include',
        };
        return await fetch(input, retryInit);
    }

    removeAccessToken();
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
    return null;
};

/**
 * Authorized fetch with automatic token refresh
 */
export const authorizedFetch = async (
    input: RequestInfo,
    init: RequestInit = {}
): Promise<Response | null> => {
    const updatedInit: RequestInit = {
        ...init,
        headers: {
            ...createAuthHeaders(),
            ...init.headers,
        },
        credentials: 'include',
    };

    const response = await fetch(input, updatedInit);

    if (response.status === 403) {
        return await handleAuthError(input, init);
    }

    return response;
};

/**
 * Parse JSON response with error handling
 */
export const parseJsonResponse = async <T>(
    response: Response | null
): Promise<T> => {
    if (!response) {
        throw new Error('No response received');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({
            error: 'Unknown error occurred',
        }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
};

