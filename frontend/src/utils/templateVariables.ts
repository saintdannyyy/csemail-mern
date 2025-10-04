// Template variable utilities for detecting and managing variables in email templates

export interface TemplateVariable {
  name: string;
  type: 'text' | 'email' | 'url' | 'number' | 'date';
  required: boolean;
  defaultValue?: string;
  description?: string;
}

/**
 * Extract all template variables from HTML content
 * Looks for patterns like {{variable_name}} or {{variable.subfield}}
 */
export function extractVariablesFromContent(content: string): TemplateVariable[] {
  if (!content) return [];

  // Regex to match {{variable_name}} patterns
  const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables).map(name => {
    // Infer type based on variable name
    const type = inferVariableType(name);
    
    return {
      name,
      type,
      required: isRequiredVariable(name),
      defaultValue: getDefaultValueForVariable(name),
      description: generateVariableDescription(name)
    };
  });
}

/**
 * Infer variable type based on name patterns
 */
function inferVariableType(name: string): TemplateVariable['type'] {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('email') || lowerName.endsWith('_email')) {
    return 'email';
  }
  if (lowerName.includes('url') || lowerName.includes('link') || lowerName.includes('website')) {
    return 'url';
  }
  if (lowerName.includes('date') || lowerName.includes('time')) {
    return 'date';
  }
  if (lowerName.includes('count') || lowerName.includes('number') || lowerName.includes('amount')) {
    return 'number';
  }
  
  return 'text';
}

/**
 * Determine if a variable should be required based on common patterns
 */
function isRequiredVariable(name: string): boolean {
  const requiredPatterns = [
    'first_name', 'last_name', 'email', 'name', 
    'company', 'company_name', 'title'
  ];
  
  return requiredPatterns.some(pattern => 
    name.toLowerCase().includes(pattern)
  );
}

/**
 * Generate default values for common variable patterns
 */
function getDefaultValueForVariable(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('first_name')) return 'John';
  if (lowerName.includes('last_name')) return 'Doe';
  if (lowerName.includes('email')) return 'user@example.com';
  if (lowerName.includes('company_name') || lowerName === 'company') return 'Your Company';
  if (lowerName.includes('website') || lowerName.includes('url')) return 'https://example.com';
  if (lowerName.includes('phone')) return '+1 (555) 123-4567';
  if (lowerName.includes('date')) return new Date().toLocaleDateString();
  
  return '';
}

/**
 * Generate human-readable descriptions for variables
 */
function generateVariableDescription(name: string): string {
  const words = name.split(/[_\s]+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  
  return `The ${words.join(' ')} field`;
}

/**
 * Replace variables in content with provided values
 */
export function replaceVariablesInContent(
  content: string, 
  variables: Record<string, string>
): string {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || `{{${key}}}`);
  });
  
  return result;
}

/**
 * Validate that all required variables have values
 */
export function validateVariableValues(
  templateVariables: TemplateVariable[],
  providedValues: Record<string, string>
): { isValid: boolean; missingRequired: string[] } {
  const requiredVariables = templateVariables.filter(v => v.required);
  const missingRequired = requiredVariables
    .filter(v => !providedValues[v.name] || providedValues[v.name].trim() === '')
    .map(v => v.name);
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired
  };
}

/**
 * Get sample data for previewing templates
 */
export function getSampleVariableData(): Record<string, string> {
  return {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    company_name: 'Acme Corporation',
    company: 'Acme Corporation',
    phone: '+1 (555) 123-4567',
    website: 'https://acmecorp.com',
    title: 'Marketing Manager',
    department: 'Marketing',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    date: new Date().toLocaleDateString(),
    year: new Date().getFullYear().toString(),
    month: new Date().toLocaleDateString('en-US', { month: 'long' }),
    product_name: 'Pro Plan',
    discount_amount: '20%',
    support_email: 'support@example.com',
    unsubscribe_url: 'https://example.com/unsubscribe'
  };
}

/**
 * Merge template variables with defaults
 */
export function mergeTemplateVariables(
  detected: TemplateVariable[],
  existing: TemplateVariable[]
): TemplateVariable[] {
  const existingMap = new Map(existing.map(v => [v.name, v]));
  
  return detected.map(detectedVar => {
    const existing = existingMap.get(detectedVar.name);
    if (existing) {
      // Keep existing configuration but update type if detection is more specific
      return {
        ...existing,
        type: existing.type === 'text' && detectedVar.type !== 'text' 
          ? detectedVar.type 
          : existing.type
      };
    }
    return detectedVar;
  });
}