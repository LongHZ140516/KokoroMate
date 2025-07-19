import type { ChatMessage } from './chat-message';

// 聊天记录存储接口
export interface ChatRecord {
  sender: "You" | "Role";
  message: string;
  timestamp: string; // ISO字符串格式
}

// 聊天记录文件接口
export interface ChatHistoryFile {
  version: string;
  created: string;
  updated: string;
  messages: ChatRecord[];
}

// API响应接口
export interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// API基础URL
const API_BASE_URL = "http://localhost:8000";

// 将ChatMessage转换为ChatRecord
function messageToRecord(message: ChatMessage): ChatRecord {
  return {
    sender: message.sender,
    message: message.message,
    timestamp: message.timestamp.toISOString()
  };
}

// 将ChatRecord转换为ChatMessage
function recordToMessage(record: ChatRecord): ChatMessage {
  return {
    sender: record.sender,
    message: record.message,
    timestamp: new Date(record.timestamp),
    files: [] // 暂时不支持文件存储
  };
}

// 从后端加载聊天记录
export async function loadChatHistory(): Promise<ChatMessage[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat_history`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const historyFile: ChatHistoryFile = await response.json();
    
    // 检查是否是错误响应
    if ('error' in historyFile) {
      const errorResponse = historyFile as ChatHistoryFile & { error: string };
      console.error('Server error loading chat history:', errorResponse.error);
      return [];
    }
    
    const messages = historyFile.messages.map(recordToMessage);
    // console.log(`Loaded ${messages.length} chat messages from server`);
    return messages;
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
}

// 保存聊天记录到后端
export async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  try {
    const now = new Date().toISOString();
    const historyFile: ChatHistoryFile = {
      version: '1.0',
      created: now, // 这里应该从现有文件获取，但为简单起见使用当前时间
      updated: now,
      messages: messages.map(messageToRecord)
    };

    const response = await fetch(`${API_BASE_URL}/chat_history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyFile),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }

    // console.log(`Saved ${messages.length} chat messages to server`);
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

// 添加新消息到聊天记录
export async function addMessageToHistory(message: ChatMessage): Promise<ChatMessage[]> {
  const existingMessages = await loadChatHistory();
  const updatedMessages = [...existingMessages, message];
  await saveChatHistory(updatedMessages);
  return updatedMessages;
}

// 清空聊天记录
export async function clearChatHistory(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat_history`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }

    // console.log('Chat history cleared from server');
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
}

// 导出聊天记录为JSON文件
export async function exportChatHistory(): Promise<void> {
  try {
    const messages = await loadChatHistory();
    const historyFile: ChatHistoryFile = {
      version: '1.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      messages: messages.map(messageToRecord)
    };

    const dataStr = JSON.stringify(historyFile, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kokoromate_chat_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // console.log('Chat history exported successfully');
  } catch (error) {
    console.error('Error exporting chat history:', error);
  }
}

// 从JSON文件导入聊天记录
export async function importChatHistory(file: File): Promise<ChatMessage[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const historyFile: ChatHistoryFile = JSON.parse(content);
        const messages = historyFile.messages.map(recordToMessage);
        
        await saveChatHistory(messages);
        // console.log(`Imported ${messages.length} chat messages`);
        resolve(messages);
      } catch (error) {
        console.error('Error parsing imported file:', error);
        reject(new Error('Invalid chat history file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
} 