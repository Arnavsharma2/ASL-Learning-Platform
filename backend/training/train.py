"""
Training script for ASL sign recognition model
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from pathlib import Path
import pickle
import json
from model import create_model
from tqdm import tqdm

class Trainer:
    def __init__(
        self,
        model_type='mlp',
        learning_rate=0.001,
        batch_size=32,
        num_epochs=100,
        device=None
    ):
        self.model_type = model_type
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.num_epochs = num_epochs

        # Set device
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        print(f"Using device: {self.device}")

        self.model = None
        self.optimizer = None
        self.criterion = None
        self.best_val_loss = float('inf')
        self.train_history = {'loss': [], 'acc': []}
        self.val_history = {'loss': [], 'acc': []}

    def load_data(self, data_dir='data/processed'):
        """Load preprocessed dataset"""
        data_path = Path(data_dir)

        print(f"Loading data from {data_path}")

        # Load arrays
        X_train = np.load(data_path / 'X_train.npy')
        X_val = np.load(data_path / 'X_val.npy')
        X_test = np.load(data_path / 'X_test.npy')
        y_train = np.load(data_path / 'y_train.npy')
        y_val = np.load(data_path / 'y_val.npy')
        y_test = np.load(data_path / 'y_test.npy')

        # Load label mapping
        with open(data_path / 'label_mapping.pkl', 'rb') as f:
            label_info = pickle.load(f)

        self.num_classes = label_info['num_classes']
        self.label_to_idx = label_info['label_to_idx']
        self.idx_to_label = label_info['idx_to_label']

        print(f"Dataset loaded:")
        print(f"  Train: {len(X_train)} samples")
        print(f"  Val: {len(X_val)} samples")
        print(f"  Test: {len(X_test)} samples")
        print(f"  Classes: {self.num_classes}")

        # Convert to PyTorch tensors
        X_train = torch.FloatTensor(X_train)
        X_val = torch.FloatTensor(X_val)
        X_test = torch.FloatTensor(X_test)
        y_train = torch.LongTensor(y_train)
        y_val = torch.LongTensor(y_val)
        y_test = torch.LongTensor(y_test)

        # Create data loaders
        train_dataset = TensorDataset(X_train, y_train)
        val_dataset = TensorDataset(X_val, y_val)
        test_dataset = TensorDataset(X_test, y_test)

        self.train_loader = DataLoader(train_dataset, batch_size=self.batch_size, shuffle=True)
        self.val_loader = DataLoader(val_dataset, batch_size=self.batch_size)
        self.test_loader = DataLoader(test_dataset, batch_size=self.batch_size)

        return X_train.shape[1]  # input_size

    def build_model(self, input_size):
        """Build and initialize model"""
        self.model = create_model(self.model_type, num_classes=self.num_classes, input_size=input_size)
        self.model.to(self.device)

        print(f"\nModel: {self.model_type}")
        print(f"Parameters: {sum(p.numel() for p in self.model.parameters())}")

        # Loss and optimizer
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=self.learning_rate)

    def train_epoch(self):
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        for batch_X, batch_y in self.train_loader:
            batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)

            # Forward pass
            outputs = self.model(batch_X)
            loss = self.criterion(outputs, batch_y)

            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

            # Statistics
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += batch_y.size(0)
            correct += predicted.eq(batch_y).sum().item()

        avg_loss = total_loss / len(self.train_loader)
        accuracy = 100. * correct / total

        return avg_loss, accuracy

    def validate(self):
        """Validate model"""
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for batch_X, batch_y in self.val_loader:
                batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)

                outputs = self.model(batch_X)
                loss = self.criterion(outputs, batch_y)

                total_loss += loss.item()
                _, predicted = outputs.max(1)
                total += batch_y.size(0)
                correct += predicted.eq(batch_y).sum().item()

        avg_loss = total_loss / len(self.val_loader)
        accuracy = 100. * correct / total

        return avg_loss, accuracy

    def train(self, save_dir='models', early_stopping_patience=10):
        """Train the model"""
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)

        best_acc = 0
        patience_counter = 0

        print("\nStarting training...")
        for epoch in range(self.num_epochs):
            train_loss, train_acc = self.train_epoch()
            val_loss, val_acc = self.validate()

            self.train_history['loss'].append(train_loss)
            self.train_history['acc'].append(train_acc)
            self.val_history['loss'].append(val_loss)
            self.val_history['acc'].append(val_acc)

            print(f"Epoch {epoch+1}/{self.num_epochs}")
            print(f"  Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
            print(f"  Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")

            # Save best model
            if val_acc > best_acc:
                best_acc = val_acc
                patience_counter = 0
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                    'val_loss': val_loss,
                    'val_acc': val_acc,
                    'num_classes': self.num_classes,
                    'model_type': self.model_type,
                    'label_to_idx': self.label_to_idx,
                    'idx_to_label': self.idx_to_label,
                }, save_path / 'best_model.pth')
                print(f"  ✓ Best model saved (Val Acc: {val_acc:.2f}%)")
            else:
                patience_counter += 1

            # Early stopping
            if patience_counter >= early_stopping_patience:
                print(f"\nEarly stopping triggered after {epoch+1} epochs")
                break

        # Save training history
        with open(save_path / 'training_history.json', 'w') as f:
            json.dump({
                'train': self.train_history,
                'val': self.val_history,
                'best_val_acc': best_acc
            }, f, indent=2)

        print(f"\nTraining complete!")
        print(f"Best validation accuracy: {best_acc:.2f}%")

    def evaluate(self):
        """Evaluate on test set"""
        self.model.eval()
        correct = 0
        total = 0

        all_preds = []
        all_labels = []

        with torch.no_grad():
            for batch_X, batch_y in self.test_loader:
                batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)

                outputs = self.model(batch_X)
                _, predicted = outputs.max(1)

                total += batch_y.size(0)
                correct += predicted.eq(batch_y).sum().item()

                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(batch_y.cpu().numpy())

        test_acc = 100. * correct / total
        print(f"\nTest Accuracy: {test_acc:.2f}%")

        return test_acc, all_preds, all_labels


def main():
    # Initialize trainer
    trainer = Trainer(
        model_type='mlp',
        learning_rate=0.001,
        batch_size=32,
        num_epochs=100
    )

    # Load data
    input_size = trainer.load_data('data/processed')

    # Build model
    trainer.build_model(input_size)

    # Train
    trainer.train(save_dir='models', early_stopping_patience=15)

    # Evaluate
    trainer.evaluate()


if __name__ == '__main__':
    main()
