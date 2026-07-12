const schemas = require('./schemas');

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.errors = errors;
  }
}

function validate(schemaName, data) {
  // Pre-process alternate field names for backward compatibility with different forms
  let processedData = { ...data };
  
  if (schemaName === 'registration') {
    processedData.email = processedData.email || processedData.username;
    processedData.fullName = processedData.fullName || processedData.name;
    processedData.companyName = processedData.companyName || processedData.company;
    processedData.confirmPassword = processedData.confirmPassword || processedData.password;
  }
  
  if (schemaName === 'login') {
    processedData.email = processedData.email || processedData.username;
  }

  const schema = schemas[schemaName];
  if (!schema) return processedData;
  
  const errors = [];
  const validated = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    let val = processedData[key];
    
    // Required check
    if (rules.required && (val === undefined || val === null || val === '')) {
      errors.push(`Field '${key}' is required.`);
      continue;
    }
    
    if (val !== undefined && val !== null && val !== '') {
      // Type checks
      if (rules.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push(`Field '${key}' must be a number.`);
          continue;
        }
        val = num;
        if (rules.min !== undefined && val < rules.min) {
          errors.push(`Field '${key}' must be at least ${rules.min}.`);
        }
      } else if (rules.type === 'string') {
        val = String(val).trim();
        if (rules.minLength && val.length < rules.minLength) {
          errors.push(`Field '${key}' must be at least ${rules.minLength} characters.`);
        }
        if (rules.pattern && !rules.pattern.test(val)) {
          errors.push(`Field '${key}' is invalid.`);
        }
      }
    }
    
    validated[key] = val;
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  return { ...processedData, ...validated };
}

module.exports = {
  validate,
  ValidationError
};
