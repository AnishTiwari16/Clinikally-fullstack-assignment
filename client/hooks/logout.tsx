import { useRouter } from 'next/navigation';
import { removeAccessToken } from '@/utils/storage';

export function useLogOut() {
    const router = useRouter();

    const logout = async () => {
        removeAccessToken();
        router.push('/');
    };

    const logoutMutation = {
        mutate: logout,
        isPending: false,
    };

    return {
        logoutMutation,
    };
}
