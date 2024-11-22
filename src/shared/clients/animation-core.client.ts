import { TrackParameters } from '../types/osc.types';

interface ValidationResult {
  valid: boolean;
  error?: string;
  value?: any;
}

interface CoordinateValidationRequest {
  trackId: number;
  parameter: keyof TrackParameters;
  value: any;
}

/**
 * Client for communicating with the Animation Core service
 * Uses WebSocket/gRPC for efficient communication
 */
export class AnimationCoreClient {
  private ws: WebSocket;
  private requestId = 0;
  private pendingRequests = new Map<number, { 
    resolve: (value: ValidationResult) => void;
    reject: (error: any) => void;
  }>();

  constructor(private serviceUrl: string = 'ws://localhost:8080') {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.serviceUrl);
    
    this.ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      const { id, result, error } = response;
      
      const pending = this.pendingRequests.get(id);
      if (pending) {
        if (error) {
          pending.reject(error);
        } else {
          pending.resolve(result);
        }
        this.pendingRequests.delete(id);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Animation Core WebSocket error:', error);
      // Reject all pending requests
      for (const [id, { reject }] of this.pendingRequests) {
        reject(error);
        this.pendingRequests.delete(id);
      }
    };

    this.ws.onclose = () => {
      console.log('Animation Core connection closed, reconnecting...');
      setTimeout(() => this.connect(), 1000);
    };
  }

  /**
   * Validate coordinates through the Animation Core service
   * Returns potentially adjusted values after validation
   */
  public async validateCoordinates(request: CoordinateValidationRequest): Promise<ValidationResult> {
    const id = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      this.ws.send(JSON.stringify({
        id,
        method: 'validateCoordinates',
        params: request
      }));
    });
  }

  /**
   * Clean up resources
   */
  public dispose() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
