"""
Prepare dataset from collected JSON files for training
"""

import json
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from typing import List, Tuple
import pickle

def load_json_data(file_path: str) -> List[dict]:
    """Load collected data from JSON file"""
    with open(file_path, 'r') as f:
        return json.load(f)

def prepare_dataset(data_dir: str = 'data', output_dir: str = 'data/processed'):
    """
    Prepare dataset from collected JSON files

    Args:
        data_dir: Directory containing JSON data files
        output_dir: Directory to save processed dataset
    """
    data_path = Path(data_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Load all JSON files
    all_samples = []
    json_files = list(data_path.glob('*.json'))

    if not json_files:
        print(f"No JSON files found in {data_dir}")
        return

    print(f"Found {len(json_files)} JSON files")

    for json_file in json_files:
        samples = load_json_data(json_file)
        all_samples.extend(samples)

    print(f"Total samples loaded: {len(all_samples)}")

    # Extract features and labels
    X = []  # Features (landmarks)
    y = []  # Labels (sign names)

    for sample in all_samples:
        landmarks = np.array(sample['landmarks']).flatten()  # Flatten to 1D array
        X.append(landmarks)
        y.append(sample['sign'])

    X = np.array(X)
    y = np.array(y)

    print(f"Feature shape: {X.shape}")
    print(f"Number of unique signs: {len(np.unique(y))}")
    print(f"Signs: {np.unique(y)}")

    # Filter out classes with too few samples (need at least 10 for proper splitting)
    from collections import Counter
    label_counts = Counter(y)
    min_samples = 10

    # Remove underrepresented classes
    filtered_indices = [i for i, label in enumerate(y) if label_counts[label] >= min_samples]
    X = X[filtered_indices]
    y = y[filtered_indices]

    removed_classes = [label for label, count in label_counts.items() if count < min_samples]
    if removed_classes:
        print(f"\nRemoved classes with < {min_samples} samples: {removed_classes}")
        print(f"Remaining samples: {len(X)}")

    # Create label mapping
    unique_labels = sorted(np.unique(y))
    label_to_idx = {label: idx for idx, label in enumerate(unique_labels)}
    idx_to_label = {idx: label for label, idx in label_to_idx.items()}

    # Convert labels to indices
    y_encoded = np.array([label_to_idx[label] for label in y])

    # Split dataset: 70% train, 15% validation, 15% test
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y_encoded, test_size=0.3, random_state=42, stratify=y_encoded
    )

    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )

    print(f"\nDataset split:")
    print(f"Train: {len(X_train)} samples")
    print(f"Validation: {len(X_val)} samples")
    print(f"Test: {len(X_test)} samples")

    # Save processed data
    np.save(output_path / 'X_train.npy', X_train)
    np.save(output_path / 'X_val.npy', X_val)
    np.save(output_path / 'X_test.npy', X_test)
    np.save(output_path / 'y_train.npy', y_train)
    np.save(output_path / 'y_val.npy', y_val)
    np.save(output_path / 'y_test.npy', y_test)

    # Save label mappings
    with open(output_path / 'label_mapping.pkl', 'wb') as f:
        pickle.dump({
            'label_to_idx': label_to_idx,
            'idx_to_label': idx_to_label,
            'num_classes': len(unique_labels)
        }, f)

    print(f"\nDataset saved to {output_path}")
    print("Files created:")
    print("  - X_train.npy, X_val.npy, X_test.npy")
    print("  - y_train.npy, y_val.npy, y_test.npy")
    print("  - label_mapping.pkl")

    return X_train, X_val, X_test, y_train, y_val, y_test, label_to_idx, idx_to_label

if __name__ == '__main__':
    prepare_dataset()
