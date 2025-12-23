import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${
                    isUser
                        ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/30'
                        : 'bg-white/10 text-slate-100 border border-white/10'
                }`}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                >
                    {message.content}
                </ReactMarkdown>
                <span className="mt-1 block text-[11px] text-slate-300/80">
                    {message.timestamp}
                </span>
            </div>
        </div>
    );
};

