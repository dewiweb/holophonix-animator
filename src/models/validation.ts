import { 
  AnimationModel, 
  ModelValidationResult, 
  ParameterDefinition,
  ValidationRule 
} from './types'

/**
 * Validate an animation model
 */
export function validateModel(model: AnimationModel): ModelValidationResult {
  const errors: ModelValidationResult['errors'] = []
  const warnings: string[] = []
  const info: string[] = []
  
  // Validate metadata
  if (!model.metadata) {
    errors.push({
      field: 'metadata',
      message: 'Model metadata is required',
      severity: 'error'
    })
    return { valid: false, errors }
  }
  
  if (!model.metadata.type) {
    errors.push({
      field: 'metadata.type',
      message: 'Model type is required',
      severity: 'error'
    })
  } else if (!/^[a-z][a-z0-9-]*$/.test(model.metadata.type)) {
    errors.push({
      field: 'metadata.type',
      message: 'Model type must be lowercase with hyphens only',
      severity: 'error'
    })
  }
  
  if (!model.metadata.name) {
    errors.push({
      field: 'metadata.name',
      message: 'Model name is required',
      severity: 'error'
    })
  }
  
  if (!model.metadata.version) {
    errors.push({
      field: 'metadata.version',
      message: 'Model version is required',
      severity: 'error'
    })
  } else if (!/^\d+\.\d+\.\d+(-[a-z0-9]+)?$/.test(model.metadata.version)) {
    warnings.push('Model version should follow semantic versioning (e.g., 1.0.0)')
  }
  
  if (!model.metadata.category) {
    errors.push({
      field: 'metadata.category',
      message: 'Model category is required',
      severity: 'error'
    })
  }
  
  // Validate parameters
  if (!model.parameters || typeof model.parameters !== 'object') {
    errors.push({
      field: 'parameters',
      message: 'Model parameters must be an object',
      severity: 'error'
    })
  } else {
    // Validate each parameter definition
    for (const [key, param] of Object.entries(model.parameters)) {
      const paramErrors = validateParameterDefinition(key, param)
      errors.push(...paramErrors)
    }
  }
  
  // Validate calculation function
  if (!model.calculate) {
    errors.push({
      field: 'calculate',
      message: 'Model calculate function is required',
      severity: 'error'
    })
  } else if (typeof model.calculate !== 'function' && typeof model.calculate !== 'string') {
    errors.push({
      field: 'calculate',
      message: 'Model calculate must be a function or string',
      severity: 'error'
    })
  }
  
  // Validate default parameters function
  if (!model.getDefaultParameters) {
    errors.push({
      field: 'getDefaultParameters',
      message: 'Model getDefaultParameters function is required',
      severity: 'error'
    })
  } else if (typeof model.getDefaultParameters !== 'function' && typeof model.getDefaultParameters !== 'string') {
    errors.push({
      field: 'getDefaultParameters',
      message: 'Model getDefaultParameters must be a function or string',
      severity: 'error'
    })
  }
  
  // Validate multi-track support
  if (model.supportedModes) {
    const validModes = ['identical', 'phase-offset', 'position-relative', 'phase-offset-relative', 'isobarycenter', 'centered']
    for (const mode of model.supportedModes) {
      if (!validModes.includes(mode)) {
        errors.push({
          field: 'supportedModes',
          message: `Invalid multi-track mode: ${mode}`,
          severity: 'error'
        })
      }
    }
    
    if (model.defaultMultiTrackMode && !model.supportedModes.includes(model.defaultMultiTrackMode as any)) {
      warnings.push(`Default multi-track mode '${model.defaultMultiTrackMode}' is not in supported modes`)
    }
  }
  
  // Validate performance hints
  if (model.performance) {
    if (model.performance.complexity && 
        !['constant', 'linear', 'quadratic', 'exponential'].includes(model.performance.complexity)) {
      warnings.push('Invalid performance complexity hint')
    }
    
    if (model.performance.maxTracks && model.performance.maxTracks < 1) {
      warnings.push('Max tracks should be at least 1')
    }
  }
  
  // Check for potential performance issues
  if (model.performance?.complexity === 'exponential' && !model.performance.maxTracks) {
    warnings.push('Exponential complexity without maxTracks limit may cause performance issues')
  }
  
  // Validate hooks
  if (model.initialize && typeof model.initialize !== 'function') {
    errors.push({
      field: 'initialize',
      message: 'Initialize hook must be a function',
      severity: 'error'
    })
  }
  
  if (model.cleanup && typeof model.cleanup !== 'function') {
    errors.push({
      field: 'cleanup',
      message: 'Cleanup hook must be a function',
      severity: 'error'
    })
  }
  
  // Info messages
  if (!model.metadata.description) {
    info.push('Consider adding a description for better discoverability')
  }
  
  if (!model.metadata.tags || model.metadata.tags.length === 0) {
    info.push('Consider adding tags for better search results')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    info: info.length > 0 ? info : undefined
  }
}

