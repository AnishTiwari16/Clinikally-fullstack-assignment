'use client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useLayoutEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { getAccessToken } from '@/utils/storage';

export const queryClient = new QueryClient();

const Providers = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();

    useLayoutEffect(() => {
        const token = getAccessToken();

        // Only redirect to /chat if user has token and is NOT already on a chat page
        if (token && !pathname?.startsWith('/chat')) {
            router.push('/chat');
        }
    }, [router, pathname]);

    return (
        <GoogleOAuthProvider clientId="740567164464-d5mr8bmcsoqs6mejbe4actuiu1cfdaqn.apps.googleusercontent.com">
            <QueryClientProvider client={queryClient}>
                <Toaster position="bottom-right" reverseOrder={false} />
                {children}
            </QueryClientProvider>
        </GoogleOAuthProvider>
    );
};

export default Providers;
