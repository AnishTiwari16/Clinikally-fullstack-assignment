'use client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
const queryClient = new QueryClient();
const Providers = ({ children }: { children: ReactNode }) => {
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
