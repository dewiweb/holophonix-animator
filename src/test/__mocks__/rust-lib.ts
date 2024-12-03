export class StateManager {
  save = jest.fn();
  load = jest.fn();
  getState = jest.fn();
  setState = jest.fn();
  subscribe = jest.fn();
  unsubscribe = jest.fn();
}

export class AnimationEngine {
  start = jest.fn();
  stop = jest.fn();
  reset = jest.fn();
  setTime = jest.fn();
  getTime = jest.fn();
  addKeyframe = jest.fn();
  removeKeyframe = jest.fn();
  subscribe = jest.fn();
  unsubscribe = jest.fn();
}

export class OscManager {
  connect = jest.fn();
  disconnect = jest.fn();
  send = jest.fn();
  subscribe = jest.fn();
  unsubscribe = jest.fn();
  isConnected = jest.fn();
  emit = jest.fn();
  once = jest.fn();
  removeAllListeners = jest.fn();
}
