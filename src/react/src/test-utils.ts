// Mock Canvas API
export class MockContext2D {
  // Canvas state properties
  fillStyle: string = '#000';
  strokeStyle: string = '#000';
  lineWidth: number = 1;
  font: string = '10px sans-serif';
  textAlign: CanvasTextAlign = 'start';
  textBaseline: CanvasTextBaseline = 'alphabetic';
  globalAlpha: number = 1;
  globalCompositeOperation: string = 'source-over';

  // Drawing state
  private path: Array<{ x: number; y: number }> = [];
  private currentPosition = { x: 0, y: 0 };

  // Canvas dimensions
  canvas = {
    width: 200,
    height: 200
  };

  // Path methods
  beginPath() { this.path = []; }
  moveTo(x: number, y: number) { 
    this.currentPosition = { x, y };
    this.path.push(this.currentPosition);
  }
  lineTo(x: number, y: number) {
    this.currentPosition = { x, y };
    this.path.push(this.currentPosition);
  }
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    this.currentPosition = { x, y };
    this.path.push(this.currentPosition);
  }
  closePath() {
    if (this.path.length > 0) {
      this.path.push(this.path[0]);
    }
  }

  // Drawing methods
  stroke() {}
  fill() {}
  fillText() {}
  strokeText() {}
  clearRect() {}
  fillRect() {}
  strokeRect() {}

  // State methods
  save() {}
  restore() {}
  translate() {}
  scale() {}
  rotate() {}
  setTransform() {}
  resetTransform() {}

  // Text measurement
  measureText() { return { width: 50 }; }

  constructor() {
    // Bind all methods to this instance
    this.beginPath = this.beginPath.bind(this);
    this.moveTo = this.moveTo.bind(this);
    this.lineTo = this.lineTo.bind(this);
    this.arc = this.arc.bind(this);
    this.closePath = this.closePath.bind(this);
    this.stroke = this.stroke.bind(this);
    this.fill = this.fill.bind(this);
    this.fillText = this.fillText.bind(this);
    this.strokeText = this.strokeText.bind(this);
    this.clearRect = this.clearRect.bind(this);
    this.fillRect = this.fillRect.bind(this);
    this.strokeRect = this.strokeRect.bind(this);
    this.save = this.save.bind(this);
    this.restore = this.restore.bind(this);
    this.translate = this.translate.bind(this);
    this.scale = this.scale.bind(this);
    this.rotate = this.rotate.bind(this);
    this.setTransform = this.setTransform.bind(this);
    this.resetTransform = this.resetTransform.bind(this);
    this.measureText = this.measureText.bind(this);
  }
}

// Mock offsetWidth/offsetHeight since jsdom doesn't support them
export const mockElementDimensions = () => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 1000
  });

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 100
  });
};

// Mock getBoundingClientRect
export const mockGetBoundingClientRect = (element: HTMLElement, rect: Partial<DOMRect> = {}) => {
  const defaultRect = {
    width: 1000,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 1000,
    x: 0,
    y: 0,
    toJSON: () => {}
  };

  element.getBoundingClientRect = jest.fn().mockReturnValue({
    ...defaultRect,
    ...rect
  });
};
