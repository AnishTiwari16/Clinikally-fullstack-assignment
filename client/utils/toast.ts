import toast from 'react-hot-toast';
import { TOAST_CONFIG } from '@/constants';

export const showErrorToast = (message: string): void => {
    toast.error(message, TOAST_CONFIG);
};

export const showSuccessToast = (message: string): void => {
    toast.success(message, TOAST_CONFIG);
};
