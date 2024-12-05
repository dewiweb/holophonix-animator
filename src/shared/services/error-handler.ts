import { OSCErrorType } from '../types';

export interface ErrorData {
  type: OSCErrorType;
  message: string;
  retryable?: boolean;
  data?: any;
}

export const handleError = (error: ErrorData) => {
  console.error(`[${error.type}] ${error.message}`, error.data);
  // Add additional error handling logic here
};
