"""
Server-side hand tracking endpoint for maximum performance mode
Uses MediaPipe on the server to process video frames
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import base64
import cv2
import numpy as np
import json
import asyncio
from io import BytesIO

router = APIRouter()

# Global MediaPipe hands instance (lazy loaded)
_hands_instance = None


def get_mediapipe_hands():
    """Lazy load MediaPipe Hands"""
    global _hands_instance
    if _hands_instance is None:
        try:
            import mediapipe as mp
            mp_hands = mp.solutions.hands
            _hands_instance = mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                model_complexity=0,  # Fastest model
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="MediaPipe not installed. Install with: pip install mediapipe"
            )
    return _hands_instance


class FrameInput(BaseModel):
    """Input frame data"""
    image_data: str  # Base64 encoded image
    width: Optional[int] = 640
    height: Optional[int] = 480


class HandLandmarkResponse(BaseModel):
    """Response with hand landmarks"""
    landmarks: List[List[float]]  # List of hands, each with 21 landmarks [x, y, z]
    hand_count: int
    processing_time_ms: float


@router.post("/process-frame", response_model=HandLandmarkResponse)
async def process_frame(frame: FrameInput):
    """
    Process a single video frame and return hand landmarks
    Optimized for maximum performance
    """
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(frame.image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Convert BGR to RGB (MediaPipe expects RGB)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        import time
        start_time = time.time()
        
        hands = get_mediapipe_hands()
        results = hands.process(img_rgb)
        
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Extract landmarks
        landmarks_list = []
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                hand_points = []
                for landmark in hand_landmarks.landmark:
                    hand_points.append([landmark.x, landmark.y, landmark.z])
                landmarks_list.append(hand_points)
        
        return HandLandmarkResponse(
            landmarks=landmarks_list,
            hand_count=len(landmarks_list),
            processing_time_ms=processing_time
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.websocket("/ws/process-stream")
async def websocket_process_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time frame processing
    Client sends base64-encoded frames, server responds with landmarks
    """
    await websocket.accept()
    hands = get_mediapipe_hands()
    
    try:
        while True:
            # Receive frame data
            data = await websocket.receive_text()
            frame_data = json.loads(data)
            
            # Decode base64 image
            image_bytes = base64.b64decode(frame_data.get('image_data', ''))
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                await websocket.send_json({
                    "error": "Invalid image data",
                    "landmarks": [],
                    "hand_count": 0
                })
                continue
            
            # Convert BGR to RGB
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = hands.process(img_rgb)
            
            # Extract landmarks
            landmarks_list = []
            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    hand_points = []
                    for landmark in hand_landmarks.landmark:
                        hand_points.append([landmark.x, landmark.y, landmark.z])
                    landmarks_list.append(hand_points)
            
            # Send response
            await websocket.send_json({
                "landmarks": landmarks_list,
                "hand_count": len(landmarks_list),
                "timestamp": frame_data.get('timestamp', 0)
            })
    
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason=str(e))

