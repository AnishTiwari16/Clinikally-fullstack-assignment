'use client';
import {
    addSession,
    getAllSessions,
    getSessionMessges,
    getUserInfo,
    queryLLM,
} from '@/api';
import { useLogOut } from '@/hooks/logout';
import { queryClient } from '@/providers';
import { Message, Thread, SessionHistoryItem } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LogOut, Menu, MessageSquare, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { showErrorToast } from '@/utils/toast';
import { QUERY_KEYS, DEFAULT_MESSAGES } from '@/constants';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { SessionItem } from '@/components/chat/SessionItem';
import { ChatInput } from '@/components/chat/ChatInput';

// Constants
const GREETING_MESSAGE: Message = {
    id: 'greet-1',
    role: 'assistant',
    content: DEFAULT_MESSAGES.GREETING,
    timestamp: 'just now',
};

const SEED_THREAD: Thread = {
    id: 't1',
    title: 'New Conversation',
    lastUpdated: 'just now',
    preview: GREETING_MESSAGE.content,
    messages: [GREETING_MESSAGE],
};

// Helper functions
const createGreetingMessage = (id: string): Message => ({
    ...GREETING_MESSAGE,
    id: `greet-${id}`,
});

const createNewThread = (id: string, preview?: string): Thread => ({
    id,
    title: 'New Conversation',
    lastUpdated: 'just now',
    preview: preview ?? GREETING_MESSAGE.content,
    messages: preview ? [] : [createGreetingMessage(id)],
});

const normalizeMessage = (m: SessionHistoryItem, index: number): Message => ({
    role:
        m.role === 'user' || m.role === 'assistant'
            ? (m.role as 'user' | 'assistant')
            : 'assistant',
    content: m.content ?? '',
    id: `msg-${index}-${crypto.randomUUID()}`,
    timestamp: 'just now',
});

