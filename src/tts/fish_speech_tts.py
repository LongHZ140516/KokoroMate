import os 
from loguru import logger
from fish_audio_sdk import Session, TTSRequest
from typing import Literal

# 792e8a3c13164349b29fe44e8fa4921d
class FishAudioTTS():
    def __init__(
            self,  
            api_key: str, # your api key
            reference_id: str = "0eb38bc974e1459facca38b359e13511", # the reference id for the tts request
            latency: Literal["normal", "balanced"] = "normal", # the latency for the tts request
            format: Literal["mp3", "wav", "pcm"] = "wav", # the format for the tts request
            backend: Literal["speech-1.5", "speech-1.6", "s1"] = "speech-1.5" # the backend for the tts request
    ):
        self.reference_id = reference_id
        self.latency = latency
        self.format = format
        self.backend = backend

        logger.info(f"""-----Initialized FishAudioTTS with----- \n 
                    - reference_id: {self.reference_id} \n 
                    - latency: {self.latency} \n 
                    - format: {self.format} \n 
                    - api_key: {api_key} \n 
                    - backend: {self.backend}""")
        
        self.session = Session(api_key)
        
    def generate_speech(self, text: str):
        if not os.path.exists(f"cache"):
            os.makedirs(f"cache")

        file_path = f"cache/speech_temp.{self.format}"

        try:
            with open(file_path, "wb") as f:
                for chunk in self.session.tts(
                    TTSRequest(
                        text=text,
                        reference_id=self.reference_id,
                        latency=self.latency,
                        backend=self.backend
                    )
                ):
                    f.write(chunk)

            return file_path
        
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            return None

