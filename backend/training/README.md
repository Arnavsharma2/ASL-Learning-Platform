# ASL Sign Recognition - Model Training

This directory contains the complete machine learning pipeline for training a custom ASL sign recognition model.

## Quick Start

### 1. Collect Training Data

Visit the data collection page:
```
http://localhost:3000/collect
```

- Collect 100+ samples per sign
- Download the dataset JSON file
- Move it to the `data/` directory

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Prepare Dataset

```bash
python prepare_dataset.py
```

This will:
- Load all JSON files from `data/`
- Extract hand landmarks
- Create train/val/test splits
- Save processed arrays to `data/processed/`

### 4. Train Model

```bash
python train.py
```

This will:
- Load processed data
- Train PyTorch model
- Save best model to `models/best_model.pth`
- Create training history JSON

### 5. Start Inference Server

```bash
python inference_server.py
```

This will:
- Load the trained PyTorch model
- Start FastAPI server on port 8001
- Serve real-time predictions via HTTP API
- Automatically used by the practice page at http://localhost:3000/practice

The inference server provides:
- `/predict` - POST endpoint for real-time sign recognition
- `/labels` - GET endpoint for available signs
- `/` - Health check endpoint

## Directory Structure

```
training/
├── README.md                  # This file
├── requirements.txt           # Python dependencies
├── prepare_dataset.py         # Data preprocessing
├── model.py                   # PyTorch model architectures
├── train.py                   # Training script
├── export_to_tfjs.py          # Model export script
├── data/                      # Raw data directory
│   ├── asl_dataset_*.json     # Collected datasets
│   └── processed/             # Preprocessed data
│       ├── X_train.npy
│       ├── X_val.npy
│       ├── X_test.npy
│       ├── y_train.npy
│       ├── y_val.npy
│       ├── y_test.npy
│       └── label_mapping.pkl
└── models/                    # Trained models
    ├── best_model.pth         # Best PyTorch model
    ├── model.onnx             # ONNX export
    ├── tf_model/              # TensorFlow SavedModel
    └── training_history.json  # Training metrics
```

## Model Architecture

### MLP Classifier (Default)

```
Input: 63 features (21 landmarks × 3 coordinates)
├── Linear(63 → 128) + BatchNorm + ReLU + Dropout(0.3)
├── Linear(128 → 256) + BatchNorm + ReLU + Dropout(0.3)
├── Linear(256 → 128) + BatchNorm + ReLU + Dropout(0.3)
├── Linear(128 → 64) + BatchNorm + ReLU + Dropout(0.3)
└── Linear(64 → num_classes)

Parameters: ~50,000
```

### LSTM Classifier (Alternative)

```
Input: 63 features
├── LSTM(hidden_size=128, num_layers=2, dropout=0.3)
├── Linear(128 → 64) + ReLU + Dropout(0.3)
└── Linear(64 → num_classes)

Parameters: ~80,000
```

## Training Configuration

Default hyperparameters:

```python
{
    'model_type': 'mlp',           # or 'lstm'
    'learning_rate': 0.001,
    'batch_size': 32,
    'num_epochs': 100,
    'early_stopping_patience': 15,
    'optimizer': 'Adam',
    'loss': 'CrossEntropyLoss'
}
```

## Data Collection Best Practices

### Quantity
- **Minimum**: 50 samples per sign
- **Recommended**: 100 samples per sign
- **Ideal**: 200+ samples per sign

### Quality Tips
1. **Lighting**: Vary between bright and dim
2. **Angles**: Record from different camera angles
3. **Positions**: Move hand to different areas of frame
4. **Background**: Use different backgrounds
5. **Variations**: Natural variations in how you make the sign

### Collection Process
1. Select a sign
2. Click "Start Recording"
3. 3-second countdown
4. Hold sign steady for 5 seconds
5. Repeat 100+ times with variations
6. Download dataset

## Expected Performance

### With 100+ Samples Per Sign
- Training Accuracy: >95%
- Validation Accuracy: >85%
- Test Accuracy: >80%
- Inference Time: <50ms

### With 50-100 Samples Per Sign
- Training Accuracy: >90%
- Validation Accuracy: >75%
- Test Accuracy: >70%
- Inference Time: <50ms

