/**
 * ONNX Runtime Web inference for ASL sign recognition
 * Uses the trained PyTorch model exported to ONNX format
 * Supports browser-based, cloud API, and AWS SageMaker inference
 */

import * as ort from 'onnxruntime-web';
import cloudInference from './cloud-inference';
import sageMakerInference from './sagemaker-inference';

export interface ModelPrediction {
  sign: string;
  confidence: number;
  probabilities: { [key: string]: number };
  inferenceMode?: 'browser' | 'cloud' | 'sagemaker';  // Track which mode was used
  inferenceTimeMs?: number;  // Inference time
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
  private static readonly ALPHABET_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

      // Try WebGL first, but gracefully fall back to WASM if unavailable
      let session: ort.InferenceSession | null = null;
      let usedProvider = 'unknown';

      try {
        // Attempt WebGL (GPU) first
        session = await ort.InferenceSession.create('/models/model.onnx', {
          executionProviders: ['webgl'],
          graphOptimizationLevel: 'all',
          enableMemPattern: true,
          enableCpuMemArena: true,
          logSeverityLevel: 0,
          logVerbosityLevel: 0,
        });
        usedProvider = 'webgl';
        console.log('✓ Using WebGL (GPU) for ONNX inference');
      } catch (webglError) {
        console.warn('WebGL backend not available, falling back to WASM (CPU):', webglError);

        // Fall back to WASM (CPU)
        session = await ort.InferenceSession.create('/models/model.onnx', {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
          enableMemPattern: true,
          enableCpuMemArena: true,
          logSeverityLevel: 0,
          logVerbosityLevel: 0,
        });
        usedProvider = 'wasm';
        console.log('✓ Using WASM (CPU) for ONNX inference - this is slower but should still work');
      }

      this.session = session;

      // Log model details
      console.log(`ONNX Model Details:`);
      console.log(`  Provider: ${usedProvider.toUpperCase()} ${usedProvider === 'webgl' ? '(GPU - Fast!)' : '(CPU - Slower but functional)'}`);
      if (this.labels) {
        console.log(`  Model type: ${this.labels.model_type}`);
        console.log(`  Classes: ${this.labels.num_classes}`);
      }
      console.log(`  Throttled to: ~10 FPS for optimal performance`);
    } catch (error) {
      console.error('Failed to load ONNX model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async predict(landmarks: number[][]): Promise<ModelPrediction> {
    const startTime = performance.now();

    // Try SageMaker first if configured
    if (sageMakerInference.isConfigured()) {
      try {
        console.log('Using AWS SageMaker inference...');
        const sageMakerResult = await sageMakerInference.predict(landmarks);
        const inferenceTime = performance.now() - startTime;
        return {
          sign: sageMakerResult.sign,
          confidence: sageMakerResult.confidence,
          probabilities: sageMakerResult.probabilities,
          inferenceMode: 'sagemaker',
          inferenceTimeMs: inferenceTime,
        };
      } catch (error) {
        console.warn('SageMaker inference failed, falling back to browser:', error);
        // Fall through to browser inference
      }
    }

    // Try cloud API if available
    if (cloudInference.isReady()) {
      try {
        console.log('Using cloud API inference...');
        const cloudResult = await cloudInference.predict(landmarks);
        return {
          sign: cloudResult.sign,
          confidence: cloudResult.confidence,
          probabilities: cloudResult.probabilities,
          inferenceMode: 'cloud',
          inferenceTimeMs: cloudResult.inference_time_ms,
        };
      } catch (error) {
        console.warn('Cloud inference failed, falling back to browser:', error);
        // Fall through to browser inference
      }
    }

    // Browser-based inference (fallback or default)
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
    let bestLetterIdx = -1;
    let bestLetterProb = -1;

    for (let i = 0; i < probabilities.length; i++) {
      const label = this.labels.idx_to_label[i.toString()];
      // Only consider A-Z letters
      if (ONNXInference.ALPHABET_LETTERS.includes(label) && probabilities[i] > bestLetterProb) {
        bestLetterProb = probabilities[i];
        bestLetterIdx = i;
      }
    }

    const inferenceTime = performance.now() - startTime;

    // If no letter found (shouldn't happen), fall back to original prediction
    if (bestLetterIdx === -1) {
      const predictedIdx = probabilities.indexOf(Math.max(...probabilities));
      const predictedSign = this.labels.idx_to_label[predictedIdx.toString()];
      return {
        sign: predictedSign,
        confidence: probabilities[predictedIdx],
        probabilities: this.createProbabilityMap(probabilities, ONNXInference.ALPHABET_LETTERS),
        inferenceMode: 'browser',
        inferenceTimeMs: inferenceTime,
      };
    }

    const predictedSign = this.labels.idx_to_label[bestLetterIdx.toString()];
    const confidence = probabilities[bestLetterIdx];

    // Create probability map (only for A-Z letters)
    const probabilityMap = this.createProbabilityMap(probabilities, ONNXInference.ALPHABET_LETTERS);

    return {
      sign: predictedSign,
      confidence: confidence,
      probabilities: probabilityMap,
      inferenceMode: 'browser',
      inferenceTimeMs: inferenceTime,
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
