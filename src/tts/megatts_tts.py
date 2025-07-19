import os
from typing import Literal
from gradio_client import Client, handle_file
from loguru import logger

class MegaTTS(): 
    def __init__(
            self,
            inp_audio: str,
            inp_npy: str,
            api_url: str = "http://127.0.0.1:7929",
            infer_timestep: float = 32, # The input value that is provided in the "infer timestep" Number component.
            p_w: float = 1.4, # The input value that is provided in the "Intelligibility Weight" Number component.
            t_w: float = 3, # The input value that is provided in the "Similarity Weight" Number component.
            format: str = "wav"
    ):
        self.api_url = api_url
        self.inp_audio = inp_audio
        self.inp_npy = inp_npy
        self.infer_timestep = infer_timestep
        self.p_w = p_w
        self.t_w = t_w
        self.format = format

        self.client = Client(self.api_url)

        logger.info(f"""-----Initialized MegaTTS with----- \n 
                    - api_url: {api_url} \n 
                    - inp_audio: {inp_audio} \n 
                    - inp_npy: {inp_npy} \n 
                    - infer_timestep: {infer_timestep} \n 
                    - p_w: {p_w} \n 
                    - t_w: {t_w} \n """)

    def generate_speech(self, text: str):
        """
        生成语音
        
        Args:
            text: 要转换的文本
            prompt_audio_path: 参考音频文件路径
        """

        if not os.path.exists("cache"):
            os.makedirs("cache")

        file_path = f"cache/speech_temp.{self.format}"

        try:
            logger.info(f"Generating speech for text: {text[:50]}...")

            response = self.client.predict(
                inp_audio=handle_file(self.inp_audio),
                inp_npy=handle_file(self.inp_npy),
                inp_text=text,
                infer_timestep=self.infer_timestep,
                p_w=self.p_w,
                t_w=self.t_w,
                api_name="/predict"
            )
            
            # MegaTTS返回直接的字符串路径
            if isinstance(response, str) and os.path.exists(response):
                import shutil
                shutil.copy2(response, file_path)
                logger.info(f"Audio generated successfully: {file_path}")
                return file_path

            logger.error(f"Failed to get audio file from response: {response}")
            return None 

        except Exception as e:
            logger.error(f"Error generating audio: {e}")
            return None
