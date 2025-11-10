/**
 * Cloud-based inference using AWS GPU API
 * Provides faster inference by offloading to cloud GPU
 */

export interface CloudPrediction {
  sign: string;
  confidence: number;
  probabilities: { [key: string]: number };
  inference_time_ms: number;
  device: string;
}

interface CloudInferenceConfig {
  apiUrl: string;
  timeout: number;
}

class CloudInference {
  private config: CloudInferenceConfig;
  private isAvailable: boolean = false;

  constructor() {
    // API Gateway URL already includes /predict, so use it directly
    // For other APIs, you might need to append paths
    const baseUrl = process.env.NEXT_PUBLIC_INFERENCE_API_URL || '';
    this.config = {
      apiUrl: baseUrl.endsWith('/predict') ? baseUrl.replace('/predict', '') : baseUrl,
      timeout: 5000, // 5 second timeout
    };
  }

  /**
   * Check if cloud inference is configured and available
   * For API Gateway, we skip health check and assume available if URL is configured
   */
  async checkAvailability(): Promise<boolean> {
    if (!this.config.apiUrl) {
      console.log('Cloud inference not configured (no API URL)');
      this.isAvailable = false;
      return false;
    }

    // For API Gateway, we don't have a health endpoint
    // Just check if URL is configured - actual availability will be tested on first request
    if (this.config.apiUrl.includes('execute-api')) {
      // API Gateway URL - assume available if configured
      this.isAvailable = true;
      console.log('Cloud inference configured (API Gateway)');
      return true;
    }

    // For other APIs, try health check
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (response.ok) {
        const data = await response.json();
        this.isAvailable = data.status === 'healthy' && data.model_loaded;
        console.log(`Cloud inference available: ${this.isAvailable}`, data);
        return this.isAvailable;
      }
    } catch (error) {
      console.warn('Cloud inference health check failed:', error);
      // For API Gateway, this is expected - mark as available anyway
      if (this.config.apiUrl.includes('execute-api')) {
        this.isAvailable = true;
        return true;
      }
      this.isAvailable = false;
    }

    return false;
  }

  /**
   * Predict ASL sign from landmarks using cloud API
   */
  async predict(landmarks: number[][]): Promise<CloudPrediction> {
    if (!this.isAvailable) {
      throw new Error('Cloud inference not available');
    }

    if (landmarks.length !== 21) {
      throw new Error(`Expected 21 landmarks, got ${landmarks.length}`);
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landmarks }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`API error: ${error.detail || response.statusText}`);
      }

      const prediction: CloudPrediction = await response.json();
      return prediction;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Cloud inference timeout');
      }
      throw error;
    }
  }

  /**
   * Get server statistics
   */
  async getStats(): Promise<any> {
    if (!this.config.apiUrl) {
      throw new Error('Cloud inference not configured');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get cloud stats:', error);
    }

    return null;
  }

  /**
   * Check if cloud inference is currently available
   */
  isReady(): boolean {
    return this.isAvailable;
  }

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }
}

// Singleton instance
const cloudInference = new CloudInference();

export default cloudInference;
