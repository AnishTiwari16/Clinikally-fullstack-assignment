'use client';
import {
    addSession,
    getAllSessions,
    getSessionMessges,
    getUserInfo,
    queryLLM,
} from '@/api';
import { formatTimestamp } from '@/helpers';
import { useLogOut } from '@/hooks/logout';
import { queryClient } from '@/providers';
import { Message, Thread } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    Clock,
    LogOut,
    Menu,
    MessageSquare,
    Plus,
    Send,
    X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

const greetingMessage: Message = {
    id: 'greet-1',
    role: 'assistant',
    content: 'Hi there! What would you like to ask?',
    timestamp: 'just now',
};

const seedThreads: Thread[] = [
    {
        id: 't1',
        title: 'New Conversation',
        lastUpdated: 'just now',
        preview: greetingMessage.content,
        messages: [greetingMessage],
    },
];

export default function ChatPage() {
    const [threads, setThreads] = useState<Thread[]>(seedThreads);
    const [activeThreadId, setActiveThreadId] = useState<string>(
        seedThreads[0]?.id
    );
    const [draft, setDraft] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logoutMutation } = useLogOut();
    const router = useRouter();
    const pathname = usePathname();
    const sessionId = pathname?.split('/chat/')[1];
    const {
        data: userInfo,
        isError: unauthorized,
        isSuccess: authorized,
    } = useQuery({
        queryKey: ['users_info'],
        queryFn: getUserInfo,
        retry: 0,
    });
    const { data: sessionList, isPending: isSessionPending } = useQuery({
        queryKey: ['sesssion_list'],
        queryFn: getAllSessions,
        retry: 0,
        enabled: authorized,
    });
    const { data: sessionHistory, isFetching } = useQuery({
        queryKey: ['get_session_history'],
        queryFn: () => getSessionMessges({ session_id: sessionId }),
        retry: 0,
        enabled: authorized && !!sessionId,
    });
    const handleSendMutation = useMutation({
        mutationFn: queryLLM,
    });
    const addSessionMutation = useMutation({
        mutationFn: addSession,
        onSuccess: (data) => {
            const session = data?.session;
            if (session?.id) {
                queryClient.setQueryData(['sesssion_list'], (old: any) => {
                    if (!old || !old.sessions) return { sessions: [session] };
                    return { sessions: [session, ...old.sessions] };
                });
                ensureThread(session.id);
                setActiveThreadId(session.id);
                setIsSidebarOpen(false);
            }
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
    const activeThread = useMemo(
        () => threads.find((t) => t.id === activeThreadId) ?? threads[0],
        [threads, activeThreadId]
    );

    const ensureThread = (id: string) => {
        setThreads((prev) => {
            const exists = prev.find((t) => t.id === id);
            if (exists) return prev;
            return [
                {
                    id,
                    title: 'New Conversation',
                    lastUpdated: 'just now',
                    preview: greetingMessage.content,
                    messages: [
                        {
                            ...greetingMessage,
                            id: `greet-${id}`,
                        },
                    ],
                },
                ...prev,
            ];
        });
    };

    useEffect(() => {
        if (!authorized || !sessionId || !sessionHistory) return;

        const historyMessages: Message[] = sessionHistory.map(
            (m: { role: string; content: string }) => ({
                role:
                    m.role === 'user' || m.role === 'assistant'
                        ? m.role
                        : 'assistant',
                content: m.content ?? '',
            })
        );

        setThreads((prev) => {
            const existing = prev.find((t) => t.id === sessionId);
            const preview =
                historyMessages[historyMessages.length - 1]?.content ??
                greetingMessage.content;

            if (existing) {
                return prev.map((t) =>
                    t.id === sessionId
                        ? {
                              ...t,
                              messages: historyMessages,
                              preview,
                          }
                        : t
                );
            }

            return [
                {
                    id: sessionId,
                    title: 'New Conversation',
                    lastUpdated: 'just now',
                    preview,
                    messages: historyMessages,
                },
                ...prev,
            ];
        });

        setActiveThreadId(sessionId);
    }, [authorized, sessionId, sessionHistory]);

    const handleSend = () => {
        if (!draft.trim() || !activeThread) return;
        const userMessageId = crypto.randomUUID();
        const assistantMessageId = crypto.randomUUID();
        const newMessage: Message = {
            id: userMessageId,
            role: 'user',
            content: draft.trim(),
            timestamp: 'just now',
        };
        setThreads((prev) =>
            prev.map((thread) =>
                thread.id === activeThread.id
                    ? {
                          ...thread,
                          lastUpdated: 'just now',
                          preview: newMessage.content.slice(0, 80),
                          messages: [
                              ...thread.messages,
                              newMessage,
                              {
                                  id: assistantMessageId,
                                  role: 'assistant',
                                  content: 'Thinking…',
                                  timestamp: 'just now',
                              },
                          ],
                      }
                    : thread
            )
        );
        setDraft('');
        handleSendMutation.mutate(
            { input_query: draft.trim(), session_id: sessionId },
            {
                onSuccess: (data) => {
                    if (!data || !data.response) {
                        toast.error('No response from AI');
                        return;
                    }
                    setThreads((prev) =>
                        prev.map((thread) =>
                            thread.id === activeThread.id
                                ? {
                                      ...thread,
                                      messages: thread.messages.map((msg) =>
                                          msg.id === assistantMessageId
                                              ? {
                                                    ...msg,
                                                    content: data.response,
                                                }
                                              : msg
                                      ),
                                  }
                                : thread
                        )
                    );
                    router.push(`/chat/${data.session_id}`);
                },
                onError: (error) => {
                    setThreads((prev) =>
                        prev.map((thread) =>
                            thread.id === activeThread.id
                                ? {
                                      ...thread,
                                      messages: thread.messages.map((msg) =>
                                          msg.id === assistantMessageId
                                              ? {
                                                    ...msg,
                                                    content:
                                                        'Failed to fetch response.',
                                                }
                                              : msg
                                      ),
                                  }
                                : thread
                        )
                    );
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
            }
        );
    };

    const handleNewThread = () => {
        if (unauthorized) {
            return toast.error(`You need to Login first`, {
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
        }
        addSessionMutation.mutate();
    };

    const handleLogout = () => {
        setIsSidebarOpen(false);
        logoutMutation.mutate();
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-50 w-80 flex-col border-r border-white/10 bg-slate-950 p-4 transform transition-transform duration-300 ease-in-out ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 md:flex`}
            >
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <MessageSquare className="h-4 w-4 text-cyan-300" />
                        Threads
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNewThread}
                            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={addSessionMutation.isPending}
                        >
                            {addSessionMutation.isPending ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                            ) : (
                                <Plus className="h-3.5 w-3.5" />
                            )}
                            New
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden inline-flex items-center justify-center rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
                            aria-label="Close sidebar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {isSessionPending ? (
                        <>
                            {[1, 2].map((i) => (
                                <div
                                    key={`session-shimmer-${i}`}
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-3 bg-white/20 rounded animate-pulse w-24" />
                                        <div className="h-3 bg-white/10 rounded animate-pulse w-16" />
                                    </div>
                                    <div className="h-3 bg-white/10 rounded animate-pulse w-full" />
                                </div>
                            ))}
                        </>
                    ) : (
                        (sessionList?.sessions).map((session: any) => {
                            const isActive = session.id === activeThread?.id;

                            return (
                                <Link
                                    key={session.id}
                                    href={`/chat/${session.id}`}
                                    onClick={() => {
                                        ensureThread(session.id);
                                        setActiveThreadId(session.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full block rounded-2xl border px-4 py-3 text-left transition ${
                                        isActive
                                            ? 'border-cyan-500/40 bg-cyan-500/10'
                                            : 'border-white/5 bg-white/5 hover:border-white/15'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-xs text-slate-300">
                                        <span className="font-semibold text-white">
                                            Conversation
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                            <Clock className="h-3 w-3" />
                                            {formatTimestamp(
                                                session.created_at
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs text-slate-300">
                                        {greetingMessage.content}
                                    </p>
                                </Link>
                            );
                        })
                    )}
                </div>

                {authorized && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-3">
                            <Image
                                src={userInfo.user.profile_url}
                                alt="user_profile"
                                height={40}
                                width={40}
                                className="flex items-center justify-center rounded-full"
                            />

                            <div className="flex-1">
                                <p className="text-sm font-semibold text-white">
                                    {userInfo.user.email.split('@')[0]}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="cursor-pointer inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                                aria-label="Log out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            <main className="flex flex-1 flex-col overflow-hidden">
                <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 sm:px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden inline-flex items-center justify-center rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
                            aria-label="Open sidebar"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                                Chat console
                            </p>
                            <h1 className="text-xl font-semibold text-white">
                                {activeThread?.title ?? 'Conversation'}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={handleNewThread}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-cyan-500/30 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New chat</span>
                    </button>
                </header>

                <section className="flex flex-1 flex-col gap-4 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6 sm:px-8 overflow-hidden min-h-0">
                    <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 min-h-0">
                        {isFetching && sessionId ? (
                            <>
                                {[1, 2].map((i) => (
                                    <div
                                        key={`shimmer-${i}`}
                                        className="flex justify-start"
                                    >
                                        <div className="max-w-3xl rounded-2xl bg-white/10 border border-white/10 px-4 py-3 w-full">
                                            <div className="space-y-2">
                                                <div className="h-3 bg-white/20 rounded animate-pulse" />
                                            </div>
                                            <div className="mt-2 h-3 bg-white/10 rounded animate-pulse w-16" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                {activeThread?.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${
                                            message.role === 'user'
                                                ? 'justify-end'
                                                : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${
                                                message.role === 'user'
                                                    ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/30'
                                                    : 'bg-white/10 text-slate-100 border border-white/10'
                                            }`}
                                        >
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[
                                                    rehypeHighlight,
                                                ]}
                                            >
                                                {message.content}
                                            </ReactMarkdown>

                                            <span className="mt-1 block text-[11px] text-slate-300/80">
                                                {message.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                    <div className="shrink-0 space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-3 shadow-inner shadow-black/40 sm:p-4">
                        <div className="flex items-end gap-3">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder={
                                    unauthorized
                                        ? 'Session expired. Please log in to continue.'
                                        : 'Ask anything…'
                                }
                                rows={2}
                                disabled={unauthorized}
                                className="min-h-[72px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            <button
                                onClick={handleSend}
                                className="mb-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-px hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={
                                    !draft.trim() ||
                                    unauthorized ||
                                    handleSendMutation.isPending
                                }
                            >
                                <Send className="h-4 w-4" />
                                Send
                            </button>
                        </div>

                        {unauthorized && (
                            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                                    Session needed
                                </span>
                                <span className="text-xs text-amber-50/80">
                                    You need to log in to continue chatting.
                                </span>
                                <button
                                    onClick={() => router.replace('/')}
                                    className="cursor-pointer ml-auto inline-flex items-center justify-center rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-900 shadow transition hover:-translate-y-px hover:bg-white"
                                >
                                    Go to login
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
