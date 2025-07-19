"use client"

import React from "react"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square, Mic, MicOff } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { sendTextMessage, sendAudioMessage } from "../data/api-service"
import { AudioRecorder } from "../data/audio-recorder"
import type { ChatMessage } from "../data/chat-message"

interface MessageInputProps {
  onMessageSending?: (userMessage: ChatMessage) => void; // 新增：发送前立即显示用户消息
  onMessageSent?: (userMessage: ChatMessage, roleMessage: ChatMessage, motionName?: string, audioPath?: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onMessageSending, onMessageSent, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null)

  // 初始化音频录制器
  useEffect(() => {
    audioRecorderRef.current = new AudioRecorder()
    
    return () => {
      audioRecorderRef.current?.cleanup()
    }
  }, [])

  // 发送文本消息
  const handleTextSubmit = async () => {
    if (!input.trim() || isLoading || disabled) return

    const userText = input.trim()
    setInput("")
    setIsLoading(true)
    setError(null)

    // 创建用户消息并立即显示
    const userMessage: ChatMessage = {
      sender: "You",
      message: userText,
      timestamp: new Date(),
      files: []
    }

    // 立即显示用户消息
    if (onMessageSending) {
      onMessageSending(userMessage);
    }

    try {
      // 发送到后端
      const response = await sendTextMessage(userText)
      
      // 创建角色回复消息
      const roleMessage: ChatMessage = {
        sender: "Role",
        message: response.text,
        timestamp: new Date(),
        files: []
      }

      // 历史记录保存将在主页面中处理，避免重复保存
      // addMessageToHistory(updatedUserMessage)
      // addMessageToHistory(roleMessage)

      // 通知父组件（传递角色回复和动画信息）
      if (onMessageSent) {
        onMessageSent(userMessage, roleMessage, response.motion, response.audio_path);
      }

      // console.log('Text message sent successfully:', { 
      //   userText, 
      //   response: response.text, 
      //   motion: response.motion 
      // })
    } catch (error) {
      console.error('Error sending text message:', error)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // 开始录音
  const handleStartRecording = async () => {
    if (isLoading || disabled) return

    try {
      setError(null)
      await audioRecorderRef.current?.startRecording()
      setIsRecording(true)
      // console.log('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to start recording. Please check microphone permissions.')
    }
  }

  // 停止录音并发送
  const handleStopRecording = async () => {
    if (!audioRecorderRef.current || !isRecording) return

    setIsRecording(false)
    setIsLoading(true)
    setError(null)

    // 创建用户语音消息并立即显示（使用语音图标）
    const userMessage: ChatMessage = {
      sender: "You",
      message: "🎤 Audio Message", // 临时显示音频消息
      timestamp: new Date(),
      files: []
    }

    // 立即显示语音消息
    if (onMessageSending) {
      onMessageSending(userMessage);
    }

    try {
      // 停止录制
      // console.log('🎤 Stopping recording...');
      const audioBlob = await audioRecorderRef.current.stopRecording()
      // console.log('🎤 Recording stopped, blob size:', audioBlob.size, 'type:', audioBlob.type);

      // 发送到后端
      // console.log('🎤 Sending audio to backend...');
      const response = await sendAudioMessage(audioBlob)
      // console.log('🎤 Backend response:', response);
      
      // 更新用户消息为音频图标+ASR识别的文本
      const updatedUserMessage: ChatMessage = {
        sender: "You",
        message: response.asr_text ? `🎵 ${response.asr_text}` : "🎵 Voice Message",
        timestamp: new Date(),
        files: []
      }

      // 创建角色回复消息
      const roleMessage: ChatMessage = {
        sender: "Role",
        message: response.text,
        timestamp: new Date(),
        files: []
      }

      // 保存到历史记录
      // addMessageToHistory(updatedUserMessage)
      // addMessageToHistory(roleMessage)

      // 通知父组件（传递更新后的用户消息、角色回复和动画信息）
      if (onMessageSent) {
        onMessageSent(updatedUserMessage, roleMessage, response.motion, response.audio_path);
      }

      // console.log('Audio message sent successfully:', { 
      //   asr: response.asr_text, 
      //   response: response.text,
      //   motion: response.motion 
      // })
    } catch (error) {
      console.error('Error sending audio message:', error)
      setError('Failed to process audio message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleTextSubmit()
    }
  }

  return (
    <div className="space-y-2">
      {/* 错误提示 */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 w-[40vw]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 w-[40vw]">
        {/* 语音录制按钮 - 在输入框左侧 */}
        <Button
          variant="outline"
          size="icon"
          className={`w-[2vw] h-[2vw] rounded-full shrink-0 transition-all duration-200 ${
            isRecording 
              ? 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white shadow-lg' 
              : 'bg-background/15 backdrop-blur-sm shadow-2xl border-1 hover:bg-background/50'
          }`}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={disabled || isLoading}
        >
          {isRecording ? (
            <MicOff className="size-5" />
          ) : (
            <Mic className="size-5" />
          )}
        </Button>

        {/* 文本输入框 */}
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleTextSubmit}
          className="flex-1 bg-background/15 backdrop-blur-sm shadow-2xl border-1 rounded-2xl"
        >
          <PromptInputTextarea 
            placeholder={isRecording ? "Recording..." : "Ask me anything..."} 
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading || isRecording}
          />
          
          <PromptInputActions className="justify-end pt-2">
            {/* 发送按钮 */}
            <PromptInputAction
              tooltip={isLoading ? "Processing..." : "Send message"}
            >
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleTextSubmit}
                disabled={disabled || isLoading || isRecording || !input.trim()}
              >
                {isLoading ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  )
}
