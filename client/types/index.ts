export type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
};

export type Thread = {
    id: string;
    title: string;
    lastUpdated: string;
    preview: string;
    messages: Message[];
};
