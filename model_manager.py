"""Model Manager with lazy loading and configurable warm-up."""

import os
import logging
import numpy as np
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


class ModelManager:
    """Manages YOLO model with lazy loading and GPU warm-up."""
    
    def __init__(self, model_path, warmup_enabled=None):
        """Initialize ModelManager.
        
        Args:
            model_path: Path to YOLO weights file
            warmup_enabled: Enable warm-up (None=auto from env, True/False=override)
        """
        self.model_path = model_path
        self._model = None
        self._warmed_up = False
        
        # Check warmup from env or parameter
        if warmup_enabled is None:
            warmup_enabled = os.getenv('MODEL_WARMUP', '1') == '1'
        self.warmup_enabled = warmup_enabled
        
        logger.info(f"ModelManager initialized (warmup={'enabled' if self.warmup_enabled else 'disabled'})")
    
    def get_model(self):
        """Get model instance, loading lazily on first call."""
        if self._model is None:
            logger.info(f"Loading model from {self.model_path}")
            self._model = YOLO(self.model_path)
            logger.info(f"Model loaded on device: {self._model.device}")
            
            if self.warmup_enabled and not self._warmed_up:
                self.warmup()
        
        return self._model
    
    def warmup(self, sizes=[640, 832, 1024]):
        """Warm up model with dummy inferences.
        
        Args:
            sizes: List of image sizes for warm-up
        """
        if self._warmed_up:
            logger.info("Model already warmed up")
            return
        
        if self._model is None:
            logger.warning("Model not loaded, loading now...")
            self.get_model()
        
        logger.info(f"Warming up model with sizes: {sizes}")
        
        for size in sizes:
            dummy_img = np.zeros((size, size, 3), dtype=np.uint8)
            self._model(dummy_img, verbose=False)
            logger.info(f"Warm-up complete for size {size}x{size}")
        
        self._warmed_up = True
        logger.info("Model warm-up finished")
