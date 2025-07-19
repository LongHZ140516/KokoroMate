import { useEffect, useState, useRef } from 'react'
import {
    ChatContainerContent,
    ChatContainerRoot,
} from "@/components/ui/chat-container"
import {
    Message,
    MessageAvatar,
    MessageContent,
} from "@/components/ui/message"
import { ScrollButton } from '@/components/ui/scroll-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import type { ChatRole, ChatMessage } from '../data/chat-message'
import { getUserAvatar } from '../data/config-loader' // 导入获取用户头像的函数

// 聊天数据接口
interface ChatData {
    role: ChatRole;
    messages: ChatMessage[];
}

// 读取聊天数据的函数
async function loadChatData(filePath: string): Promise<ChatData | null> {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load chat data: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading chat data:', error);
        return null;
    }
}

interface ChatWindowProps {
    name: string;
    bio: string;
    avatar: string;
    chatDataPath?: string; // 可选，用于向后兼容
    messages?: ChatMessage[]; // 新增：从props接收消息
}

export function ChatWindow({ 
    name, 
    bio, 
    avatar, 
    chatDataPath,
    messages: propMessages
}: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [role, setRole] = useState<ChatRole | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userAvatar, setUserAvatar] = useState<string>('/avatars/user.png'); // 添加用户头像状态
    const containerRef = useRef<HTMLDivElement>(null);

    // console.log(name, bio, avatar, chatDataPath);

    // 加载用户头像
    useEffect(() => {
        const loadUserAvatar = async () => {
            try {
                const avatarPath = await getUserAvatar();
                setUserAvatar(avatarPath);
            } catch (error) {
                console.error('Failed to load user avatar:', error);
                // 保持默认头像
            }
        };

        loadUserAvatar();
    }, []);

    // 如果有传入的messages，优先使用props中的messages
    useEffect(() => {
        if (propMessages) {
            setMessages(propMessages);
            // 设置默认role（只在role为null时设置）
            if (!role) {
                setRole({
                    id: 'default',
                    avatar: avatar,
                    name: name,
                    bio: bio
                });
            }
            return;
        }

        // 如果没有传入messages但有chatDataPath，尝试从文件加载
        if (chatDataPath) {
            const loadData = async () => {
                setIsLoading(true);
                setError(null);
                
                const chatData = await loadChatData(chatDataPath);
                
                if (chatData) {
                    setRole(chatData.role);
                    setMessages(chatData.messages);
                } else {
                    setError('Failed to load chat data');
                }
                
                setIsLoading(false);
            };

            loadData();
        } else {
            // 没有数据源时设置默认role和空消息
            if (!role) {
                setRole({
                    id: 'default',
                    avatar: avatar,
                    name: name,
                    bio: bio
                });
            }
            setMessages([]);
        }
    }, [propMessages, chatDataPath, avatar, name, bio]);

    // 自动滚动到底部
    useEffect(() => {
        if (containerRef.current) {
            const scrollElement = containerRef.current.querySelector('[data-scrollable]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col rounded-xl border bg-background/65 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading chat data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full flex-col rounded-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-destructive">Error: {error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[90vh] w-full max-w-none flex-col rounded-xl border bg-background/65 backdrop-blur-sm supports-[backdrop-filter]:bg-background/50">
            {/* 角色信息头部 */}
            {role && (
                <div className="border-b p-4 bg-background/50 shrink-0 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-[2vw] w-[2vw]">
                            <AvatarImage src={avatar} alt={name} />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-lg font-semibold">{name}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{bio}</p>
                </div>
            )}
            
            {/* 聊天内容区域 */}
            <div ref={containerRef} className="flex-1 overflow-auto relative rounded-b-xl">
                <ChatContainerRoot className="h-full">
                    <ChatContainerContent className="space-y-4 p-4" data-scrollable>
                        {messages.map((message, index) => {
                            const isUser = message.sender === "You"
                            const isRole = message.sender === "Role"

                            return (
                                <Message
                                    key={index}
                                    className={isUser ? "justify-end" : "justify-start"}
                                >
                                    {/* 角色头像 - 在左侧显示 */}
                                    {isRole && role && (
                                        <MessageAvatar
                                            src={avatar}
                                            alt={name}
                                            fallback={name.charAt(0)}
                                            className="h-[1.8vw] w-[1.8vw]"
                                        />
                                    )}

                                    {/* 消息内容 */}
                                    <div className="max-w-[90%] sm:max-w-[85%]">
                                        {isRole ? (
                                            <div className="space-y-1">
                                                <MessageContent 
                                                    markdown={true}
                                                    className="bg-secondary text-foreground w-fit"
                                                >
                                                    {message.message}
                                                </MessageContent>
                                                <div className="text-xs text-muted-foreground px-2">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <MessageContent className="bg-primary text-primary-foreground w-fit">
                                                    {message.message}
                                                </MessageContent>
                                                <div className="text-xs text-muted-foreground px-2 text-right">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 用户头像 - 在右侧显示 */}
                                    {isUser && (
                                        <MessageAvatar
                                            src={userAvatar} // 使用配置的用户头像
                                            alt="You"
                                            fallback="Y"
                                            className="h-[1.8vw] w-[1.8vw]"
                                        />
                                    )}
                                </Message>
                            )
                        })}
                    </ChatContainerContent>
                    
                    {/* 滚动按钮 */}
                    <div className="absolute right-4 bottom-4">
                        <ScrollButton className="shadow-sm" />
                    </div>
                </ChatContainerRoot>
            </div>
        </div>
    )
}