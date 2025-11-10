"""
Server-side hand detection endpoint for max performance mode
Processes images server-side to offload computation from client
Note: MediaPipe requires Python 3.8-3.12. For Python 3.13+, this is a placeholder
that returns a simple response. Install MediaPipe separately if needed.
"""
from fastapi import APIRouter, HTTPException
import cv2
import numpy as np
import base64
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Try to import MediaPipe (optional)
try:
    import mediapipe as mp
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    # Global hands detector (reuse across requests for efficiency)
    hands_detector = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    print("⚠️  MediaPipe not available. Install with: pip install mediapipe (Python 3.8-3.12 only)")
    print("⚠️  Hand detection endpoint will return mock data.")
    MEDIAPIPE_AVAILABLE = False


class HandDetectionRequest(BaseModel):
    """Request model for base64 encoded image"""
    image: str  # base64 encoded image
    return_annotated_image: bool = False


class LandmarkPoint(BaseModel):
    """Single hand landmark point"""
    x: float
    y: float
    z: float


class HandDetectionResponse(BaseModel):
    """Response model with detected hand landmarks"""
    landmarks: List[List[LandmarkPoint]]  # List of hands, each with 21 landmarks
    hand_count: int
    annotated_image: Optional[str] = None  # base64 encoded annotated image


@router.post("/detect-hands", response_model=HandDetectionResponse)
async def detect_hands(request: HandDetectionRequest):
    """
    Detect hands in an image and return landmarks
    Used for max_performance mode - offloads processing to server
    """
    if not MEDIAPIPE_AVAILABLE:
        # Return empty response if MediaPipe is not available
        return HandDetectionResponse(
            landmarks=[],
            hand_count=0,
            annotated_image=None
        )

    try:
        # Decode base64 image
        image_data = request.image.split(',')[1] if ',' in request.image else request.image
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Process image with MediaPipe
        results = hands_detector.process(image_rgb)

        # Extract landmarks
        all_landmarks = []
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                landmarks = []
                for landmark in hand_landmarks.landmark:
                    landmarks.append(LandmarkPoint(
                        x=landmark.x,
                        y=landmark.y,
                        z=landmark.z
                    ))
                all_landmarks.append(landmarks)

        # Optionally return annotated image
        annotated_image_base64 = None
        if request.return_annotated_image and results.multi_hand_landmarks:
            # Draw landmarks on image
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    image,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=4),
                    mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
                )

            # Encode annotated image to base64
            _, buffer = cv2.imencode('.jpg', image)
            annotated_image_base64 = base64.b64encode(buffer).decode('utf-8')
            annotated_image_base64 = f"data:image/jpeg;base64,{annotated_image_base64}"

        return HandDetectionResponse(
            landmarks=all_landmarks,
            hand_count=len(all_landmarks),
            annotated_image=annotated_image_base64
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hand detection failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "hand_detection"}
