"""
Inference server for ASL sign recognition
Serves predictions via HTTP API for the frontend to use
"""

import torch
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
from pathlib import Path
from model import create_model

app = FastAPI(title="ASL Sign Recognition API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model storage
model = None
labels = None
device = None


class LandmarksInput(BaseModel):
    landmarks: List[List[float]]  # 21 landmarks, each with [x, y, z]


class PredictionOutput(BaseModel):
    sign: str
    confidence: float
    probabilities: dict


def load_model(model_path: str = "models/best_model.pth"):
    """Load the trained PyTorch model with GPU acceleration if available"""
    global model, labels, device

    # Determine best available device (prioritize GPU)
    if torch.cuda.is_available():
        device = torch.device('cuda')
        print(f"🚀 GPU Acceleration: CUDA available")
        print(f"   Device: {torch.cuda.get_device_name(0)}")
        print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        device = torch.device('mps')  # Apple Silicon GPU
        print(f"🚀 GPU Acceleration: Apple Metal (MPS) available")
    else:
        device = torch.device('cpu')
        print(f"⚙️  Using CPU (GPU not available)")
        print(f"   For better performance, ensure CUDA (NVIDIA) or MPS (Apple Silicon) is available")

    print(f"Loading model on device: {device}")

    # Load checkpoint
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)

    # Create model
    model = create_model(
        model_type=checkpoint['model_type'],
        num_classes=checkpoint['num_classes']
    )
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()

    # Store labels
    labels = {
        'idx_to_label': checkpoint['idx_to_label'],
        'label_to_idx': checkpoint['label_to_idx'],
        'num_classes': checkpoint['num_classes']
    }

    print(f"✓ Model loaded: {checkpoint['model_type']}")
    print(f"  Number of classes: {checkpoint['num_classes']}")
    print(f"  Signs: {list(labels['label_to_idx'].keys())}")


@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    model_path = Path(__file__).parent / "models" / "best_model.pth"
    if not model_path.exists():
        print(f"Warning: Model file not found at {model_path}")
        print("Please train a model first using train.py")
    else:
        load_model(str(model_path))


@app.get("/")
async def root():
    """Health check endpoint"""
    # Filter to only A-Z letters
    alphabet_letters = set('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    all_signs = list(labels['label_to_idx'].keys()) if labels else []
    filtered_signs = [s for s in all_signs if s in alphabet_letters]
    return {
        "status": "running",
        "model_loaded": model is not None,
        "signs": filtered_signs
    }


@app.post("/predict", response_model=PredictionOutput)
async def predict(input_data: LandmarksInput):
    """
    Predict ASL sign from hand landmarks

    Args:
        landmarks: List of 21 hand landmarks, each with [x, y, z] coordinates

    Returns:
        sign: Predicted sign name
        confidence: Confidence score (0-1)
        probabilities: Dictionary of all class probabilities
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Validate input
        if len(input_data.landmarks) != 21:
            raise HTTPException(
                status_code=400,
                detail=f"Expected 21 landmarks, got {len(input_data.landmarks)}"
            )

        # Flatten landmarks to 63 features
        landmarks_flat = np.array(input_data.landmarks).flatten()

        if len(landmarks_flat) != 63:
            raise HTTPException(
                status_code=400,
                detail=f"Expected 63 features (21 landmarks × 3 coords), got {len(landmarks_flat)}"
            )

        # Convert to tensor
        input_tensor = torch.FloatTensor(landmarks_flat).unsqueeze(0).to(device)

        # Predict
        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.softmax(output, dim=1)

            # Filter to only A-Z letters (ignore "del" and "space")
            alphabet_letters = set('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
            best_letter_idx = -1
            best_letter_prob = -1.0

            probs_np = probabilities[0].cpu().numpy()
            for i in range(len(labels['idx_to_label'])):
                label = labels['idx_to_label'][i]
                # Only consider A-Z letters
                if label in alphabet_letters and probs_np[i] > best_letter_prob:
                    best_letter_prob = probs_np[i]
                    best_letter_idx = i

            # If no letter found (shouldn't happen), fall back to original prediction
            if best_letter_idx == -1:
                confidence, predicted_idx = probabilities.max(1)
                predicted_idx = predicted_idx.item()
                confidence = confidence.item()
                sign = labels['idx_to_label'][predicted_idx]
            else:
                sign = labels['idx_to_label'][best_letter_idx]
                confidence = float(best_letter_prob)

            # Get all probabilities (only for A-Z letters)
            all_probs = {
                labels['idx_to_label'][i]: float(probabilities[0][i])
                for i in range(len(labels['idx_to_label']))
                if labels['idx_to_label'][i] in alphabet_letters
            }

        return PredictionOutput(
            sign=sign,
            confidence=confidence,
            probabilities=all_probs
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/labels")
async def get_labels():
    """Get all available sign labels"""
    if labels is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    return labels


if __name__ == "__main__":
    uvicorn.run(
        "inference_server:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
