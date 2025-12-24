import Link from 'next/link';
import { Clock } from 'lucide-react';
import { formatTimestamp } from '@/helpers';
import type { Session } from '@/types';
import { DEFAULT_MESSAGES } from '@/constants';

interface SessionItemProps {
    session: Session;
    isActive: boolean;
    onSelect: () => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({
    session,
    isActive,
    onSelect,
}) => {
    return (
        <Link
            href={`/chat/${session.id}`}
            onClick={onSelect}
            className={`w-full block rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                    ? 'border-cyan-500/40 bg-cyan-500/10'
                    : 'border-white/5 bg-white/5 hover:border-white/15'
            }`}
        >
            <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-white">
                    {session.title}...
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(session.created_at)}
                </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-300">
                {DEFAULT_MESSAGES.GREETING}
            </p>
        </Link>
    );
};
