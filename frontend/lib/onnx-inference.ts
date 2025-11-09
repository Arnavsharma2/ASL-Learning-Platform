/**
 * ONNX Runtime Web inference for ASL sign recognition
 * Uses the trained PyTorch model exported to ONNX format
 */

import * as ort from 'onnxruntime-web';

export interface ModelPrediction {
  sign: string;
  confidence: number;
  probabilities: { [key: string]: number };
}

interface LabelMapping {
  idx_to_label: { [key: string]: string };
  label_to_idx: { [key: string]: number };
  num_classes: number;
  model_type: string;
  input_size: number;
}

class ONNXInference {
  private session: ort.InferenceSession | null = null;
  private labels: LabelMapping | null = null;
  private isLoading: boolean = false;

  async loadModel(): Promise<void> {
    if (this.session && this.labels) {
      return; // Already loaded
    }

    if (this.isLoading) {
      // Wait for current loading to finish
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;

    try {
      // Load label mapping
      const labelsResponse = await fetch('/models/labels.json');
      if (!labelsResponse.ok) {
        throw new Error('Failed to load label mapping');
      }
      this.labels = await labelsResponse.json();

      // Load ONNX model
      this.session = await ort.InferenceSession.create('/models/model.onnx', {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });

      console.log('✓ ONNX model loaded successfully');
      if (this.labels) {
        console.log(`  Model type: ${this.labels.model_type}`);
        console.log(`  Classes: ${this.labels.num_classes}`);
      }
    } catch (error) {
      console.error('Failed to load ONNX model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async predict(landmarks: number[][]): Promise<ModelPrediction> {
    if (!this.session || !this.labels) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    // Flatten landmarks to 1D array (21 landmarks × 3 coordinates = 63 features)
    const flatLandmarks = landmarks.flat();

    if (flatLandmarks.length !== 63) {
      throw new Error(`Expected 63 features, got ${flatLandmarks.length}`);
    }

    // Create input tensor (shape: [1, 63])
    const inputTensor = new ort.Tensor(
      'float32',
      new Float32Array(flatLandmarks),
      [1, 63]
    );

    // Get the actual input name from the session
    const inputName = this.session.inputNames[0];

    // Run inference
    const feeds = { [inputName]: inputTensor };
    const results = await this.session.run(feeds);

    // Get output tensor using the actual output name
    const outputName = this.session.outputNames[0];
    const output = results[outputName];
    const logits = output.data as Float32Array;

    // Apply softmax to get probabilities
    const probabilities = this.softmax(Array.from(logits));

    // Filter to only A-Z letters (ignore "del" and "space")
    const alphabetLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let bestLetterIdx = -1;
    let bestLetterProb = -1;

    for (let i = 0; i < probabilities.length; i++) {
      const label = this.labels.idx_to_label[i.toString()];
      // Only consider A-Z letters
      if (alphabetLetters.includes(label) && probabilities[i] > bestLetterProb) {
        bestLetterProb = probabilities[i];
        bestLetterIdx = i;
      }
    }

    // If no letter found (shouldn't happen), fall back to original prediction
    if (bestLetterIdx === -1) {
      const predictedIdx = probabilities.indexOf(Math.max(...probabilities));
      const predictedSign = this.labels.idx_to_label[predictedIdx.toString()];
      return {
        sign: predictedSign,
        confidence: probabilities[predictedIdx],
        probabilities: this.createProbabilityMap(probabilities, alphabetLetters),
      };
    }

    const predictedSign = this.labels.idx_to_label[bestLetterIdx.toString()];
    const confidence = probabilities[bestLetterIdx];

    // Create probability map (only for A-Z letters)
    const probabilityMap = this.createProbabilityMap(probabilities, alphabetLetters);

    return {
      sign: predictedSign,
      confidence: confidence,
      probabilities: probabilityMap,
    };
  }

  private softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits);
    const expScores = logits.map(x => Math.exp(x - maxLogit));
    const sumExpScores = expScores.reduce((a, b) => a + b, 0);
    return expScores.map(x => x / sumExpScores);
  }

  private createProbabilityMap(probabilities: number[], allowedLetters: string[]): { [key: string]: number } {
    const probabilityMap: { [key: string]: number } = {};
    for (let i = 0; i < probabilities.length; i++) {
      const label = this.labels!.idx_to_label[i.toString()];
      // Only include A-Z letters in the probability map
      if (allowedLetters.includes(label)) {
        probabilityMap[label] = probabilities[i];
      }
    }
    return probabilityMap;
  }

  isModelLoaded(): boolean {
    return this.session !== null && this.labels !== null;
  }
}

// Singleton instance
const onnxInference = new ONNXInference();

export default onnxInference;