/**
 * Validate a parameter definition
 */
function validateParameterDefinition(key: string, param: ParameterDefinition): ModelValidationResult['errors'] {
  const errors: ModelValidationResult['errors'] = []
  const fieldPrefix = `parameters.${key}`
  
  if (!param.type) {
    errors.push({
      field: `${fieldPrefix}.type`,
      message: 'Parameter type is required',
      severity: 'error'
    })
  } else if (!['number', 'position', 'boolean', 'string', 'enum', 'array'].includes(param.type)) {
    errors.push({
      field: `${fieldPrefix}.type`,
      message: `Invalid parameter type: ${param.type}`,
      severity: 'error'
    })
  }
  
  // Check for default value
  if (param.default === undefined && !param.required) {
    errors.push({
      field: `${fieldPrefix}.default`,
      message: 'Parameter must have a default value or be marked as required',
      severity: 'error'
    })
  }
  
  // Type-specific validation
  if (param.type === 'number') {
    if (param.min !== undefined && param.max !== undefined && param.min > param.max) {
      errors.push({
        field: `${fieldPrefix}.min/max`,
        message: 'Minimum value cannot be greater than maximum value',
        severity: 'error'
      })
    }
    
    if (param.step !== undefined && param.step <= 0) {
      errors.push({
        field: `${fieldPrefix}.step`,
        message: 'Step value must be positive',
        severity: 'error'
      })
    }
    
    if (param.default !== undefined && typeof param.default !== 'number') {
      errors.push({
        field: `${fieldPrefix}.default`,
        message: 'Default value must be a number',
        severity: 'error'
      })
    }
  }
  
  if (param.type === 'enum') {
    if (!param.options || param.options.length === 0) {
      errors.push({
        field: `${fieldPrefix}.options`,
        message: 'Enum parameter must have options',
        severity: 'error'
      })
    }
    
    if (param.default !== undefined && param.options && !param.options.includes(param.default)) {
      errors.push({
        field: `${fieldPrefix}.default`,
        message: 'Default value must be one of the options',
        severity: 'error'
      })
    }
  }
  
  if (param.type === 'position') {
    if (param.default !== undefined) {
      if (typeof param.default !== 'object' || 
          typeof param.default.x !== 'number' || 
          typeof param.default.y !== 'number' || 
          typeof param.default.z !== 'number') {
        errors.push({
          field: `${fieldPrefix}.default`,
          message: 'Default position must have x, y, z number properties',
          severity: 'error'
        })
      }
    }
  }
  
  if (param.type === 'array') {
    if (!param.arrayType) {
      errors.push({
        field: `${fieldPrefix}.arrayType`,
        message: 'Array parameter must specify arrayType',
        severity: 'error'
      })
    }
    
    if (param.arrayMin !== undefined && param.arrayMax !== undefined && param.arrayMin > param.arrayMax) {
      errors.push({
        field: `${fieldPrefix}.arrayMin/arrayMax`,
        message: 'Minimum array length cannot be greater than maximum',
        severity: 'error'
      })
    }
  }
  
  // Validate validation rules
  if (param.validation) {
    for (const rule of param.validation) {
      const ruleErrors = validateValidationRule(rule, `${fieldPrefix}.validation`)
      errors.push(...ruleErrors)
    }
  }
  
  // Validate dependencies
  if (param.dependsOn) {
    for (const dep of param.dependsOn) {
      if (!dep.parameter) {
        errors.push({
          field: `${fieldPrefix}.dependsOn`,
          message: 'Dependency must specify parameter',
          severity: 'error'
        })
      }
      
      if (!dep.condition || !['equals', 'notEquals', 'greaterThan', 'lessThan'].includes(dep.condition)) {
        errors.push({
          field: `${fieldPrefix}.dependsOn`,
          message: 'Invalid dependency condition',
          severity: 'error'
        })
      }
    }
  }
  
  return errors
}

/**
 * Validate a validation rule
 */
