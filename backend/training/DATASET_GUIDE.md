# Using Online Datasets for Sign Language Recognition

This guide explains how to find and use publicly available datasets to train your ASL sign recognition model.

## Your Current Data Format

Your model expects JSON files with this structure:

```json
[
  {
    "sign": "A",
    "landmarks": [
      [x1, y1, z1],
      [x2, y2, z2],
      ...
      [x21, y21, z21]
    ],
    "timestamp": 1234567890
  }
]
```

- **21 landmarks** per hand (MediaPipe format)
- Each landmark has **[x, y, z]** coordinates (normalized 0-1)
- **Sign name** as a string label

## Recommended ASL Datasets

### 1. **ASL Citizen Dataset** ⭐ Best for ASL
- **Source**: [Kaggle - ASL Citizen](https://www.kaggle.com/datasets)
- **Format**: Images/videos with ASL signs
- **Size**: Varies
- **Notes**: Need to extract MediaPipe landmarks from images/videos

### 2. **ASL Alphabet Dataset**
- **Source**: [Kaggle - ASL Alphabet](https://www.kaggle.com/datasets/grassknoted/asl-alphabet)
- **Format**: Images of ASL letters
- **Size**: ~87,000 images (29 classes: 26 letters + space, delete, nothing)
- **Notes**: Static signs, good for letters

### 3. **ASL Fingerspelling Dataset**
- **Source**: [Various research papers](https://arxiv.org/search/?query=ASL+fingerspelling+dataset)
- **Format**: Video sequences
- **Notes**: Dynamic signs, requires video processing

### 4. **Sign Language MNIST**
- **Source**: [Kaggle - Sign Language MNIST](https://www.kaggle.com/datasets/datamunge/sign-language-mnist)
- **Format**: Images (24x24 grayscale)
- **Size**: 27,455 training images, 7,172 test images
- **Notes**: Static signs, needs landmark extraction

## General Hand Gesture Datasets (Can Adapt for ASL)

### 1. **HaGRID Dataset** ⭐ Large & Diverse
- **Source**: [GitHub - [HaGRID Dataset](https://github.com/hukenovs/hagrid)](https://github.com/hukenovs/hagrid)
- **Format**: FullHD RGB images
- **Size**: 554,800 images, 18 gesture classes
- **Notes**: Not ASL-specific but has hand gestures, diverse conditions

### 2. **IPN Hand Dataset**
- **Source**: [IPN Hand Dataset](https://gibranbenitez.github.io/IPN_Hand/)
- **Format**: Videos with hand keypoints
- **Size**: 4,000+ gesture instances, 800,000 frames
- **Notes**: 13 gestures, includes keypoint annotations

### 3. **RHD (Rendered Hand Pose) Dataset**
- **Source**: [RHD Dataset](https://hyper.ai/en/datasets/17580)
- **Format**: RGB images with 21 hand keypoints
- **Size**: 41,258 training samples
- **Notes**: **Already has 21 keypoints!** May need coordinate normalization

## Converting Datasets to Your Format

### Option 1: Convert Images/Videos to MediaPipe Landmarks

If you have image or video datasets, you can extract MediaPipe landmarks:

```python
# convert_dataset.py
import cv2
import json
import mediapipe as mp
from pathlib import Path
import os

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)

def extract_landmarks_from_image(image_path):
    """Extract MediaPipe landmarks from an image"""
    image = cv2.imread(str(image_path))
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)
    
    if results.multi_hand_landmarks:
        landmarks = results.multi_hand_landmarks[0]
        # Convert to [x, y, z] format
        landmarks_list = [[lm.x, lm.y, lm.z] for lm in landmarks.landmark]
        return landmarks_list
    return None

def convert_image_dataset(image_dir, label_mapping, output_file):
    """
    Convert image dataset to your JSON format
    
    Args:
        image_dir: Directory with subdirectories for each sign
        label_mapping: Dict mapping directory names to sign names
        output_file: Output JSON file path
    """
    samples = []
    
    for sign_dir in Path(image_dir).iterdir():
        if not sign_dir.is_dir():
            continue
            
        sign_name = label_mapping.get(sign_dir.name, sign_dir.name)
        print(f"Processing {sign_name}...")
        
        for img_path in sign_dir.glob("*.jpg"):
            landmarks = extract_landmarks_from_image(img_path)
            if landmarks:
                samples.append({
                    "sign": sign_name,
                    "landmarks": landmarks,
                    "timestamp": int(img_path.stat().st_mtime * 1000)
                })
    
    # Save to JSON
    with open(output_file, 'w') as f:
        json.dump(samples, f, indent=2)
    
    print(f"Saved {len(samples)} samples to {output_file}")
    return samples

# Example usage:
# convert_image_dataset(
#     image_dir="path/to/asl_alphabet_dataset",
#     label_mapping={"A": "A", "B": "B", ...},
#     output_file="data/asl_alphabet_landmarks.json"
# )
```

### Option 2: Convert Keypoint Datasets

If a dataset already has hand keypoints (like RHD), convert the format:

```python
# convert_keypoints.py
import json
import numpy as np

def convert_rhd_to_format(rhd_data_path, output_file):
    """
    Convert RHD dataset (21 keypoints) to your format
    RHD format: [x, y] coordinates (pixel space)
    Your format: [x, y, z] coordinates (normalized 0-1)
    """
    samples = []
    
    # Load RHD data (adjust based on actual RHD format)
    with open(rhd_data_path, 'r') as f:
        rhd_data = json.load(f)
    
    for sample in rhd_data:
        # RHD has 21 keypoints as [x, y] pairs
        keypoints = sample['keypoints']  # Shape: (21, 2)
        
        # Normalize coordinates (assuming image dimensions)
        img_width = sample.get('width', 320)
        img_height = sample.get('height', 240)
        
        # Convert to normalized [x, y, z] format
        landmarks = []
        for kp in keypoints:
            x = kp[0] / img_width  # Normalize x
            y = kp[1] / img_height  # Normalize y
            z = 0.0  # RHD doesn't have depth, use 0 or estimate
            landmarks.append([x, y, z])
        
        samples.append({
            "sign": sample['label'],  # Adjust based on RHD label format
            "landmarks": landmarks,
            "timestamp": sample.get('timestamp', 0)
        })
    
    with open(output_file, 'w') as f:
        json.dump(samples, f, indent=2)
    
    print(f"Converted {len(samples)} samples")
```

### Option 3: Download Pre-processed Datasets

Some researchers share pre-processed MediaPipe landmarks:

1. **Search GitHub**: `"mediapipe landmarks" ASL dataset`
2. **Check Papers with Code**: [Papers with Code - ASL](https://paperswithcode.com/task/american-sign-language-recognition)
3. **Kaggle Datasets**: Search for "ASL MediaPipe" or "ASL landmarks"

## Quick Start: Using a Dataset

### Step 1: Download a Dataset

Example: ASL Alphabet Dataset from Kaggle
```bash
# Install Kaggle CLI
pip install kaggle

# Download dataset
kaggle datasets download -d grassknoted/asl-alphabet
unzip asl-alphabet.zip
```

### Step 2: Convert to Your Format

```python
# Use the conversion script above
python convert_dataset.py
```

### Step 3: Use with Your Training Pipeline

```bash
# Place JSON file in data directory
cp converted_dataset.json backend/training/data/

# Prepare dataset
cd backend/training
python prepare_dataset.py

# Train model
python train.py
```

## Dataset Conversion Script

Here's a complete script you can use:

```python
# backend/training/convert_external_dataset.py
"""
Convert external datasets to your JSON format
Supports: Images, Videos, Keypoint datasets
"""

import cv2
import json
import mediapipe as mp
from pathlib import Path
from typing import List, Dict, Optional
import argparse

mp_hands = mp.solutions.hands

class DatasetConverter:
    def __init__(self):
        self.hands = mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=0.5
        )
    
    def extract_landmarks_from_image(self, image_path: Path) -> Optional[List]:
        """Extract MediaPipe landmarks from image"""
        image = cv2.imread(str(image_path))
        if image is None:
            return None
        
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)
        
        if results.multi_hand_landmarks:
            landmarks = results.multi_hand_landmarks[0]
            return [[lm.x, lm.y, lm.z] for lm in landmarks.landmark]
        return None
    
    def convert_image_dataset(self, 
                             image_dir: Path,
                             label_mapping: Optional[Dict[str, str]] = None,
                             output_file: Path = Path("converted_dataset.json")):
        """
        Convert image dataset where each subdirectory is a sign class
        
        Args:
            image_dir: Root directory with sign subdirectories
            label_mapping: Optional mapping from dir name to sign name
            output_file: Output JSON file
        """
        samples = []
        label_mapping = label_mapping or {}
        
        for sign_dir in sorted(image_dir.iterdir()):
            if not sign_dir.is_dir():
                continue
            
            sign_name = label_mapping.get(sign_dir.name, sign_dir.name)
            print(f"Processing {sign_name} ({sign_dir.name})...")
            
            count = 0
            for img_path in sign_dir.glob("*.jpg"):
                landmarks = self.extract_landmarks_from_image(img_path)
                if landmarks and len(landmarks) == 21:
                    samples.append({
                        "sign": sign_name,
                        "landmarks": landmarks,
                        "timestamp": int(img_path.stat().st_mtime * 1000)
                    })
                    count += 1
            
            print(f"  Extracted {count} samples for {sign_name}")
        
        # Save
        with open(output_file, 'w') as f:
            json.dump(samples, f, indent=2)
        
        print(f"\n✅ Saved {len(samples)} samples to {output_file}")
        return samples

def main():
    parser = argparse.ArgumentParser(description="Convert external dataset to JSON format")
    parser.add_argument("--input", type=str, required=True, help="Input dataset directory")
    parser.add_argument("--output", type=str, default="converted_dataset.json", help="Output JSON file")
    parser.add_argument("--mapping", type=str, help="JSON file with label mapping (optional)")
    
    args = parser.parse_args()
    
    converter = DatasetConverter()
    
    label_mapping = None
    if args.mapping:
        with open(args.mapping, 'r') as f:
            label_mapping = json.load(f)
    
    converter.convert_image_dataset(
        image_dir=Path(args.input),
        label_mapping=label_mapping,
        output_file=Path(args.output)
    )

if __name__ == "__main__":
    main()
```

## Usage Examples

### Convert ASL Alphabet Dataset

```bash
# Download from Kaggle first
cd backend/training

# Convert images to landmarks
python convert_external_dataset.py \
    --input /path/to/asl_alphabet_dataset/asl_alphabet_train \
    --output data/asl_alphabet_landmarks.json

# Now use with your training pipeline
python prepare_dataset.py
python train.py
```

### Create Label Mapping

If directory names don't match sign names:

```json
// label_mapping.json
{
  "asl_alphabet_A": "A",
  "asl_alphabet_B": "B",
  "space": "space",
  "del": "delete"
}
```

```bash
python convert_external_dataset.py \
    --input /path/to/dataset \
    --output data/converted.json \
    --mapping label_mapping.json
```

## Tips for Best Results

1. **Dataset Size**: Aim for 100+ samples per sign
2. **Diversity**: Mix multiple datasets for better generalization
3. **Quality**: Filter out samples where MediaPipe fails to detect hands
4. **Normalization**: Ensure all landmarks are normalized (0-1 range)
5. **Validation**: Check converted data before training

## Next Steps

1. Download a dataset (start with ASL Alphabet from Kaggle)
2. Convert using the script above
3. Place JSON file in `backend/training/data/`
4. Run `prepare_dataset.py` and `train.py`
5. Evaluate and iterate!

## Resources

- **Kaggle Datasets**: https://www.kaggle.com/datasets
- **Papers with Code**: https://paperswithcode.com/
- **Google Dataset Search**: https://datasetsearch.research.google.com/
- **MediaPipe Documentation**: https://google.github.io/mediapipe/

