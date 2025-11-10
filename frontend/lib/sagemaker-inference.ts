/**
 * AWS SageMaker Serverless Inference Client
 * Handles communication with SageMaker endpoint
 */

export interface SageMakerPrediction {
  sign: string;
  confidence: number;
  probabilities: { [key: string]: number };
}

interface SageMakerConfig {
  endpointName: string;
  region: string;
  timeout: number;
}

class SageMakerInference {
  private config: SageMakerConfig;
  private isAvailable: boolean = false;
  private endpointUrl: string = '';

  constructor() {
    this.config = {
      endpointName: process.env.NEXT_PUBLIC_SAGEMAKER_ENDPOINT || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      timeout: 30000, // 30 second timeout (includes cold start)
    };

    if (this.config.endpointName) {
      this.endpointUrl = `https://runtime.sagemaker.${this.config.region}.amazonaws.com/endpoints/${this.config.endpointName}/invocations`;
    }
  }

  /**
   * Check if SageMaker inference is configured
   */
  isConfigured(): boolean {
    return !!this.config.endpointName;
  }

  /**
   * Predict ASL sign from landmarks using SageMaker
   */
  async predict(landmarks: number[][]): Promise<SageMakerPrediction> {
    if (!this.isConfigured()) {
      throw new Error('SageMaker endpoint not configured');
    }

    if (landmarks.length !== 21) {
      throw new Error(`Expected 21 landmarks, got ${landmarks.length}`);
    }

    try {
      const startTime = performance.now();

      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landmarks }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error');
        throw new Error(`SageMaker error: ${response.status} - ${error}`);
      }

      const prediction: SageMakerPrediction = await response.json();
      const inferenceTime = performance.now() - startTime;

      console.log(`SageMaker inference completed in ${inferenceTime.toFixed(0)}ms`);

      return prediction;

    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('SageMaker inference timeout (cold start may take 10-20 seconds on first request)');
      }
      throw error;
    }
  }

  /**
   * Get endpoint information
   */
  getEndpointInfo() {
    return {
      endpointName: this.config.endpointName,
      region: this.config.region,
      url: this.endpointUrl,
      configured: this.isConfigured(),
    };
  }
}

// Singleton instance
const sageMakerInference = new SageMakerInference();

export default sageMakerInference;
