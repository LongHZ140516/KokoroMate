import { Engine } from "@babylonjs/core/Engines/engine";
import React from "react";

import { BaseRuntime } from "./scene/baseRuntime";
import { SceneBuilder } from "./scene/sceneBuilder";
import SceneController from "./components/scene_controller";
import type { SceneControlData } from "./components/scene_controller";
import { MessageInput } from "@/pages/chat/components/message_input";
import { ChatWindow } from "./components/chat_window";
// import { AnimationControlButton } from "@/components/animation-control-button";
import { sceneSetting, updateSceneSettingFromYaml } from "./scene/scene_setting";
import type { ChatMessage } from "./data/chat-message";
import { loadChatHistory, saveChatHistory } from "./data/chat-storage";
import { playAudio } from "./data/audio-player";

export default function ChatPage() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const runtimeRef = React.useRef<BaseRuntime | null>(null);
  const sceneBuilderRef = React.useRef<SceneBuilder | null>(null);
  
  // 聊天消息状态
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isSceneReady, setIsSceneReady] = React.useState(false);

  // 加载聊天历史
  React.useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await loadChatHistory();
        setMessages(history);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setMessages([]);
      }
    };
    
    loadHistory();
  }, []);

  React.useEffect(() => {
    const initScene = async () => {
      // 先加载配置
      await updateSceneSettingFromYaml();
      
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";

      const engine = new Engine(canvas, false, {
          preserveDrawingBuffer: false,
          stencil: false,
          antialias: false,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: "high-performance",
          doNotHandleTouchAction: false,
          doNotHandleContextLost: true,
          audioEngine: false
      }, true);

      const sceneBuilder = new SceneBuilder();
      sceneBuilderRef.current = sceneBuilder;
      
      BaseRuntime.Create({
          canvas,
          engine,
          sceneBuilder: sceneBuilder
      }).then(runtime => {
          runtimeRef.current = runtime;
          runtime.run();
          setIsSceneReady(true);
      }).catch(error => {
          console.error("Failed to initialize Babylon.js scene:", error);
      });
    };

    initScene();

    // Cleanup function
    return () => {
        if (runtimeRef.current) {
            runtimeRef.current.dispose();
            runtimeRef.current = null;
        }
    };
  }, []);

  const handleSceneChange = (sceneData: SceneControlData) => {
    if (sceneBuilderRef.current) {
      sceneBuilderRef.current.updateScene(sceneData);
    }
  };

  // 处理立即显示用户消息
  const handleMessageSending = (userMessage: ChatMessage) => {
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    // console.log('📤 User message displayed immediately:', userMessage.message);
  };

  // 处理新消息（角色回复）
  const handleMessageSent = async (userMessage: ChatMessage, roleMessage: ChatMessage, motionName?: string, audioPath?: string) => {
    // 找到最后一条临时用户消息的索引
    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];
    
    // console.log('🔄 Processing message sent:', {
    //   lastMessage: lastMessage?.message,
    //   userMessage: userMessage.message,
    //   willReplace: lastMessage && lastMessage.sender === "You" && 
    //     (lastMessage.message === userMessage.message || 
    //      lastMessage.message === "🎤 Audio Message" || 
    //      lastMessage.message === "🎤 Voice Message")
    // });
    
    // 检查最后一条消息是否是临时的用户消息
    if (lastMessage && lastMessage.sender === "You" && 
        (lastMessage.message === userMessage.message || 
         lastMessage.message === "🎤 Audio Message" || 
         lastMessage.message === "🎤 Voice Message")) {
      // 替换最后一条临时用户消息，并添加角色回复
      // console.log('✅ Replacing temporary message with final message');
      const updatedMessages = [
        ...messages.slice(0, -1), // 移除最后一条临时用户消息
        userMessage,               // 添加最终的用户消息
        roleMessage                // 添加角色回复
      ];
      setMessages(updatedMessages);
    } else {
      // 如果没有找到临时消息，直接添加用户消息和角色回复
      // console.log('➕ Appending messages (no temporary message found)');
      const updatedMessages = [
        ...messages,
        userMessage,
        roleMessage
      ];
      setMessages(updatedMessages);
    }

    // 保存到历史记录 - 直接保存当前的消息列表而不是逐个添加
    try {
      // 获取当前更新后的消息列表
      const currentMessages = messages.slice();
      if (lastMessage && lastMessage.sender === "You" && 
          (lastMessage.message === userMessage.message || 
           lastMessage.message === "🎤 Audio Message" || 
           lastMessage.message === "🎤 Voice Message")) {
        // 替换模式：移除临时消息，添加最终消息
        currentMessages[currentMessages.length - 1] = userMessage;
        currentMessages.push(roleMessage);
      } else {
        // 追加模式：直接添加消息
        currentMessages.push(userMessage, roleMessage);
      }
      
      // 直接保存整个消息列表
      await saveChatHistory(currentMessages);
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }

    // 播放角色回复的语音（如果有audio_path）
    if (audioPath) {
      playAudio(audioPath).catch(error => {
        console.error('🎵 Failed to play audio:', error);
      });
      // console.log('🎵 Playing role response audio:', audioPath);
    }

    // 根据后端返回的motion字段播放对应动画
    if (sceneBuilderRef.current && isSceneReady) {
      if (motionName) {
        // 检查动画是否存在
        if (sceneBuilderRef.current.hasAnimation(motionName)) {
          // console.log(`Playing animation: ${motionName}`);
          const success = sceneBuilderRef.current.playAnimation(motionName);
          if (success) {
            // console.log(`✅ Animation "${motionName}" played successfully`);
          } else {
            console.warn(`❌ Failed to play animation "${motionName}"`);
          }
        } else {
          const availableAnimations = sceneBuilderRef.current.getAvailableAnimations();
          console.warn(`❌ Animation "${motionName}" not found. Available animations:`, availableAnimations);
          
          // 如果指定的动画不存在，播放默认动画
          if (availableAnimations.includes('idle')) {
            // console.log('🔄 Falling back to "idle" animation');
            sceneBuilderRef.current.playAnimation('idle');
          } else if (availableAnimations.length > 0) {
            const fallbackAnimation = availableAnimations[0];
            // console.log(`🔄 Falling back to "${fallbackAnimation}" animation`);
            sceneBuilderRef.current.playAnimation(fallbackAnimation);
          }
        }
      } else {
        // 如果没有指定motion，播放默认动画
        const availableAnimations = sceneBuilderRef.current.getAvailableAnimations();
        if (availableAnimations.includes('idle')) {
          // console.log('🎭 No motion specified, playing default "idle" animation');
          sceneBuilderRef.current.playAnimation('idle');
        }
      }
    } else {
      if (!isSceneReady) {
        console.warn('⏳ Scene not ready yet, animation will not play');
      }
      if (!sceneBuilderRef.current) {
        console.warn('❌ Scene builder not available');
      }
    }
  };

  // 测试动画播放（开发调试用）
  const testAnimation = (animationName: string) => {
    if (sceneBuilderRef.current && isSceneReady) {
      const success = sceneBuilderRef.current.playAnimation(animationName);
      // console.log(`Test animation "${animationName}": ${success ? 'Success' : 'Failed'}`);
      return success;
    }
    console.warn('Scene not ready for animation test');
    return false;
  };

  // 开发环境下暴露测试函数到window对象
  React.useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as unknown as { 
        testAnimation: (name: string) => boolean;
        getAvailableAnimations: () => string[];
      }).testAnimation = testAnimation;
      (window as unknown as { 
        testAnimation: (name: string) => boolean;
        getAvailableAnimations: () => string[];
      }).getAvailableAnimations = () => {
        return sceneBuilderRef.current?.getAvailableAnimations() || [];
      };
      // console.log('🎭 Animation test functions available:');
      // console.log('  - window.testAnimation(animationName)');
      // console.log('  - window.getAvailableAnimations()');
    }
  }, [isSceneReady]);

  // 不再需要handleMessagesChange函数，因为会导致循环更新

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: "100%", 
          height: "100%", 
          display: "block",
          outline: "none"
        }}
      />
      {/* 动画控制按钮 */}
      

      {/* 消息输入框 */}
      <div className="absolute bottom-8 left-[5vw] right-10 p-4">
        <MessageInput 
          onMessageSending={handleMessageSending}
          onMessageSent={handleMessageSent}
          disabled={!isSceneReady}
        />
      </div>

      {/* 聊天窗口 */}
      <div className="absolute top-8 right-15 p-4 w-[40vw] max-w-full">
        <ChatWindow 
          name={sceneSetting.model.name} 
          bio={sceneSetting.model.bio} 
          avatar={sceneSetting.model.avatar}
          messages={messages}
        />
      </div>

      {/* 场景控制器 */}
      <SceneController onSceneChange={handleSceneChange} />

      {/* 状态指示器 */}
      {!isSceneReady && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-lg p-4">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Loading Scene...</div>
            <div className="text-sm text-muted-foreground">Please wait while the 3D scene initializes</div>
          </div>
        </div>
      )}
    </div>
  );
}