export default function ChatPage() {
    const [threads, setThreads] = useState<Thread[]>([SEED_THREAD]);
    const [activeThreadId, setActiveThreadId] = useState<string>(
        SEED_THREAD.id
    );
    const [draft, setDraft] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logoutMutation } = useLogOut();
    const router = useRouter();
    const pathname = usePathname();
    const sessionId = useMemo(() => pathname?.split('/chat/')[1], [pathname]);

    // Queries
    const {
        data: userInfo,
        isError: unauthorized,
        isSuccess: authorized,
    } = useQuery({
        queryKey: QUERY_KEYS.USER_INFO,
        queryFn: getUserInfo,
        retry: 0,
    });

    const { data: sessionList, isPending: isSessionPending } = useQuery({
        queryKey: QUERY_KEYS.SESSION_LIST,
        queryFn: getAllSessions,
        retry: 0,
        enabled: authorized,
    });

    const { data: sessionHistory, isFetching } = useQuery({
        queryKey: QUERY_KEYS.SESSION_HISTORY(sessionId),
        queryFn: () => getSessionMessges({ session_id: sessionId! }),
        retry: 0,
        enabled: authorized && !!sessionId,
    });

    // Mutations
    const sendMessageMutation = useMutation({
        mutationFn: queryLLM,
    });

    const addSessionMutation = useMutation({
        mutationFn: addSession,
        onSuccess: (data) => {
            const session = data?.session;
            if (session?.id) {
                queryClient.setQueryData(
                    QUERY_KEYS.SESSION_LIST,
                    (old: any) => {
                        if (!old || !old.sessions)
                            return { sessions: [session] };
                        return { sessions: [session, ...old.sessions] };
                    }
                );
                ensureThread(session.id);
                setActiveThreadId(session.id);
                setIsSidebarOpen(false);
            }
        },
        onError: (error) => {
            showErrorToast(
                error instanceof Error ? error.message : String(error)
            );
        },
    });

    // Memoized values
    const activeThread = useMemo(
        () => threads.find((t) => t.id === activeThreadId) ?? threads[0],
        [threads, activeThreadId]
    );

    // Handlers
    const ensureThread = useCallback((id: string) => {
        setThreads((prev) => {
            const exists = prev.find((t) => t.id === id);
            if (exists) return prev;
            return [createNewThread(id), ...prev];
        });
    }, []);

    const updateThreadMessages = useCallback(
        (threadId: string, updater: (messages: Message[]) => Message[]) => {
            setThreads((prev) =>
                prev.map((thread) =>
                    thread.id === threadId
                        ? { ...thread, messages: updater(thread.messages) }
                        : thread
                )
            );
        },
        []
    );

    const updateThreadPreview = useCallback(
        (threadId: string, preview: string) => {
            setThreads((prev) =>
                prev.map((thread) =>
                    thread.id === threadId
                        ? { ...thread, preview, lastUpdated: 'just now' }
                        : thread
                )
            );
        },
        []
    );

    // Load session history
    useEffect(() => {
        if (!authorized || !sessionId || !sessionHistory) return;

        const historyMessages = sessionHistory.map((m, index) =>
            normalizeMessage(m, index)
        );
        const preview =
            historyMessages[historyMessages.length - 1]?.content ??
            GREETING_MESSAGE.content;

        setThreads((prev) => {
            const existing = prev.find((t) => t.id === sessionId);
            if (existing) {
                return prev.map((t) =>
                    t.id === sessionId
                        ? { ...t, messages: historyMessages, preview }
                        : t
                );
            }
            // Create new thread with history messages
            return [
                {
                    id: sessionId,
                    title: 'New Conversation',
                    lastUpdated: 'just now',
                    preview,
                    messages:
                        historyMessages.length > 0
                            ? historyMessages
                            : [createGreetingMessage(sessionId)],
                },
                ...prev,
            ];
        });

        setActiveThreadId(sessionId);
    }, [authorized, sessionId, sessionHistory]);

    const handleSend = useCallback(() => {
        if (!draft.trim() || !activeThread) return;

        const userMessageId = crypto.randomUUID();
        const assistantMessageId = crypto.randomUUID();
        const userMessage: Message = {
            id: userMessageId,
            role: 'user',
            content: draft.trim(),
            timestamp: 'just now',
        };

        const thinkingMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: DEFAULT_MESSAGES.THINKING,
            timestamp: 'just now',
        };

        updateThreadMessages(activeThread.id, (messages) => [
            ...messages,
            userMessage,
            thinkingMessage,
        ]);
        updateThreadPreview(activeThread.id, userMessage.content.slice(0, 80));

        const trimmedDraft = draft.trim();
        setDraft('');

        sendMessageMutation.mutate(
            { input_query: trimmedDraft, session_id: sessionId },
            {
                onSuccess: (data) => {
                    if (!data?.response) {
                        showErrorToast(DEFAULT_MESSAGES.NO_RESPONSE);
                        updateThreadMessages(activeThread.id, (messages) =>
                            messages.map((msg) =>
                                msg.id === assistantMessageId
                                    ? {
                                          ...msg,
                                          content: DEFAULT_MESSAGES.FAILED,
                                      }
                                    : msg
                            )
                        );
                        return;
                    }

                    updateThreadMessages(activeThread.id, (messages) =>
                        messages.map((msg) =>
                            msg.id === assistantMessageId
                                ? { ...msg, content: data.response }
                                : msg
                        )
                    );

                    if (data.session_id) {
                        router.push(`/chat/${data.session_id}`);
                    }
                },
                onError: (error) => {
                    updateThreadMessages(activeThread.id, (messages) =>
                        messages.map((msg) =>
                            msg.id === assistantMessageId
                                ? {
                                      ...msg,
                                      content: DEFAULT_MESSAGES.FAILED,
                                  }
                                : msg
                        )
                    );
                    showErrorToast(
                        error instanceof Error ? error.message : String(error)
                    );
                },
            }
        );
    }, [
        draft,
        activeThread,
        sessionId,
        sendMessageMutation,
        updateThreadMessages,
        updateThreadPreview,
        router,
    ]);

    const handleNewThread = useCallback(() => {
        if (unauthorized) {
            showErrorToast('You need to Login first');
            return;
        }
        addSessionMutation.mutate();
    }, [unauthorized, addSessionMutation]);

    const handleLogout = useCallback(() => {
        setIsSidebarOpen(false);
        logoutMutation.mutate();
    }, [logoutMutation]);

    const handleSessionSelect = useCallback(
        (sessionId: string) => {
            ensureThread(sessionId);
            setActiveThreadId(sessionId);
            setIsSidebarOpen(false);
        },
        [ensureThread]
    );

    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
    const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeSidebar}
                    aria-hidden="true"
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
                            onClick={closeSidebar}
                            className="md:hidden inline-flex items-center justify-center rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
                            aria-label="Close sidebar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {authorized && isSessionPending ? (
                        <LoadingShimmer />
                    ) : (
                        sessionList?.sessions.map((session) => (
                            <SessionItem
                                key={session.id}
                                session={session}
                                isActive={session.id === activeThread?.id}
                                onSelect={() => handleSessionSelect(session.id)}
                            />
                        ))
                    )}
                </div>

                {authorized && userInfo && (
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

            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-hidden">
                <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 sm:px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openSidebar}
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
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    <div className="shrink-0 space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-3 shadow-inner shadow-black/40 sm:p-4">
                        <ChatInput
                            draft={draft}
                            onDraftChange={setDraft}
                            onSend={handleSend}
                            isDisabled={unauthorized}
                            isPending={sendMessageMutation.isPending}
                        />

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
