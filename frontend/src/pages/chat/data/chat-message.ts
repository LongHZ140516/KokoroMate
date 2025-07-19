// 聊天角色类型定义
export type ChatRole = {
    id: string;
    avatar: string;
    name: string;
    bio: string;
};

// 聊天消息类型定义
export type ChatMessage = {
    sender: "You" | "Role";
    message: string;
    timestamp: Date;
    files: File[];
};
