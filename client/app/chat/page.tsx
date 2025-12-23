'use client';
import { useEffect, useMemo, useState } from 'react';
import { Clock, LogOut, MessageSquare, Plus, Send } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getUserInfo, queryLLM } from '@/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLogOut } from '@/hooks/logout';
import toast from 'react-hot-toast';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
};

type Thread = {
    id: string;
    title: string;
    lastUpdated: string;
    preview: string;
    messages: Message[];
};

const greetingMessage: Message = {
    id: 'greet-1',
    role: 'assistant',
    content: 'Hi there! What would you like to ask?',
    timestamp: 'just now',
};

const seedThreads: Thread[] = [
    {
        id: 't1',
        title: 'New conversation',
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
    const { logoutMutation } = useLogOut();
    const router = useRouter();

    const handleSendMutation = useMutation({
        mutationFn: queryLLM,
    });
    const activeThread = useMemo(
        () => threads.find((t) => t.id === activeThreadId) ?? threads[0],
        [threads, activeThreadId]
    );

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
            { input_query: draft.trim() },
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
        const id = crypto.randomUUID();
        const next: Thread = {
            id,
            title: 'New conversation',
            lastUpdated: 'just now',
            preview: greetingMessage.content,
            messages: [
                {
                    ...greetingMessage,
                    id: `greet-${id}`,
                },
            ],
        };
        setThreads((prev) => [next, ...prev]);
        setActiveThreadId(id);
        setDraft('');
    };

    const handleLogout = () => {
        logoutMutation.mutate();
    };
    const {
        data: userInfo,
        isError,
        isSuccess,
    } = useQuery({
        queryKey: ['users_info'],
        queryFn: getUserInfo,
        retry: 0,
    });
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-50">
            <aside className="hidden w-80 flex-col border-r border-white/10 bg-slate-950/40 p-4 md:flex">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <MessageSquare className="h-4 w-4 text-cyan-300" />
                        Threads
                    </div>
                    <button
                        onClick={handleNewThread}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New
                    </button>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {threads.map((thread) => {
                        const isActive = thread.id === activeThread?.id;
                        return (
                            <button
                                key={thread.id}
                                onClick={() => setActiveThreadId(thread.id)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                    isActive
                                        ? 'border-cyan-500/40 bg-cyan-500/10'
                                        : 'border-white/5 bg-white/5 hover:border-white/15'
                                }`}
                            >
                                <div className="flex items-center justify-between text-xs text-slate-300">
                                    <span className="font-semibold text-white">
                                        {thread.title}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                        <Clock className="h-3 w-3" />
                                        {thread.lastUpdated}
                                    </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-300">
                                    {thread.preview}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {isSuccess && (
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

            <main className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-6 py-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                            Chat console
                        </p>
                        <h1 className="text-xl font-semibold text-white">
                            {activeThread?.title ?? 'Conversation'}
                        </h1>
                    </div>
                    <button
                        onClick={handleNewThread}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-cyan-500/30 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
                    >
                        <Plus className="h-4 w-4" />
                        New chat
                    </button>
                </header>

                <section className="flex flex-1 flex-col gap-4 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6 sm:px-8">
                    <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
                        {activeThread && activeThread.messages.length === 0 && (
                            <p className="text-sm text-slate-400">
                                No messages yet. Brief the assistant to get
                                started.
                            </p>
                        )}
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
                                    <p className="whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                    <span className="mt-1 block text-[11px] text-slate-300/80">
                                        {message.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-3 shadow-inner shadow-black/40 sm:p-4">
                        <div className="flex items-end gap-3">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder={
                                    isError
                                        ? 'Session expired. Please log in to continue.'
                                        : 'Ask anything…'
                                }
                                rows={2}
                                disabled={isError}
                                className="min-h-[72px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            <button
                                onClick={handleSend}
                                className="mb-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-px hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={
                                    !draft.trim() ||
                                    isError ||
                                    handleSendMutation.isPending
                                }
                            >
                                <Send className="h-4 w-4" />
                                Send
                            </button>
                        </div>

                        {isError && (
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
