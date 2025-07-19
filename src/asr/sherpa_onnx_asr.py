import sherpa_onnx
import numpy as np
from loguru import logger
from typing import List


class SherpaOnnxASR():
    def __init__(
        self,
        model_name: str = "paraformer",
        # general args
        tokens: str = None,
        num_threads: int = 1,
        sample_rate: int = 16000,
        feature_dim: int = 80,
        decoding_method: str = "greedy_search",
        debug: bool = False,
        provider: str = "cpu",
        # transducer args
        model: str = None,
        encoder: str = None,
        decoder: str = None,
        joiner: str = None,
        paraformer: str = None,
        # whisper args
        language: str = "en",
        task: str = "transcribe",
        tail_paddings: int = -1,
        # sense voice args
        use_itn: bool = False,
        # moonshine args
        preprocessor: str = None,
        uncached_decoder: str = None,
        cached_decoder: str = None,
        # other optional args
        max_active_paths: int = 4,
        hotwords_file: str = "",
        hotwords_score: float = 1.5,
        blank_penalty: float = 0.0,
        modeling_unit: str = "cjkchar",
        bpe_vocab: str = "",
        model_type: str = "",
        rule_fsts: str = "",
        rule_fars: str = "",
        lm: str = "",
        lm_scale: float = 0.1,
    ):
        """
        Initialize SherpaOnnxASR
        
        Args:
            model: model type, supports the following types:
                - transducer: requires encoder, decoder, joiner
                - paraformer: requires paraformer
                - sense_voice: requires encoder (as model parameter)
                - whisper: requires encoder, decoder
                - nemo_ctc: requires encoder (as model parameter)
                - telespeech_ctc: requires encoder (as model parameter)
                - fire_red_asr: requires encoder, decoder
                - moonshine: requires preprocessor, encoder, uncached_decoder, cached_decoder
                - tdnn_ctc: requires encoder (as model parameter)
                - wenet_ctc: requires encoder (as model parameter)
        """
        # general args
        self.model_name = model_name
        self.tokens = tokens
        self.num_threads = num_threads
        self.sample_rate = sample_rate
        self.feature_dim = feature_dim
        self.decoding_method = decoding_method
        self.debug = debug
        self.provider = provider
        
        # model specific args
        self.model = model
        self.encoder = encoder
        self.decoder = decoder
        self.joiner = joiner
        self.paraformer = paraformer
        
        # whisper specific args
        self.language = language
        self.task = task
        self.tail_paddings = tail_paddings
        
        # sense voice specific args
        self.use_itn = use_itn
        
        # moonshine specific args
        self.preprocessor = preprocessor
        self.uncached_decoder = uncached_decoder
        self.cached_decoder = cached_decoder
        
        # other optional args
        self.max_active_paths = max_active_paths
        self.hotwords_file = hotwords_file
        self.hotwords_score = hotwords_score
        self.blank_penalty = blank_penalty
        self.modeling_unit = modeling_unit
        self.bpe_vocab = bpe_vocab
        self.model_type = model_type
        self.rule_fsts = rule_fsts
        self.rule_fars = rule_fars
        self.lm = lm
        self.lm_scale = lm_scale
        
        # create recognizer
        self.recognizer = self.create_recognizer()

        logger.info(f"""\n-----Initialized SherpaOnnxASR with----- \n 
                    - model_name: {model_name} \n 
                    - tokens: {tokens} \n 
                    - num_threads: {num_threads} \n 
                    - sample_rate: {sample_rate} \n 
                    - feature_dim: {feature_dim} \n 
                    - decoding_method: {decoding_method} \n 
                    - provider: {provider} \n 
                    """)

    def create_recognizer(self):
        """
        Dynamically create a recognizer, supporting all sherpa_onnx model types
        """
        try:
            logger.info(f"Creating {self.model_name} recognizer")
            
            if self.model_name == "transducer":
                recognizer = sherpa_onnx.OfflineRecognizer.from_transducer(
                    encoder=self.encoder,
                    decoder=self.decoder,
                    joiner=self.joiner,
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    sample_rate=self.sample_rate,
                    feature_dim=self.feature_dim,
                    decoding_method=self.decoding_method,
                    max_active_paths=self.max_active_paths,
                    hotwords_file=self.hotwords_file,
                    hotwords_score=self.hotwords_score,
                    blank_penalty=self.blank_penalty,
                    modeling_unit=self.modeling_unit,
                    bpe_vocab=self.bpe_vocab,
                    debug=self.debug,
                    provider=self.provider,
                    model_type=self.model_type,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                    lm=self.lm,
                    lm_scale=self.lm_scale,
                )
            elif self.model_name == "paraformer":
                recognizer = sherpa_onnx.OfflineRecognizer.from_paraformer(
                    paraformer=self.paraformer,
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    sample_rate=self.sample_rate,
                    feature_dim=self.feature_dim,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            elif self.model_name == "sense_voice":
                recognizer = sherpa_onnx.OfflineRecognizer.from_sense_voice(
                    model=self.model,
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    sample_rate=self.sample_rate,
                    feature_dim=self.feature_dim,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    language=self.language,
                    use_itn=self.use_itn,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            elif self.model_name == "whisper":
                recognizer = sherpa_onnx.OfflineRecognizer.from_whisper(
                    encoder=self.encoder,
                    decoder=self.decoder,
                    tokens=self.tokens,
                    language=self.language,
                    task=self.task,
                    num_threads=self.num_threads,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    tail_paddings=self.tail_paddings,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            elif self.model_name == "nemo_ctc":
                recognizer = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(
                    model=self.model,
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    sample_rate=self.sample_rate,
                    feature_dim=self.feature_dim,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            elif self.model_name == "telespeech_ctc":
                recognizer = sherpa_onnx.OfflineRecognizer.from_telespeech_ctc(
                    model=self.model, 
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    sample_rate=self.sample_rate,
                    feature_dim=self.feature_dim,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            elif self.model_name == "fire_red_asr":
                recognizer = sherpa_onnx.OfflineRecognizer.from_fire_red_asr(
                    encoder=self.encoder,
                    decoder=self.decoder,
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            elif self.model_name == "moonshine":
                recognizer = sherpa_onnx.OfflineRecognizer.from_moonshine(
                    preprocessor=self.preprocessor,
                    encoder=self.encoder,
                    uncached_decoder=self.uncached_decoder,
                    cached_decoder=self.cached_decoder,
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            elif self.model_name == "tdnn_ctc":
                recognizer = sherpa_onnx.OfflineRecognizer.from_tdnn_ctc(
                    model=self.model,
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    sample_rate=self.sample_rate,
                    feature_dim=self.feature_dim,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            elif self.model_name == "wenet_ctc":
                recognizer = sherpa_onnx.OfflineRecognizer.from_wenet_ctc(
                    model=self.model,
                    tokens=self.tokens,
                    num_threads=self.num_threads,
                    sample_rate=self.sample_rate,
                    feature_dim=self.feature_dim,
                    decoding_method=self.decoding_method,
                    debug=self.debug,
                    provider=self.provider,
                    rule_fsts=self.rule_fsts,
                    rule_fars=self.rule_fars,
                )
            else:
                supported_models = [
                    "transducer", "paraformer", "sense_voice", "whisper", "nemo_ctc",
                    "telespeech_ctc", "fire_red_asr", "moonshine", "tdnn_ctc", "wenet_ctc"
                ]
                raise ValueError(f"Unsupported model type: '{self.model_name}'. Supported models: {supported_models}")
            
            logger.info(f"Successfully created {self.model_name} recognizer")
            return recognizer
                
        except Exception as e:
            logger.error(f"Failed to create recognizer: {e}")
            raise e
    
    def get_supported_models(self) -> List[str]:
        """Get the list of supported models"""
        return [
            "transducer", "paraformer", "sense_voice", "whisper", "nemo_ctc",
            "telespeech_ctc", "fire_red_asr", "moonshine", "tdnn_ctc", "wenet_ctc"
        ]
    
    def audio2text(self, audio: np.ndarray) -> str:
        stream = self.recognizer.create_stream()
        stream.accept_waveform(self.sample_rate, audio)
        self.recognizer.decode_streams([stream])
        return stream.result.text
