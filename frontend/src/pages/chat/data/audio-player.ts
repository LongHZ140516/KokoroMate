// 音频播放类
export class AudioPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  // 播放音频文件
  async playAudio(audioPath: string): Promise<void> {
    try {
      // 停止当前播放的音频
      this.stopAudio();

      // 创建新的音频元素
      this.currentAudio = new Audio();
      
      // 设置音频源
      // 构建完整的音频URL
      const baseUrl = audioPath.startsWith('http') 
        ? audioPath 
        : `http://localhost:8000${audioPath.startsWith('/') ? audioPath : '/' + audioPath}`;
      
      // 添加时间戳参数来防止缓存
      const audioUrl = `${baseUrl}?t=${Date.now()}`;
      
      this.currentAudio.src = audioUrl;
      
      // 设置音频属性
      this.currentAudio.preload = 'auto';
      this.currentAudio.volume = 1.0;
      this.currentAudio.crossOrigin = 'anonymous'; // 添加跨域属性

      // 监听事件
      this.currentAudio.onloadstart = () => {
        // console.log('🎵 Audio loading started:', audioUrl);
      };

      this.currentAudio.oncanplaythrough = () => {
        // console.log('🎵 Audio can play through:', audioUrl);
      };

      this.currentAudio.onplay = () => {
        this.isPlaying = true;
        // console.log('🎵 Audio playback started:', audioUrl);
      };

      this.currentAudio.onpause = () => {
        this.isPlaying = false;
        // console.log('🎵 Audio playback paused:', audioUrl);
      };

      this.currentAudio.onended = () => {
        this.isPlaying = false;
        // console.log('🎵 Audio playback ended:', audioUrl);
        this.cleanup();
      };

      this.currentAudio.onerror = (error) => {
        this.isPlaying = false;
        console.error('🎵 Audio playback error:', error);
        console.error('Failed to load audio:', audioUrl);
        this.cleanup();
      };

      // 等待音频加载完成后再播放
      await new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          this.currentAudio!.removeEventListener('canplay', handleCanPlay);
          this.currentAudio!.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (error: Event) => {
          this.currentAudio!.removeEventListener('canplay', handleCanPlay);
          this.currentAudio!.removeEventListener('error', handleError);
          console.error('🎵 Audio load error:', error);
          reject(new Error('Failed to load audio'));
        };
        
        this.currentAudio!.addEventListener('canplay', handleCanPlay);
        this.currentAudio!.addEventListener('error', handleError);
        
        // 开始加载
        this.currentAudio!.load();
      });

      // 开始播放
      await this.currentAudio.play();
      
    } catch (error) {
      console.error('Error playing audio:', error);
      this.cleanup();
      throw new Error(`Failed to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 停止当前音频播放
  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.cleanup();
    }
  }

  // 暂停音频播放
  pauseAudio(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
    }
  }

  // 恢复音频播放
  resumeAudio(): void {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play().catch(error => {
        console.error('Error resuming audio:', error);
      });
    }
  }

  // 检查是否正在播放
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // 获取当前播放进度
  getCurrentTime(): number {
    return this.currentAudio?.currentTime || 0;
  }

  // 获取音频总时长
  getDuration(): number {
    return this.currentAudio?.duration || 0;
  }

  // 设置播放位置
  setCurrentTime(time: number): void {
    if (this.currentAudio) {
      this.currentAudio.currentTime = time;
    }
  }

  // 设置音量 (0.0 - 1.0)
  setVolume(volume: number): void {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // 清理资源
  private cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.onloadstart = null;
      this.currentAudio.oncanplaythrough = null;
      this.currentAudio.onplay = null;
      this.currentAudio.onpause = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  // 销毁播放器
  destroy(): void {
    this.stopAudio();
    this.cleanup();
  }
}

// 创建全局音频播放器实例
let globalAudioPlayer: AudioPlayer | null = null;

// 获取全局音频播放器实例
export function getGlobalAudioPlayer(): AudioPlayer {
  if (!globalAudioPlayer) {
    globalAudioPlayer = new AudioPlayer();
  }
  return globalAudioPlayer;
}

// 播放音频的便捷函数
export async function playAudio(audioPath: string): Promise<void> {
  const player = getGlobalAudioPlayer();
  await player.playAudio(audioPath);
}

// 停止音频的便捷函数
export function stopAudio(): void {
  const player = getGlobalAudioPlayer();
  player.stopAudio();
} 