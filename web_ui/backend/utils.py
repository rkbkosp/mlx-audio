import asyncio
from typing import Dict, Any, List
from mlx_audio.utils import load_model

class ModelProvider:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelProvider, cls).__new__(cls)
            cls._instance.models: Dict[str, Dict[str, Any]] = {}
            cls._instance.lock = asyncio.Lock()
        return cls._instance

    async def load_model(self, model_name: str):
        async with self.lock:
            if model_name not in self.models:
                # This might be blocking, consider running in executor if slow
                self.models[model_name] = load_model(model_name)
            return self.models[model_name]

    async def remove_model(self, model_name: str) -> bool:
        async with self.lock:
            if model_name in self.models:
                del self.models[model_name]
                return True
            return False

    async def get_loaded_models(self) -> List[str]:
        async with self.lock:
            return list(self.models.keys())
    
    def get_model_sync(self, model_name: str):
         # Helper for non-async contexts if needed, but prefer async
        if model_name in self.models:
            return self.models[model_name]
        return None

model_provider = ModelProvider()
