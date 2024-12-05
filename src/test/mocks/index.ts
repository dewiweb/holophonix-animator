import { OSCHandler } from '../../handlers/osc-handler';

export const mockOscHandler = {
    getTrackState: jest.fn(),
    sendBatch: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    updateTrackParameters: jest.fn()
} as jest.Mocked<OSCHandler>;

export const mockErrorHandler = jest.fn();
