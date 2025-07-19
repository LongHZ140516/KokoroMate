import os 
import asyncio
from loguru import logger
from litellm import acompletion, aembedding
from typing import Optional, List, Dict, Any


class AsyncLiteLLM():
    def __init__(
            self,
            model: str,
            stream: Optional[bool] = True,
            api_key: Optional[str] = None,
            api_type: Optional[str] = None,
            api_version: Optional[str] = None,
            base_url: Optional[str] = None,
    ):
        """
        Initialize the Litellm service

        Args:
            - model(str): The model to use
            - stream(Optional[bool]): Whether to stream the response, default is True
            - api_key(Optional[str]): The API key to use, default is "None"
            - api_version(Optional[str]): The API version to use, default is "None"
            - api_type(Optional[str]): The API type to use, default is "None"
            - base_url(Optional[str]): The base URL to use, default is "None"
        """

        self.model = model
        self.stream = stream
        self.api_key = api_key
        self.api_type = api_type
        self.api_version = api_version
        self.base_url = base_url

        logger.info(f"Initialized Litellm service with model: {self.model}")
    
    async def chat_completion(self, messages: List[Dict[str, Any]]):
        """
        Use LLM to generate completion for a list of messages

        Args:
            - messages(List[Dict[str, Any]]): The list of messages to LLM
        """
        logger.info(f"Chat_Messages: {messages}")
        try:
            response = await acompletion(
                model=self.model, 
                messages=messages, 
                stream=self.stream, 
                base_url=self.base_url, 
                api_version=self.api_version, 
                api_key=self.api_key, 
                api_type=self.api_type
            )

            async for chunk in response:
                if chunk.choices[0].delta.content is None:
                    chunk.choices[0].delta.content = ""
                yield chunk.choices[0].delta.content
        except AttributeError as e:
            logger.error(f"AttributeError: {e}")
            yield "Error: AttributeError"
        except Exception as e:
            logger.error(f"Exception: {e}")
            yield "Error: Exception"
