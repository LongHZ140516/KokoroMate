import yaml
import json
import base64
import uvicorn
import librosa
import model_function
import os
from fastapi import FastAPI, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException

config = yaml.safe_load(open("./frontend/public/default.yaml", "r", encoding="utf-8"))

# set system prompt
system_prompt = model_function.build_system_prompt(config)

app = FastAPI()

# 确保cache目录存在
if not os.path.exists("cache"):
    os.makedirs("cache")
    print("✅ Created cache directory")

# 确保聊天记录目录存在
if not os.path.exists("chat_history"):
    os.makedirs("chat_history")
    print("✅ Created chat history directory")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # 允许前端地址
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有请求头
)

# 自定义音频文件服务，添加必要的头部
@app.get("/audio/{filename}")
async def serve_audio(filename: str):
    file_path = os.path.join("cache", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # 返回文件响应，添加必要的头部
    response = FileResponse(
        path=file_path,
        media_type="audio/wav",
        headers={
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Cross-Origin-Embedder-Policy": "unsafe-none",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache"
        }
    )
    return response

# 原来的静态文件服务已被上面的自定义路由替代
# app.mount("/audio", StaticFiles(directory="cache"), name="audio")

if config["system"]["chat_mode"] == "text_only":
    llm_model = model_function.set_llm_model(config["system"]["default_model"]["llm"], config["llm"][config["system"]["default_model"]["llm"]])
    tts_model = model_function.set_tts_model(config["system"]["default_model"]["tts"], config["tts"][config["system"]["default_model"]["tts"]])

else:
    asr_model = model_function.set_asr_model(config["system"]["default_model"]["asr"], config["asr"][config["system"]["default_model"]["asr"]])
    llm_model = model_function.set_llm_model(config["system"]["default_model"]["llm"], config["llm"][config["system"]["default_model"]["llm"]])
    tts_model = model_function.set_tts_model(config["system"]["default_model"]["tts"], config["tts"][config["system"]["default_model"]["tts"]])

@app.post("/chat_api/text")
async def chat_api_text(request: Request):
    chat_data = await request.json()
    input_text = chat_data.get("input_text")
    # input_file = chat_data.get("input_file")
    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": input_text
        }
    ]

    response_generator = llm_model.chat_completion(messages)
    full_response = ""

    async for chunk in response_generator:
        full_response += chunk

    response = model_function.extract_json_from_markdown(full_response)
    
    # 检查JSON解析是否成功
    if response is None:
        print(f"❌ Failed to parse JSON from LLM response: {full_response}")
        response = {"text": "抱歉，我现在无法处理您的请求，请稍后重试。", "motion": "idle"}
    
    response_text, response_motion = response.get("text"), response.get("motion")
    tts_file_path = tts_model.generate_speech(response_text)
    
    print(f"🔍 TTS file path: {tts_file_path}")
    
    # 将TTS返回的本地路径转换为前端可访问的路径
    if tts_file_path and tts_file_path.startswith("cache/"):
        audio_path = f"/audio/{tts_file_path.replace('cache/', '')}"
        print(f"✅ Converted audio path: {audio_path}")
    else:
        audio_path = tts_file_path
        print(f"⚠️ Using original path: {audio_path}")

    return {"text": response_text, "motion": response_motion, "audio_path": audio_path}

