import io
import re
import torch
import numpy as np
import soundfile as sf
from typing import Literal
from funasr import AutoModel
from funasr.utils.postprocess_utils import rich_transcription_postprocess

class FunasrASR():
    def __init__(
            self,
            model: str,
            vad_model: str = None,
            vad_kwargs: dict = None,
            punc_model: str = None,
            punc_kwargs: dict = None,
            spk_model: str = None,
            spk_kwargs: dict = None,
            model_path: str = None,
            device: str = "cuda:0",
            language: Literal["en", "zh", "ja", "ko", "yue", "nospeech", "auto"] = "auto",
            use_itn: bool = True,
            batch_size_s: int = 60,
            sample_rate: int = 16000,
            disable_update: bool = False
    ):
        self.sample_rate = sample_rate
        self.disable_update = disable_update
        self.language = language
        self.use_itn = use_itn
        self.batch_size_s = batch_size_s

        self.model = AutoModel(
            model=model,
            vad_model=vad_model,
            vad_kwargs=vad_kwargs,
            punc_model=punc_model,
            punc_kwargs=punc_kwargs,
            spk_model=spk_model,
            spk_kwargs=spk_kwargs, 
            model_path=model_path,
            device=device,
        )

    def audio2text(self, audio: np.ndarray) -> str:
        
        res = self.model.generate(
            input=audio,
            language=self.language,
            use_itn=self.use_itn,
            batch_size_s=self.batch_size_s,
        )

        text_result = rich_transcription_postprocess(res[0]['text'])

        return text_result
        

