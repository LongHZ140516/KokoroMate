import os
from typing import Literal
from gradio_client import Client, handle_file
from loguru import logger

class IndexTTS():
    def __init__(
        self,
        api_url: str = "http://127.0.0.1:7860",
        prompt_audio_path: str = "",
        infer_mode: Literal["普通推理", "批次推理"] = "普通推理",
        max_text_tokens_per_sentence: float = 120,
        sentences_bucket_max_size: int = 4,
        format: str = "wav"
    ):
        self.api_url = api_url
        self.prompt_audio_path = prompt_audio_path
        self.infer_mode = infer_mode
        self.format = format
        self.max_text_tokens_per_sentence = max_text_tokens_per_sentence
        self.sentences_bucket_max_size = sentences_bucket_max_size

        self.client = Client(self.api_url)
        logger.info(f"""-----Initialized IndexTTS with----- \n 
                    - api_url: {api_url} \n 
                    - prompt_audio_path: {prompt_audio_path} \n 
                    - infer_mode: {infer_mode} \n 
                    - max_text_tokens_per_sentence: {max_text_tokens_per_sentence} \n 
                    - sentences_bucket_max_size: {sentences_bucket_max_size} \n 
                    - format: {format} \n """)

    def generate_speech(self, text: str):
        """
        生成语音
        
        Args:
            text: 要转换的文本
            prompt_audio_path: 参考音频文件路径
            
        Returns:
            str: 生成的音频文件路径，失败时返回None
        """
        if not os.path.exists("cache"):
            os.makedirs("cache")

        if not os.path.exists(self.prompt_audio_path):
            logger.error(f"Prompt audio file not found: {self.prompt_audio_path}")
            return None

        file_path = f"cache/speech_temp.{self.format}"

        try:
            logger.info(f"Generating speech for text: {text[:50]}...")

            response = self.client.predict(
                prompt=handle_file(self.prompt_audio_path),
                text=text,
                infer_mode=self.infer_mode,
                max_text_tokens_per_sentence=self.max_text_tokens_per_sentence,
                sentences_bucket_max_size=self.sentences_bucket_max_size,
                param_5=True,
                param_6=0.8,
                param_7=30,
                param_8=1,
                param_9=0,
                param_10=3,
                param_11=10,
                param_12=600,
                api_name="/gen_single"
            )

            # IndexTTS返回格式: {'visible': True, 'value': 'path/to/audio.wav', '__type__': 'update'}
            if isinstance(response, dict) and 'value' in response:
                generated_audio_path = response['value']
                if os.path.exists(generated_audio_path):
                    import shutil
                    shutil.copy2(generated_audio_path, file_path)
                    logger.info(f"Audio generated successfully: {file_path}")
                    return file_path

            logger.error(f"Failed to get audio file from response: {response}")
            return None

        except Exception as e:
            logger.error(f"Error generating audio: {e}")
            return None