"""
SageMaker Inference Handler for ASL Recognition
Handles model loading, inference, and response formatting
"""

import json
import os
import onnxruntime as ort
import numpy as np

# Global variables (loaded once on container startup)
session = None
labels = None
ALPHABET_LETTERS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')


def model_fn(model_dir):
    """
    Load model on container startup (runs once)

    Args:
        model_dir: Directory containing model artifacts

    Returns:
        ONNX InferenceSession
    """
    global session, labels

    print(f"Loading model from {model_dir}")

    # Load labels
    labels_path = os.path.join(model_dir, 'labels.json')
    with open(labels_path, 'r') as f:
        labels = json.load(f)
    print(f"Loaded {labels['num_classes']} classes")

    # Load ONNX model with GPU support
    model_path = os.path.join(model_dir, 'model.onnx')

    # Try GPU first, fall back to CPU
    providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']

    session = ort.InferenceSession(
        model_path,
        providers=providers
    )

    used_provider = session.get_providers()[0]
    print(f"Model loaded with provider: {used_provider}")

    return session


def input_fn(request_body, content_type='application/json'):
    """
    Parse input from API request

    Args:
        request_body: Raw request body
        content_type: Content type of request

    Returns:
        Parsed landmarks array
    """
    if content_type == 'application/json':
        data = json.loads(request_body)

        # Support both formats:
        # 1. {"landmarks": [[x,y,z], ...]}
        # 2. Direct array [[x,y,z], ...]
        if isinstance(data, dict) and 'landmarks' in data:
            landmarks = data['landmarks']
        elif isinstance(data, list):
            landmarks = data
        else:
            raise ValueError("Invalid input format. Expected 'landmarks' array or direct array")

        if len(landmarks) != 21:
            raise ValueError(f"Expected 21 landmarks, got {len(landmarks)}")

        return landmarks
    else:
        raise ValueError(f"Unsupported content type: {content_type}")


def predict_fn(landmarks, model):
    """
    Run inference on landmarks

    Args:
        landmarks: List of 21 [x, y, z] coordinates
        model: ONNX InferenceSession

    Returns:
        Prediction result dictionary
    """
    global labels

    # Flatten landmarks to 1D array (21 × 3 = 63)
    flat_landmarks = []
    for lm in landmarks:
        if len(lm) != 3:
            raise ValueError(f"Each landmark must have 3 coordinates (x, y, z), got {len(lm)}")
        flat_landmarks.extend(lm)

    if len(flat_landmarks) != 63:
        raise ValueError(f"Expected 63 features, got {len(flat_landmarks)}")

    # Create input tensor
    input_array = np.array(flat_landmarks, dtype=np.float32).reshape(1, 63)

    # Run inference
    input_name = model.get_inputs()[0].name
    output_name = model.get_outputs()[0].name

    outputs = model.run([output_name], {input_name: input_array})
    logits = outputs[0][0]

    # Apply softmax
    max_logit = np.max(logits)
    exp_scores = np.exp(logits - max_logit)
    probabilities = exp_scores / np.sum(exp_scores)

    # Filter to only A-Z letters
    best_idx = -1
    best_prob = -1

    for i, prob in enumerate(probabilities):
        label = labels['idx_to_label'][str(i)]
        if label in ALPHABET_LETTERS and prob > best_prob:
            best_prob = prob
            best_idx = i

    # Fallback if no letter found
    if best_idx == -1:
        best_idx = np.argmax(probabilities)

    predicted_sign = labels['idx_to_label'][str(best_idx)]
    confidence = float(probabilities[best_idx])

    # Create probability map (only A-Z)
    prob_map = {}
    for i, prob in enumerate(probabilities):
        label = labels['idx_to_label'][str(i)]
        if label in ALPHABET_LETTERS:
            prob_map[label] = float(prob)

    return {
        'sign': predicted_sign,
        'confidence': confidence,
        'probabilities': prob_map
    }


def output_fn(prediction, accept='application/json'):
    """
    Format output for API response

    Args:
        prediction: Prediction result dictionary
        accept: Desired response content type

    Returns:
        Formatted response string
    """
    if accept == 'application/json':
        return json.dumps(prediction), 'application/json'
    else:
        raise ValueError(f"Unsupported accept type: {accept}")