@app.post("/chat_api/audio")
async def chat_api_audio(audio_file: UploadFile = File(...)):
    print("🎤 Received audio file upload")
    
    if config["system"]["chat_mode"] == "text_only":
        print("❌ Audio mode is disabled in config")
        return {"error": "Audio mode is not supported in text only mode"}
    
    try:
        # 检查文件类型
        if not audio_file.content_type.startswith('audio/'):
            print(f"❌ Invalid file type: {audio_file.content_type}")
            return {"error": "Invalid file type. Please upload an audio file."}
        
        print(f"🎤 Audio file received: {audio_file.filename}, size: {audio_file.size}, type: {audio_file.content_type}")
        
        # 读取音频文件内容
        audio_content = await audio_file.read()
        
        # 保存临时文件
        temp_audio_path = "temp_audio.wav"
        with open(temp_audio_path, "wb") as f:
            f.write(audio_content)
        
        print(f"🎤 Saved temp audio file: {temp_audio_path}")
        
        # 使用librosa加载音频文件
        try:
            audio_array, sample_rate = librosa.load(temp_audio_path, sr=16000)
            print(f"🎤 Audio loaded with librosa: shape={audio_array.shape}, sample_rate={sample_rate}")
        except Exception as e:
            print(f"❌ Failed to load audio with librosa module, trying wave: {e}")
            audio_array, sample_rate = model_function.load_wav_file(temp_audio_path)
            print(f"🎤 Audio loaded with wave: shape={audio_array.shape}, sample_rate={sample_rate}")
        
        # 清理临时文件
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        
        print("🎤 Starting ASR...")
        input_text = asr_model.audio2text(audio_array)
        print(f"🎤 ASR result: {input_text}")
        
    except Exception as e:
        print(f"❌ Error processing audio: {e}")
        import traceback
        traceback.print_exc()
        # 清理临时文件
        if os.path.exists("temp_audio.wav"):
            os.remove("temp_audio.wav")
        return {"error": f"Audio processing failed: {str(e)}"}
    
    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": input_text
        }
    ]

    response_generator = llm_model.chat_completion(messages)
    full_response = ""

    async for chunk in response_generator:
        full_response += chunk

    response = model_function.extract_json_from_markdown(full_response)
    
    # 检查JSON解析是否成功
    if response is None:
        print(f"❌ Failed to parse JSON from LLM response: {full_response}")
        response = {"text": "抱歉，我现在无法理解您的语音输入，请稍后重试。", "motion": "idle"}
    
    response_text, response_motion = response.get("text"), response.get("motion")
    tts_file_path = tts_model.generate_speech(response_text)
    
    print(f"🔍 Audio TTS file path: {tts_file_path}")
    
    # 将TTS返回的本地路径转换为前端可访问的路径
    if tts_file_path and tts_file_path.startswith("cache/"):
        audio_path = f"/audio/{tts_file_path.replace('cache/', '')}"
        print(f"✅ Audio converted path: {audio_path}")
    else:
        audio_path = tts_file_path
        print(f"⚠️ Audio using original path: {audio_path}")

    return {"asr_text": input_text, "text": response_text, "motion": response_motion, "audio_path": audio_path}

# 聊天记录管理API
@app.get("/chat_history")
async def get_chat_history():
    """获取聊天记录"""
    try:
        history_file = "chat_history/chat.json"
        if os.path.exists(history_file):
            with open(history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            return history
        else:
            # 返回空的聊天记录结构
            return {
                "version": "1.0",
                "created": "",
                "updated": "",
                "messages": []
            }
    except Exception as e:
        print(f"Error loading chat history: {e}")
        return {"error": "Failed to load chat history"}

@app.post("/chat_history")
async def save_chat_history(request: Request):
    """保存聊天记录"""
    try:
        chat_data = await request.json()
        history_file = "chat_history/chat.json"
        
        # 确保目录存在
        os.makedirs("chat_history", exist_ok=True)
        
        # 保存聊天记录
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Chat history saved with {len(chat_data.get('messages', []))} messages")
        return {"success": True, "message": "Chat history saved successfully"}
    except Exception as e:
        print(f"Error saving chat history: {e}")
        return {"error": "Failed to save chat history"}

@app.delete("/chat_history")
async def clear_chat_history():
    """清空聊天记录"""
    try:
        history_file = "chat_history/chat.json"
        if os.path.exists(history_file):
            os.remove(history_file)
            print("✅ Chat history cleared")
        return {"success": True, "message": "Chat history cleared"}
    except Exception as e:
        print(f"Error clearing chat history: {e}")
        return {"error": "Failed to clear chat history"}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
    



