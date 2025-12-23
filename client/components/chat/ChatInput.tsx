import { Send } from 'lucide-react';

interface ChatInputProps {
    draft: string;
    onDraftChange: (value: string) => void;
    onSend: () => void;
    isDisabled: boolean;
    isPending: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    draft,
    onDraftChange,
    onSend,
    isDisabled,
    isPending,
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (draft.trim() && !isDisabled && !isPending) {
                onSend();
            }
        }
    };

    return (
        <div className="flex items-end gap-3">
            <textarea
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                    isDisabled
                        ? 'Session expired. Please log in to continue.'
                        : 'Ask anything…'
                }
                rows={2}
                disabled={isDisabled}
                className="min-h-[72px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
                onClick={onSend}
                className="mb-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-px hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDisabled || isPending || !draft.trim()}
            >
                <Send className="h-4 w-4" />
                Send
            </button>
        </div>
    );
};

