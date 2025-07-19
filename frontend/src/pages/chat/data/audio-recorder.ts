// 音频录制类
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  // 开始录制
  async startRecording(): Promise<void> {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // 匹配后端期望的采样率
          channelCount: 1,   // 单声道
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      // 创建MediaRecorder实例
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus' // 使用opus编码
      });

      // 清空之前的音频数据
      this.audioChunks = [];

      // 监听数据可用事件
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // 开始录制
      this.mediaRecorder.start(100); // 每100ms收集一次数据
      // console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }

  // 停止录制
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        // 创建音频blob
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // 停止音频流
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        // console.log('Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        reject(new Error('Recording failed'));
      };

      // 停止录制
      this.mediaRecorder.stop();
    });
  }

  // 检查是否正在录制
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  // 清理资源
  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// 将Blob转换为WAV格式的base64字符串
export async function convertToWavBase64(audioBlob: Blob): Promise<string> {
  try {
    // 创建AudioContext
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // 将blob转换为ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // 解码音频数据
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // 转换为WAV格式
    const wavBuffer = audioBufferToWav(audioBuffer);
    
    // 转换为base64
    const base64 = arrayBufferToBase64(wavBuffer);
    
    // 清理AudioContext
    audioContext.close();
    
    return base64;
  } catch (error) {
    console.error('Error converting audio:', error);
    throw new Error('Failed to convert audio to WAV format');
  }
}

// 将AudioBuffer转换为WAV格式的ArrayBuffer
function audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const buffer = new ArrayBuffer(44 + audioBuffer.length * blockAlign);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  let offset = 0;
  writeString(offset, 'RIFF'); offset += 4;
  view.setUint32(offset, buffer.byteLength - 8, true); offset += 4;
  writeString(offset, 'WAVE'); offset += 4;
  writeString(offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, format, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitDepth, true); offset += 2;
  writeString(offset, 'data'); offset += 4;
  view.setUint32(offset, audioBuffer.length * blockAlign, true); offset += 4;

  // 写入音频数据
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let sampleIndex = 0;
  while (sampleIndex < audioBuffer.length) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][sampleIndex]));
      const intSample = Math.floor(sample * (bitDepth === 16 ? 0x7FFF : 0x7FFFFFFF));
      
      if (bitDepth === 16) {
        view.setInt16(offset, intSample, true);
        offset += 2;
      } else {
        view.setInt32(offset, intSample, true);
        offset += 4;
      }
    }
    sampleIndex++;
  }

  return buffer;
}

// 将ArrayBuffer转换为base64字符串
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
} 