## Training Output

After training completes, you'll see:

```
Training complete!
Best validation accuracy: 87.34%

Test Accuracy: 82.56%
```

Files created:
- `models/best_model.pth` - Best model checkpoint
- `models/training_history.json` - Loss/accuracy curves

## Customization

### Change Model Architecture

In `train.py`:

```python
trainer = Trainer(
    model_type='mlp',  # or 'lstm'
    learning_rate=0.001,
    batch_size=32,
    num_epochs=100
)
```

### Modify Network Layers

In `model.py`:

```python
model = ASLClassifier(
    num_classes=26,
    hidden_sizes=[128, 256, 128, 64]  # Customize layers
)
```

### Add Data Augmentation

In `prepare_dataset.py`, add augmentation:

```python
def augment_landmarks(landmarks):
    # Add noise
    noise = np.random.normal(0, 0.01, landmarks.shape)
    return landmarks + noise

# Apply during data loading
X_augmented = augment_landmarks(X_train)
```

## Troubleshooting

### Issue: "No JSON files found"

**Solution**: Place collected JSON files in `data/` directory

```bash
mv ~/Downloads/asl_dataset_*.json data/
```

### Issue: Low Accuracy (<70%)

**Solutions**:
1. Collect more data (100+ samples)
2. Ensure high-quality samples
3. Check for class imbalance
4. Try different model architecture
5. Adjust hyperparameters

### Issue: Overfitting (High train, low val accuracy)

**Solutions**:
1. Increase dropout (0.3 → 0.5)
2. Collect more diverse data
3. Reduce model size
4. Add data augmentation
5. Early stopping (already enabled)

### Issue: Export Fails

**Solution**: Use simplified export

```bash
python export_to_tfjs.py --simple
```

This creates label mappings without full conversion.

### Issue: CUDA Out of Memory

**Solution**: Reduce batch size

```python
trainer = Trainer(batch_size=16)  # Default is 32
```

## Advanced Usage

### Training on GPU

The script automatically detects and uses GPU if available:

```python
# Check available device
python -c "import torch; print(torch.cuda.is_available())"
```

### Experiment Tracking

Modify `train.py` to add TensorBoard:

```python
from torch.utils.tensorboard import SummaryWriter

writer = SummaryWriter('runs/experiment_1')
writer.add_scalar('Loss/train', train_loss, epoch)
writer.add_scalar('Accuracy/val', val_acc, epoch)
```

### Hyperparameter Tuning

Create a grid search script:

```python
for lr in [0.001, 0.0001]:
    for batch_size in [16, 32, 64]:
        trainer = Trainer(learning_rate=lr, batch_size=batch_size)
        trainer.train()
```

## Model Evaluation

The training script provides:
- Training loss/accuracy per epoch
- Validation loss/accuracy per epoch
- Test accuracy on held-out set
- Confusion matrix (optional)

To generate detailed evaluation:

```python
python train.py
# After training completes, run evaluation
```

## Dependencies

Core requirements:
- Python 3.8+
- PyTorch 2.0+
- NumPy
- scikit-learn
- ONNX (for export)
- TensorFlow (for export)
- TensorFlow.js converter

See `requirements.txt` for exact versions.

## Tips for Best Results

1. **Consistent Lighting**: Record in similar lighting conditions
2. **Clear Background**: Use plain backgrounds
3. **Centered Hands**: Keep hands in center of frame
4. **Steady Holds**: Hold each sign steady during recording
5. **Multiple Sessions**: Collect data over several sessions
6. **Balanced Classes**: Collect similar amounts for each sign
7. **Validation**: Always validate on unseen test data

## Next Steps

After training:

1. Review training history
2. Check test accuracy
3. Export to TensorFlow.js
4. Integrate into practice page
5. Test in browser
6. Collect more data if needed
7. Retrain with improved dataset

## Support

For issues or questions:
1. Check this README
2. Review training logs
3. Inspect training_history.json
4. Verify data quality
5. Try with smaller dataset first

## References

- [PyTorch Documentation](https://pytorch.org/docs/)
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [ASL Alphabet Reference](https://www.startasl.com/american-sign-language-alphabet/)
