export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface OscMessage {
  address: string;
  args: Array<number | string | boolean>;
}

export function validateOscAddress(address: string): boolean {
  const pattern = /^\/[a-zA-Z]+\/[0-9]+\/[a-zA-Z]+$/;
  return pattern.test(address);
}

function validatePosition(position: Position3D): void {
  const isValid = (value: number): boolean => value >= -1 && value <= 1;
  
  if (!isValid(position.x) || !isValid(position.y) || !isValid(position.z)) {
    throw new Error('Position values must be between -1 and 1');
  }
}

function validateTrackId(id: number): void {
  if (id < 0) {
    throw new Error('Invalid track ID');
  }
}

export function createOscMessage(address: string, args: Array<number | string | boolean>): OscMessage {
  if (!validateOscAddress(address)) {
    throw new Error('Invalid OSC address format');
  }
  
  return {
    address,
    args,
  };
}

export function createPositionMessage(trackId: number, position: Position3D): OscMessage {
  validateTrackId(trackId);
  validatePosition(position);
  
  return createOscMessage(
    `/track/${trackId}/position`,
    [position.x, position.y, position.z]
  );
}
