import { refreshAccessToken } from '@/api';

export const authorizedFetch = async (
    input: RequestInfo,
    init: RequestInit = {}
): Promise<Response | void> => {
    const token = localStorage.getItem('access_token');

    const updatedInit: RequestInit = {
        ...init,
        headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
    };

    const response = await fetch(input, updatedInit);

    if (response.status === 403) {
        const refreshed: boolean = await refreshAccessToken();

        if (refreshed) {
            const newToken = localStorage.getItem('access_token');
            const retryInit: RequestInit = {
                ...init,
                headers: {
                    ...init.headers,
                    Authorization: `Bearer ${newToken}`,
                },
                credentials: 'include',
            };

            return await fetch(input, retryInit);
        } else {
            localStorage.removeItem('access_token');
            window.location.href = '/';
            return;
        }
    }

    return response;
};
export const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};