function validateValidationRule(rule: ValidationRule, fieldPrefix: string): ModelValidationResult['errors'] {
  const errors: ModelValidationResult['errors'] = []
  
  if (!rule.type || !['min', 'max', 'range', 'pattern', 'custom'].includes(rule.type)) {
    errors.push({
      field: `${fieldPrefix}.type`,
      message: 'Invalid validation rule type',
      severity: 'error'
    })
  }
  
  if (rule.type === 'custom' && !rule.validator) {
    errors.push({
      field: `${fieldPrefix}.validator`,
      message: 'Custom validation rule must have validator function',
      severity: 'error'
    })
  }
  
  if (rule.type !== 'custom' && rule.value === undefined) {
    errors.push({
      field: `${fieldPrefix}.value`,
      message: 'Validation rule must have value',
      severity: 'error'
    })
  }
  
  return errors
}

/**
 * Validate parameters against a model's parameter definitions
 */
export function validateParameters(
  model: AnimationModel, 
  parameters: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check required parameters
  for (const [key, definition] of Object.entries(model.parameters)) {
    if (definition.required && parameters[key] === undefined) {
      errors.push(`Required parameter '${key}' is missing`)
    }
  }
  
  // Validate each provided parameter
  for (const [key, value] of Object.entries(parameters)) {
    const definition = model.parameters[key]
    
    if (!definition) {
      // Unknown parameter - might be internal, skip
      continue
    }
    
    // Type validation
    const typeError = validateParameterType(value, definition)
    if (typeError) {
      errors.push(`Parameter '${key}': ${typeError}`)
    }
    
    // Custom validation rules
    if (definition.validation) {
      for (const rule of definition.validation) {
        if (!validateParameterRule(value, rule)) {
          errors.push(`Parameter '${key}': ${rule.message || 'Validation failed'}`)
        }
      }
    }
  }
  
  // Check dependencies
  for (const [key, definition] of Object.entries(model.parameters)) {
    if (definition.dependsOn) {
      for (const dep of definition.dependsOn) {
        if (!checkDependency(parameters[dep.parameter], dep.condition, dep.value)) {
          if (parameters[key] !== undefined) {
            errors.push(`Parameter '${key}' should not be set when '${dep.parameter}' ${dep.condition} ${dep.value}`)
          }
        }
      }
    }
  }
  
  // Call model's custom validation if provided
  if (model.validateParameters) {
    const modelValidation = model.validateParameters(parameters)
    if (!modelValidation.valid && modelValidation.errors) {
      errors.push(...modelValidation.errors)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate parameter type
 */
function validateParameterType(value: any, definition: ParameterDefinition): string | null {
  switch (definition.type) {
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a number'
      }
      if (definition.min !== undefined && value < definition.min) {
        return `Must be at least ${definition.min}`
      }
      if (definition.max !== undefined && value > definition.max) {
        return `Must be at most ${definition.max}`
      }
      break
      
    case 'string':
      if (typeof value !== 'string') {
        return 'Must be a string'
      }
      break
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        return 'Must be a boolean'
      }
      break
      
    case 'position':
      if (typeof value !== 'object' || 
          typeof value.x !== 'number' || 
          typeof value.y !== 'number' || 
          typeof value.z !== 'number') {
        return 'Must be a position object with x, y, z'
      }
      break
      
    case 'rotation':
      if (typeof value !== 'object' || 
          typeof value.x !== 'number' || 
          typeof value.y !== 'number' || 
          typeof value.z !== 'number') {
        return 'Must be a rotation object with x, y, z angles'
      }
      break
      
    case 'enum':
      if (definition.options && !definition.options.includes(value)) {
        return `Must be one of: ${definition.options.join(', ')}`
      }
      break
      
    case 'array':
      if (!Array.isArray(value)) {
        return 'Must be an array'
      }
      if (definition.arrayMin !== undefined && value.length < definition.arrayMin) {
        return `Array must have at least ${definition.arrayMin} items`
      }
      if (definition.arrayMax !== undefined && value.length > definition.arrayMax) {
        return `Array must have at most ${definition.arrayMax} items`
      }
      break
  }
  
  return null
}

/**
 * Validate parameter against a rule
 */
function validateParameterRule(value: any, rule: ValidationRule): boolean {
  switch (rule.type) {
    case 'min':
      return value >= rule.value
      
    case 'max':
      return value <= rule.value
      
    case 'range':
      return value >= rule.value[0] && value <= rule.value[1]
      
    case 'pattern':
      return new RegExp(rule.value).test(value)
      
    case 'custom':
      return rule.validator ? rule.validator(value) : true
      
    default:
      return true
  }
}

/**
 * Check parameter dependency
 */
function checkDependency(value: any, condition: string, target: any): boolean {
  switch (condition) {
    case 'equals':
      return value === target
      
    case 'notEquals':
      return value !== target
      
    case 'greaterThan':
      return value > target
      
    case 'lessThan':
      return value < target
      
    default:
      return true
  }
}
