// API服务配置
const API_BASE_URL = "http://localhost:8000";
const TEXT_ENDPOINT = `${API_BASE_URL}/chat_api/text`;
const AUDIO_ENDPOINT = `${API_BASE_URL}/chat_api/audio`;

// 文本请求接口
export interface TextRequest {
  input_text: string;
}

// 音频请求接口 - 现在使用文件上传
export interface AudioRequest {
  audio_file: File; // 音频文件
}

// API响应接口
export interface ApiResponse {
  text: string;
  motion?: string;
  audio_path?: string;
  asr_text?: string; // 仅音频接口返回
}

// 发送文本请求
export async function sendTextMessage(text: string): Promise<ApiResponse> {
  try {
    const payload: TextRequest = {
      input_text: text
    };

    const response = await fetch(TEXT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

// 发送音频请求 - 现在使用文件上传
export async function sendAudioMessage(audioBlob: Blob): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    
    // 创建一个File对象，确保有正确的文件名和MIME类型
    const audioFile = new File([audioBlob], 'audio.wav', { 
      type: 'audio/wav' 
    });
    
    formData.append('audio_file', audioFile);

    const response = await fetch(AUDIO_ENDPOINT, {
      method: 'POST',
      body: formData, // 不设置Content-Type，让浏览器自动设置multipart/form-data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending audio message:', error);
    throw error;
  }
}

// 检查服务器状态
export async function checkServerStatus(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/docs`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Server status check failed:', error);
    return false;
  }
} 