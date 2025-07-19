import base64
import re
import json
import wave
import numpy as np
import io

# ASR
from asr.funasr_asr import FunasrASR
from asr.sherpa_onnx_asr import SherpaOnnxASR
from asr.whispercpp_asr import WhisperCppASR

# LLM
from llm.litellm_service import AsyncLiteLLM

# TTS
from tts.fish_speech_tts import FishAudioTTS
from tts.gpt_sovits_tts import GPTSoVitsTTS
from tts.indextts_tts import IndexTTS
from tts.megatts_tts import MegaTTS
from tts.sherpa_onnx_tts import SherpaOnnxTTS

def image_to_base64(image_path: str) -> str:
    """
    将本地图片转为 base64 编码字符串（带 data:image 前缀）
    """
    with open(image_path, "rb") as image_file:
        encoded_bytes = base64.b64encode(image_file.read())
        encoded_str = encoded_bytes.decode('utf-8')
        # 加上前缀以指明是 JPEG/PNG 格式（可根据实际情况修改）
        return f"data:image/jpeg;base64,{encoded_str}"

def load_wav_file(wav_path: str):
    with wave.open(wav_path, 'rb') as wav_file:
        sample_rate = wav_file.getframerate()
        frames = wav_file.getnframes()
        audio_data = wav_file.readframes(frames)
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768
        return audio_array, sample_rate

def load_wav_from_base64(base64_audio: str):
    """
    从base64编码的音频数据中加载WAV音频
    
    Args:
        base64_audio: base64编码的WAV音频数据
        
    Returns:
        tuple: (audio_array, sample_rate)
    """
    try:
        # 解码base64数据
        audio_bytes = base64.b64decode(base64_audio)
        
        # 使用BytesIO创建文件对象
        audio_buffer = io.BytesIO(audio_bytes)
        
        # 使用wave模块读取音频数据
        with wave.open(audio_buffer, 'rb') as wav_file:
            sample_rate = wav_file.getframerate()
            frames = wav_file.getnframes()
            audio_data = wav_file.readframes(frames)
            audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768
            
        return audio_array, sample_rate
        
    except Exception as e:
        print(f"Error loading audio from base64: {e}")
        raise e

def extract_json_from_markdown(markdown_text: str):
    """从markdown格式的文本中提取JSON内容"""
    # 移除markdown代码块标记
    cleaned = re.sub(r'^```(?:json)?\s*', '', markdown_text.strip())
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()
    
    try:
        # 解析JSON
        data = json.loads(cleaned)
        return data
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        return None

def build_system_prompt(config: dict) -> str:
    """
    构建完整的system prompt，包含角色设定、动作信息和输出格式要求
    
    Args:
        config: 配置文件字典
    
    Returns:
        完整的system prompt字符串
    """
    # 提取角色设定
    character_prompt = config.get("character", {}).get("prompt", "")
    
    # 提取动作信息
    motions = config.get("character", {}).get("motion", {})
    motion_info = []
    for motion_name, motion_data in motions.items():
        trigger_condition = motion_data.get("trigger_condition", "")
        motion_info.append(f"- {motion_name}: {trigger_condition}")
    
    motion_section = "\n".join(motion_info) if motion_info else "无可用动作"
    
    # 提取系统输出格式要求
    system_prompt = config.get("system", {}).get("system_prompt", "")
    
    # 构建完整的system prompt
    complete_prompt = f"""# 角色设定
        {character_prompt}

        # 可用动作及触发条件
        {motion_section}

        # 输出格式要求
        {system_prompt}

        请严格按照以上要求进行回复。"""
    
    return complete_prompt


def set_asr_model(model_name: str, config: dict):
    if model_name == "funasr":
        return FunasrASR(**config)
    elif model_name == "sherpa_onnx":
        return SherpaOnnxASR(**config)
    elif model_name == "whispercpp":
        return WhisperCppASR(**config)
    else:
        raise ValueError(f"Invalid model name: {model_name}")


def set_llm_model(model_name: str, config: dict):
    if model_name == "litellm":
        return AsyncLiteLLM(**config)
    else:
        raise ValueError(f"Invalid model name: {model_name}")


def set_tts_model(model_name: str, config: dict):
    if model_name == "fish_speech":
        return FishAudioTTS(**config)
    elif model_name == "gpt_sovits":
        return GPTSoVitsTTS(**config)
    elif model_name == "index_tts":
        return IndexTTS(**config)
    elif model_name == "mega_tts":
        return MegaTTS(**config)
    elif model_name == "sherpa_onnx":
        return SherpaOnnxTTS(**config)
    else:
        raise ValueError(f"Invalid model name: {model_name}")
