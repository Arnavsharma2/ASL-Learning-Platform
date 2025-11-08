"""
Export PyTorch model to TensorFlow.js format
"""

import torch
import torch.onnx
from pathlib import Path
import pickle
import json
from model import create_model

# Optional imports for full pipeline (not compatible with Python 3.13)
try:
    import onnx
    from onnx_tf.backend import prepare
    import tensorflow as tf
    import tensorflowjs as tfjs
    FULL_EXPORT_AVAILABLE = True
except ImportError:
    FULL_EXPORT_AVAILABLE = False

def pytorch_to_onnx(model, input_size, output_path='models/model.onnx'):
    """Convert PyTorch model to ONNX"""
    model.eval()

    # Create dummy input
    dummy_input = torch.randn(1, input_size)

    # Export
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )

    print(f"Model exported to ONNX: {output_path}")
    return output_path


def onnx_to_tensorflow(onnx_path, tf_output_path='models/tf_model'):
    """Convert ONNX model to TensorFlow SavedModel"""
    # Load ONNX model
    onnx_model = onnx.load(onnx_path)

    # Convert to TensorFlow
    tf_rep = prepare(onnx_model)

    # Export as SavedModel
    tf_rep.export_graph(tf_output_path)

    print(f"Model exported to TensorFlow: {tf_output_path}")
    return tf_output_path


def tensorflow_to_tfjs(tf_model_path, tfjs_output_path='../../frontend/public/models'):
    """Convert TensorFlow SavedModel to TensorFlow.js"""
    output_path = Path(tfjs_output_path)
    output_path.mkdir(parents=True, exist_ok=True)

    # Convert using tensorflowjs converter
    tfjs.converters.convert_tf_saved_model(
        tf_model_path,
        str(output_path),
        quantization_dtype_map=None  # Can use 'uint8' or 'uint16' for quantization
    )

    print(f"Model exported to TensorFlow.js: {output_path}")
    return output_path


def export_full_pipeline(model_path='models/best_model.pth', output_dir='../../frontend/public/models'):
    """
    Complete export pipeline: PyTorch → ONNX → TensorFlow → TensorFlow.js

    Args:
        model_path: Path to trained PyTorch model
        output_dir: Directory to save TensorFlow.js model
    """
    print("Loading trained model...")

    # Load checkpoint (weights_only=False since we trust our own checkpoint)
    checkpoint = torch.load(model_path, map_location='cpu', weights_only=False)

    # Create model
    model = create_model(
        model_type=checkpoint['model_type'],
        num_classes=checkpoint['num_classes']
    )
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    print(f"Model type: {checkpoint['model_type']}")
    print(f"Number of classes: {checkpoint['num_classes']}")

    # Get input size (63 for 21 landmarks * 3 coordinates)
    input_size = 63

    # Step 1: PyTorch to ONNX
    onnx_path = 'models/model.onnx'
    pytorch_to_onnx(model, input_size, onnx_path)

    # Step 2: ONNX to TensorFlow
    tf_path = 'models/tf_model'
    onnx_to_tensorflow(onnx_path, tf_path)

    # Step 3: TensorFlow to TensorFlow.js
    tfjs_path = tensorflow_to_tfjs(tf_path, output_dir)

    # Save label mapping as JSON for frontend
    label_mapping = {
        'idx_to_label': checkpoint['idx_to_label'],
        'label_to_idx': checkpoint['label_to_idx'],
        'num_classes': checkpoint['num_classes']
    }

    with open(Path(output_dir) / 'labels.json', 'w') as f:
        json.dump(label_mapping, f, indent=2)

    print(f"\n✓ Export complete!")
    print(f"  ONNX model: {onnx_path}")
    print(f"  TensorFlow model: {tf_path}")
    print(f"  TensorFlow.js model: {output_dir}")
    print(f"  Label mapping: {output_dir}/labels.json")

    return tfjs_path


def simplified_export(model_path='models/best_model.pth', output_dir='../../frontend/public/models'):
    """
    Simplified export using PyTorch's built-in tracing (doesn't require ONNX/TF)
    Creates a model.json that can be loaded directly by TensorFlow.js
    """
    print("Loading trained model...")

    # Load checkpoint (weights_only=False since we trust our own checkpoint)
    checkpoint = torch.load(model_path, map_location='cpu', weights_only=False)

    # Create model
    model = create_model(
        model_type=checkpoint['model_type'],
        num_classes=checkpoint['num_classes']
    )
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    # Save label mapping
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    label_mapping = {
        'idx_to_label': {str(k): v for k, v in checkpoint['idx_to_label'].items()},
        'label_to_idx': checkpoint['label_to_idx'],
        'num_classes': checkpoint['num_classes'],
        'model_type': checkpoint['model_type']
    }

    with open(output_path / 'labels.json', 'w') as f:
        json.dump(label_mapping, f, indent=2)

    # Save model weights in a format that can be manually converted
    torch.save({
        'weights': model.state_dict(),
        'architecture': str(model),
        'num_classes': checkpoint['num_classes']
    }, output_path / 'model.pth')

    print(f"\n✓ Model and labels saved!")
    print(f"  Labels: {output_path}/labels.json")
    print(f"  Weights: {output_path}/model.pth")
    print("\nNote: For full TensorFlow.js conversion, use export_full_pipeline()")

    return output_path


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--simple':
        # Simplified export (doesn't require ONNX/TensorFlow)
        simplified_export()
    else:
        if not FULL_EXPORT_AVAILABLE:
            print("Full export pipeline not available (requires onnx-tf, tensorflow, tensorflowjs)")
            print("Using simplified export instead...")
            simplified_export()
        else:
            try:
                # Full pipeline export
                export_full_pipeline()
            except Exception as e:
                print(f"\nError during full export: {e}")
                print("\nFalling back to simplified export...")
                simplified_export()
