'use client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
export const queryClient = new QueryClient();
const Providers = ({ children }: { children: ReactNode }) => {
    const access_token = localStorage.getItem('access_token');
    const router = useRouter();
    React.useLayoutEffect(() => {
        if (access_token) {
            router.push('/chat');
        }
    }, [access_token]);
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
