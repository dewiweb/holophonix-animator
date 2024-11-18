import { ParameterValidator } from '../validation';
import { ParameterDefinitions } from '../../types/parameters';

describe('Parameter Validation', () => {
  const TEST_PARAMETERS: ParameterDefinitions = {
    speed: {
      default: 1,
      min: 0,
      max: 10,
      step: 0.1,
      unit: 'meters/second',
      description: 'Movement speed'
    },
    frequency: {
      default: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      unit: 'Hz',
      description: 'Oscillation frequency'
    },
    axis: {
      default: 0,
      min: 0,
      max: 2,
      step: 1,
      unit: 'enum',
      description: 'Movement axis'
    },
    azimuth: {
      default: 0,
      min: -180,
      max: 180,
      step: 1,
      unit: 'degrees',
      description: 'Horizontal angle'
    }
  };

  let validator: ParameterValidator;

  beforeEach(() => {
    validator = new ParameterValidator(TEST_PARAMETERS);
  });

  describe('Range Validation', () => {
    it('should validate parameters within range', () => {
      const params = {
        speed: 5,
        frequency: 1,
        axis: 1,
        azimuth: 90
      };
      
      const errors = validator.validateParameters(params);
      expect(errors).toHaveLength(0);
    });

    it('should detect out of range values', () => {
      const params = {
        speed: 20,
        frequency: -1,
        axis: 3,
        azimuth: 200
      };
      
      const errors = validator.validateParameters(params);
      expect(errors).toHaveLength(4);
      expect(errors[0].code).toBe('OUT_OF_RANGE');
    });
  });

  describe('Step Validation', () => {
    it('should validate parameters with correct step', () => {
      const params = {
        speed: 1.2,
        frequency: 0.5,
        axis: 1,
        azimuth: 45
      };
      
      const errors = validator.validateParameters(params);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid step values', () => {
      const params = {
        speed: 1.23,
        frequency: 0.55,
        axis: 1.5,
        azimuth: 45.5
      };
      
      const errors = validator.validateParameters(params);
      expect(errors.some(e => e.code === 'INVALID_STEP')).toBe(true);
    });
  });

  describe('Type Validation', () => {
    it('should validate numeric parameters', () => {
      const params = {
        speed: 1,
        frequency: 1.0,
        axis: 1,
        azimuth: 0
      };
      
      const errors = validator.validateParameters(params);
      expect(errors).toHaveLength(0);
    });

    it('should detect non-numeric values', () => {
      const params = {
        speed: '1' as any,
        frequency: {} as any,
        axis: [] as any,
        azimuth: null as any
      };
      
      const errors = validator.validateParameters(params);
      expect(errors.some(e => e.code === 'INVALID_TYPE')).toBe(true);
    });
  });

  describe('Missing Parameters', () => {
    it('should detect missing required parameters', () => {
      const params = {
        speed: 1,
        frequency: 1
      };
      
      const errors = validator.validateParameters(params);
      expect(errors).toHaveLength(2); // Missing axis and azimuth
    });
  });

  describe('Unit-Specific Validation', () => {
    it('should validate enum parameters', () => {
      const params = {
        axis: 0
      };
      
      const errors = validator.validateParameters(params);
      expect(errors.length).toBe(3); // Only missing other parameters
      expect(errors.some(e => e.parameter === 'axis')).toBe(false);
    });

    it('should validate degree parameters', () => {
      const params = {
        azimuth: 180
      };
      
      const errors = validator.validateParameters(params);
      expect(errors.length).toBe(3); // Only missing other parameters
      expect(errors.some(e => e.parameter === 'azimuth')).toBe(false);
    });
  });
});
