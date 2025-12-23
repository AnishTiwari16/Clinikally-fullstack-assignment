import { STORAGE_KEYS } from '@/constants';

/**
 * SSR-safe localStorage getter
 */
export const getStorageItem = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error(`Error getting ${key} from localStorage:`, error);
        return null;
    }
};

/**
 * SSR-safe localStorage setter
 */
export const setStorageItem = (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.error(`Error setting ${key} in localStorage:`, error);
    }
};

/**
 * SSR-safe localStorage remover
 */
export const removeStorageItem = (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing ${key} from localStorage:`, error);
    }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
    return getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Set access token in localStorage
 */
export const setAccessToken = (token: string): void => {
    setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Remove access token from localStorage
 */
export const removeAccessToken = (): void => {
    removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
};

