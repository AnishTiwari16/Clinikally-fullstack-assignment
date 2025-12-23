import { useRouter } from 'next/navigation';

export function useLogOut() {
    const router = useRouter();

    const logout = async () => {
        localStorage.removeItem('access_token');
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
