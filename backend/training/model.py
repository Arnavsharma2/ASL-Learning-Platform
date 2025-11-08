"""
PyTorch model for ASL sign recognition
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class ASLClassifier(nn.Module):
    """
    Neural network for ASL sign classification
    Input: Flattened hand landmarks (21 points * 3 coordinates = 63 features)
    Output: Class probabilities for each sign
    """

    def __init__(self, num_classes: int, input_size: int = 63, hidden_sizes: list = None):
        super(ASLClassifier, self).__init__()

        if hidden_sizes is None:
            hidden_sizes = [128, 256, 128, 64]

        self.num_classes = num_classes
        self.input_size = input_size

        # Build network layers
        layers = []
        prev_size = input_size

        for hidden_size in hidden_sizes:
            layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.BatchNorm1d(hidden_size),
                nn.ReLU(),
                nn.Dropout(0.3)
            ])
            prev_size = hidden_size

        # Output layer
        layers.append(nn.Linear(prev_size, num_classes))

        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return self.network(x)


class ASLLSTMClassifier(nn.Module):
    """
    LSTM-based classifier for temporal sequence modeling
    Useful if we collect sequences of landmarks over time
    """

    def __init__(self, num_classes: int, input_size: int = 63, hidden_size: int = 128, num_layers: int = 2):
        super(ASLLSTMClassifier, self).__init__()

        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.3 if num_layers > 1 else 0
        )

        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_size // 2, num_classes)
        )

    def forward(self, x):
        # x shape: (batch_size, seq_len, input_size) or (batch_size, input_size)
        if len(x.shape) == 2:
            # Add sequence dimension
            x = x.unsqueeze(1)  # (batch_size, 1, input_size)

        # LSTM forward pass
        lstm_out, (h_n, c_n) = self.lstm(x)

        # Use last hidden state
        last_hidden = h_n[-1]  # (batch_size, hidden_size)

        # Classification
        output = self.fc(last_hidden)
        return output


def create_model(model_type: str = 'mlp', num_classes: int = 26, **kwargs):
    """
    Factory function to create models

    Args:
        model_type: 'mlp' or 'lstm'
        num_classes: Number of sign classes
        **kwargs: Additional model-specific arguments

    Returns:
        PyTorch model
    """
    if model_type == 'mlp':
        return ASLClassifier(num_classes, **kwargs)
    elif model_type == 'lstm':
        return ASLLSTMClassifier(num_classes, **kwargs)
    else:
        raise ValueError(f"Unknown model type: {model_type}")


if __name__ == '__main__':
    # Test model creation
    print("Testing MLP model:")
    model_mlp = create_model('mlp', num_classes=26)
    test_input = torch.randn(32, 63)  # Batch of 32 samples
    output = model_mlp(test_input)
    print(f"Input shape: {test_input.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Model parameters: {sum(p.numel() for p in model_mlp.parameters())}")

    print("\nTesting LSTM model:")
    model_lstm = create_model('lstm', num_classes=26)
    output_lstm = model_lstm(test_input)
    print(f"Output shape: {output_lstm.shape}")
    print(f"Model parameters: {sum(p.numel() for p in model_lstm.parameters())}")
