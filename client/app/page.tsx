'use client';
import { loginApi } from '@/api';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Home() {
    const router = useRouter();
    const mutation = useMutation({
        mutationFn: loginApi,
        onSuccess: (data) => {
            localStorage.setItem('access_token', data.access_token);
            router.replace('/chat');
        },
        onError: (error) => {
            toast.error(`${error}`, {
                style: {
                    padding: '8px',
                    color: '#000',
                    backgroundColor: '#9ca3af',
                },
                iconTheme: {
                    primary: '#00b8db',
                    secondary: '#000',
                },
            });
        },
    });
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-12 text-slate-50">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            <main className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-lg md:grid-cols-[1.05fr_0.95fr]">
                <section className="flex flex-col gap-8 p-10 md:p-12">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                            <span className="text-lg font-semibold text-white">
                                AI
                            </span>
                        </div>

                        <div>
                            <p className="text-sm uppercase tracking-[0.22em] text-slate-300">
                                Clic Chat
                            </p>
                            <p className="text-sm text-slate-300">
                                Conversations that feel personal
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200 ring-1 ring-emerald-500/20">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            Secure access powered by AI
                        </p>
                        <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                            Welcome back. <br />
                            Sign in to start building with your assistant.
                        </h1>
                        <p className="max-w-xl text-base text-slate-200/80">
                            Chat with users, keep context, and respond
                            instantly. Choose how you want to start—email or
                            Google—and we will set up your workspace.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-slate-200/90">
                        {[
                            'Single workspace for teams',
                            'Session-aware conversations',
                            'Chat with any LLM providers',
                        ].map((item) => (
                            <span
                                key={item}
                                className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 ring-1 ring-white/10"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                                {item}
                            </span>
                        ))}
                    </div>
                </section>

                <section className="flex flex-col justify-between gap-10 bg-slate-950/50 p-10 ring-1 ring-white/5 md:p-12">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold text-white">
                            Login to continue
                        </h2>
                        <p className="text-sm text-slate-300">
                            Use your work email or continue with Google to jump
                            into the chat console.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <GoogleLogin
                            onSuccess={(response: CredentialResponse) => {
                                if (response.credential) {
                                    mutation.mutate({
                                        id_token: response.credential,
                                    });
                                }
                            }}
                            useOneTap={false}
                            auto_select={false}
                            width="400px"
                        />
                        <Link
                            href={'/chat'}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                        >
                            Explore now
                        </Link>
                    </div>
                    <p className="text-xs text-slate-400">
                        By continuing you agree to our Terms and acknowledge our
                        Privacy Policy.
                    </p>
                </section>
            </main>
        </div>
    );
}
