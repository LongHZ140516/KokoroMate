import os
import requests
from loguru import logger

class GPTSoVitsTTS():
    def __init__(
        self,
        api_url: str = "http://127.0.0.1:5000",
        character: str = "【原神】八重神子",
        emotion: str = "default",
        text_language: str = "zh",
        batch_size: int = 1,
        speed: float = 1.0,
        top_k: int = 3,
        top_p: float = 0.7,
        temperature: float = 0.7,
        stream: str = "False",
        format: str = "wav"
    ):
        self.api_url = api_url
        self.character = character
        self.emotion = emotion
        self.text_language = text_language
        self.batch_size = batch_size
        self.speed = speed
        self.top_k = top_k
        self.top_p = top_p
        self.temperature = temperature
        self.stream = stream
        self.format = format

        logger.info(f"""-----Initialized GPTSoVitsTTS with----- \n 
                    - api_url: {api_url} \n 
                    - character: {character} \n 
                    - emotion: {emotion} \n 
                    - text_language: {text_language} \n """)

    def generate_speech(self, text: str):
        if not os.path.exists(f"cache"):
            os.makedirs(f"cache")

        file_path = f"cache/speech_temp.{self.format}"

        try:
            payload = {
                "character": self.character,
                "emotion": self.emotion,
                "text": text,
                "text_language": self.text_language,
                "batch_size": self.batch_size,
                "speed": self.speed,
                "top_k": self.top_k,
                "top_p": self.top_p,
                "temperature": self.temperature,
                "stream": self.stream,
                "save_temp": "False"
            }

            logger.info(f"Sending POST request to {self.api_url}/tts")
            logger.info(f"Payload: {payload}")

            response = requests.post(
                f"{self.api_url}/tts",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                with open(file_path, "wb") as f:
                    f.write(response.content)
                
                logger.info(f"Audio generated successfully: {file_path}")
                return file_path
            
            else:
                logger.error(f"Error generating audio: {response.status_code} {response.text}")
                return None
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error: {e}")
            return None
        except requests.exceptions.Timeout as e:
            logger.error(f"Request timeout: {e}")
            return None
        except Exception as e:
            logger.error(f"Error generating audio: {e}")
            return None
        
