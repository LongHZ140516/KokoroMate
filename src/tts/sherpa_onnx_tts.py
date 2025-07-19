import os
import sherpa_onnx
import numpy as np
import soundfile as sf
from loguru import logger
from typing import List, Literal

class SherpaOnnxTTS():
    def __init__(
        self,
        # vits args
        vits_model: str,  # Path to vits model.onnx
        vits_lexicon: str = "",  # Path to lexicon.txt
        vits_tokens: str = "",  # Path to tokens.txt
        vits_data_dir: str = "",  # Path to the dict directory of espeak-ng.
        vits_dict_dir: str = "",  # Path to the dict directory for models using jieba
        # matcha args
        matcha_acoustic_model: str = "",  # Path to model.onnx for matcha
        matcha_vocoder: str = "",  # Path to vocoder for matcha
        matcha_lexicon: str = "",  # Path to lexicon.txt for matcha
        matcha_tokens: str = "",  # Path to tokens.txt for matcha
        matcha_data_dir: str = "",  # Path to the dict directory of espeak-ng
        matcha_dict_dir: str = "",  # Path to the dict directory for models using jieba
        # kokoro args
        kokoro_model: str = "",  # Path to model.onnx for kokoro
        kokoro_voices: str = "",  # Path to voices.bin for kokoro
        kokoro_lexicon: str = "",  # Path to lexicon.txt for kokoro
        kokoro_tokens: str = "",  # Path to tokens.txt for kokoro
        kokoro_data_dir: str = "",  # Path to the dict directory of espeak-ng
        kokoro_dict_dir: str = "",  # Path to the dict directory for models using jieba
        # general args
        provider: str = "cpu",  # Provider for ONNX runtime
        debug: bool = False,  # Enable debug mode
        num_threads: int = 1,  # Number of threads
        tts_rule_fsts: str = "",  # Path to rule FSTs
        max_num_sentences: int = 2,  # Maximum number of sentences
        sid: int = 0,  # Speaker ID. Used only for multi-speaker models
        speed: float = 1.0,  # Speed of the speech
        format: Literal["mp3", "wav", "pcm"] = "wav",  # Format for the output audio
    ):
        # vits args
        self.vits_model = vits_model
        self.vits_lexicon = vits_lexicon
        self.vits_tokens = vits_tokens
        self.vits_data_dir = vits_data_dir
        self.vits_dict_dir = vits_dict_dir
        # matcha args
        self.matcha_acoustic_model = matcha_acoustic_model
        self.matcha_vocoder = matcha_vocoder
        self.matcha_lexicon = matcha_lexicon
        self.matcha_tokens = matcha_tokens
        self.matcha_data_dir = matcha_data_dir
        self.matcha_dict_dir = matcha_dict_dir
        # kokoro args
        self.kokoro_model = kokoro_model
        self.kokoro_voices = kokoro_voices
        self.kokoro_lexicon = kokoro_lexicon
        self.kokoro_tokens = kokoro_tokens
        self.kokoro_data_dir = kokoro_data_dir
        self.kokoro_dict_dir = kokoro_dict_dir
        # general args
        self.provider = provider
        self.debug = debug
        self.num_threads = num_threads
        self.tts_rule_fsts = tts_rule_fsts
        self.max_num_sentences = max_num_sentences 
        self.sid = sid
        self.speed = speed
        self.format = format

        # initialize tts
        self.tts = sherpa_onnx.OfflineTts(self.initialize_vits_config())

        logger.info(f"""Initialized SherpaOnnxTTS with: \n 
                    - vits_model: {self.vits_model} \n 
                    - matcha_acoustic_model: {self.matcha_acoustic_model} \n 
                    - matcha_vocoder: {self.matcha_vocoder} \n 
                    - kokoro_model: {self.kokoro_model} \n 
                    - provider: {self.provider} \n 
                    - debug: {self.debug}""")

    def initialize_vits_config(self):
        tts_config = sherpa_onnx.OfflineTtsConfig(
            model=sherpa_onnx.OfflineTtsModelConfig(
                vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                    model=self.vits_model,
                    lexicon=self.vits_lexicon,
                    data_dir=self.vits_data_dir,
                    dict_dir=self.vits_dict_dir,
                    tokens=self.vits_tokens,
                ),
                matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
                    acoustic_model=self.matcha_acoustic_model,
                    vocoder=self.matcha_vocoder,
                    lexicon=self.matcha_lexicon,
                    tokens=self.matcha_tokens,
                    data_dir=self.matcha_data_dir,
                    dict_dir=self.matcha_dict_dir,
                ),
                kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                    model=self.kokoro_model,
                    voices=self.kokoro_voices,
                    tokens=self.kokoro_tokens,
                    data_dir=self.kokoro_data_dir,
                    dict_dir=self.kokoro_dict_dir,
                    lexicon=self.kokoro_lexicon,
                ),
                provider=self.provider,
                debug=self.debug,
                num_threads=self.num_threads,
            ),
            rule_fsts=self.tts_rule_fsts,
            max_num_sentences=self.max_num_sentences,
        )
        print(tts_config)
        if not tts_config.validate():
            raise ValueError("Invalid TTS config")
        
        return tts_config

    def generate_speech(self, text: str):
        
        if not os.path.exists(f"cache"):
            os.makedirs(f"cache")

        file_path = f"cache/speech_temp.{self.format}"
        
        print(file_path)

        try:
            audio = self.tts.generate(text, sid=self.sid, speed=self.speed)

            if len(audio.samples) == 0:
                logger.error("Error in generating audio, please check the text and model")
                return None
            
            sf.write(
                file_path,
                audio.samples,
                audio.sample_rate,
                subtype="PCM_16"
            )

            return file_path
        
        except Exception as e:
            logger.error(f"Error in generating audio: {e}")
            return None
