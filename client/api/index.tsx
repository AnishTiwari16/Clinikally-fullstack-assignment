import { API_URL } from '@/config';
import { authorizedFetch } from '@/helpers';

export const loginApi = async ({ id_token }: { id_token: string }) => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Authorization: `Bearer ${id_token}`,
            },
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Login failed');
        }
        return data;
    } catch (error) {
        throw error;
    }
};
export const getUserInfo = async () => {
    try {
        const res = await authorizedFetch(`${API_URL}/user-info`, {
            method: 'GET',
        });

        if (!res || !(res instanceof Response)) {
            throw new Error('No response from authorizedFetch');
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Fetching user info failed');
        }
        return data;
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
};
export const refreshAccessToken = async () => {
    try {
        const res = await fetch(`${API_URL}/refresh-token`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!res.ok) return false;

        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        return true;
    } catch (err) {
        console.error('Failed to refresh access token:', err);
        return false;
    }
};
export const queryLLM = async ({ input_query }: { input_query: string }) => {
    try {
        const res = await authorizedFetch(`${API_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input_query: input_query,
            }),
        });
        if (!res || !(res instanceof Response)) {
            throw new Error('No response from authorizedFetch');
        }

        const data = await res.json();
        return data;
    } catch (err) {
        console.log('failed to query', err);
        return false;
    }
};
