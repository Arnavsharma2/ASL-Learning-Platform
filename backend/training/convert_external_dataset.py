"""
Convert external datasets to your JSON format
Supports: Images, Videos, Keypoint datasets

Usage:
    python convert_external_dataset.py --input /path/to/dataset --output converted.json
    python convert_external_dataset.py --input /path/to/dataset --output converted.json --mapping label_mapping.json
"""

import cv2
import json
import mediapipe as mp
from pathlib import Path
from typing import List, Dict, Optional
import argparse
import tqdm

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
        try:
            image = cv2.imread(str(image_path))
            if image is None:
                return None
            
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.hands.process(image_rgb)
            
            if results.multi_hand_landmarks:
                landmarks = results.multi_hand_landmarks[0]
                return [[lm.x, lm.y, lm.z] for lm in landmarks.landmark]
            return None
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
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
        
        # Get all subdirectories (sign classes)
        sign_dirs = [d for d in sorted(image_dir.iterdir()) if d.is_dir()]
        
        if not sign_dirs:
            print(f"❌ No subdirectories found in {image_dir}")
            print("Expected structure: dataset/sign_name/image1.jpg")
            return []
        
        print(f"Found {len(sign_dirs)} sign classes")
        
        for sign_dir in sign_dirs:
            sign_name = label_mapping.get(sign_dir.name, sign_dir.name)
            print(f"\n📁 Processing {sign_name} ({sign_dir.name})...")
            
            # Find all images
            image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
            image_files = []
            for ext in image_extensions:
                image_files.extend(list(sign_dir.glob(f"*{ext}")))
                image_files.extend(list(sign_dir.glob(f"*{ext.upper()}")))
            
            if not image_files:
                print(f"  ⚠️  No images found in {sign_dir}")
                continue
            
            print(f"  Found {len(image_files)} images")
            
            # Process images with progress bar
            count = 0
            failed = 0
            for img_path in tqdm.tqdm(image_files, desc=f"  Extracting landmarks"):
                landmarks = self.extract_landmarks_from_image(img_path)
                if landmarks and len(landmarks) == 21:
                    samples.append({
                        "sign": sign_name,
                        "landmarks": landmarks,
                        "timestamp": int(img_path.stat().st_mtime * 1000)
                    })
                    count += 1
                else:
                    failed += 1
            
            print(f"  ✅ Extracted {count} samples, {failed} failed")
        
        if not samples:
            print("\n❌ No samples extracted! Check:")
            print("  - Images contain visible hands")
            print("  - MediaPipe can detect hands in images")
            print("  - Image paths are correct")
            return []
        
        # Save
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(samples, f, indent=2)
        
        # Print statistics
        sign_counts = {}
        for sample in samples:
            sign = sample['sign']
            sign_counts[sign] = sign_counts.get(sign, 0) + 1
        
        print(f"\n✅ Successfully converted dataset!")
        print(f"   Total samples: {len(samples)}")
        print(f"   Signs: {len(sign_counts)}")
        print(f"   Saved to: {output_file}")
        print(f"\n   Samples per sign:")
        for sign, count in sorted(sign_counts.items()):
            print(f"     {sign}: {count}")
        
        return samples
    
    def cleanup(self):
        """Clean up MediaPipe resources"""
        self.hands.close()


def main():
    parser = argparse.ArgumentParser(
        description="Convert external dataset to JSON format compatible with training pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert ASL Alphabet dataset
  python convert_external_dataset.py \\
      --input /path/to/asl_alphabet_train \\
      --output data/asl_alphabet_landmarks.json

  # Convert with label mapping
  python convert_external_dataset.py \\
      --input /path/to/dataset \\
      --output data/converted.json \\
      --mapping label_mapping.json

Expected directory structure:
  dataset/
    ├── A/
    │   ├── image1.jpg
    │   ├── image2.jpg
    │   └── ...
    ├── B/
    │   ├── image1.jpg
    │   └── ...
    └── ...
        """
    )
    parser.add_argument(
        "--input", 
        type=str, 
        required=True, 
        help="Input dataset directory (should contain subdirectories for each sign)"
    )
    parser.add_argument(
        "--output", 
        type=str, 
        default="data/converted_dataset.json", 
        help="Output JSON file path (default: data/converted_dataset.json)"
    )
    parser.add_argument(
        "--mapping", 
        type=str, 
        help="JSON file with label mapping from directory names to sign names (optional)"
    )
    
    args = parser.parse_args()
    
    # Validate input
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ Error: Input directory does not exist: {input_path}")
        return
    
    if not input_path.is_dir():
        print(f"❌ Error: Input path is not a directory: {input_path}")
        return
    
    # Load label mapping if provided
    label_mapping = None
    if args.mapping:
        mapping_path = Path(args.mapping)
        if not mapping_path.exists():
            print(f"❌ Error: Mapping file does not exist: {mapping_path}")
            return
        
        with open(mapping_path, 'r') as f:
            label_mapping = json.load(f)
        print(f"📋 Loaded label mapping from {mapping_path}")
    
    # Convert dataset
    converter = DatasetConverter()
    try:
        converter.convert_image_dataset(
            image_dir=input_path,
            label_mapping=label_mapping,
            output_file=Path(args.output)
        )
    finally:
        converter.cleanup()


if __name__ == "__main__":
    main()

