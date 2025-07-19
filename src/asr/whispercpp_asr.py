import numpy as np
from loguru import logger
from pywhispercpp.model import Model

class WhisperCppASR():
    def __init__(
            self,
            model: str = "base",
            models_dir: str = None,
            params_sampling_strategy: int = 0,
            language: str = "en",
            temperature: float = 0.0,
            translate: bool = False,
            print_realtime: bool = False,
            print_progress: bool = False,
    ):
        self.model = Model(
            model=model,
            models_dir=models_dir,
            params_sampling_strategy=params_sampling_strategy,
            language=language,
            temperature=temperature,
            translate=translate,
            print_realtime=print_realtime,
            print_progress=print_progress,
        )

    def audio2text(self, audio: np.ndarray) -> str:
        """
        Transcribe audio using WhisperCpp

        Args:
            audio: numpy array of audio data
            
        """
        try:
            
            segments = self.model.transcribe(audio, new_segment_callback=logger.info)
            
            text_result = ""
            for segment in segments:
                text_result += segment.text
            
            return text_result
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise e
        
 