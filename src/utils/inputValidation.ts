/**
 * Input validation utilities for security and data integrity
 */

export const sanitizeText = (input: string): string => {
  // Remove potential XSS vectors while preserving legitimate content
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateInput = (input: string, type: 'text' | 'email' | 'number' = 'text'): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(input);
  
  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitized)) {
        return {
          isValid: false,
          sanitized,
          error: 'Please enter a valid email address'
        };
      }
      break;
    case 'number':
      if (isNaN(Number(sanitized))) {
        return {
          isValid: false,
          sanitized,
          error: 'Please enter a valid number'
        };
      }
      break;
    case 'text':
    default:
      if (sanitized.length === 0) {
        return {
          isValid: false,
          sanitized,
          error: 'This field is required'
        };
      }
      break;
  }
  
  return {
    isValid: true,
    sanitized
  };
};

export const validateQuestionnaireResponse = (response: string, questionType: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} => {
  if (!response) {
    return { isValid: true, sanitized: '' };
  }

  // Basic length validation
  if (response.length > 10000) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Response exceeds maximum length of 10,000 characters'
    };
  }

  // Sanitize the input
  const sanitized = sanitizeText(response);

  // Question type specific validation
  switch (questionType) {
    case 'number':
      const number = parseFloat(sanitized);
      if (isNaN(number)) {
        return {
          isValid: false,
          sanitized: '',
          error: 'Please enter a valid number'
        };
      }
      return { isValid: true, sanitized: number.toString() };

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitized)) {
        return {
          isValid: false,
          sanitized: '',
          error: 'Please enter a valid email address'
        };
      }
      return { isValid: true, sanitized };

    case 'yes_no':
      if (!['yes', 'no', 'true', 'false'].includes(sanitized.toLowerCase())) {
        return {
          isValid: false,
          sanitized: '',
          error: 'Please select Yes or No'
        };
      }
      return { isValid: true, sanitized };

    default:
      return { isValid: true, sanitized };
  }
};

export const validateFileName = (filename: string): {
  isValid: boolean;
  error?: string;
} => {
  // Check for path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      isValid: false,
      error: 'Invalid filename: path traversal characters not allowed'
    };
  }

  // Check for suspicious extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'];
  const extension = filename.toLowerCase().split('.').pop();
  if (extension && suspiciousExtensions.includes(`.${extension}`)) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons'
    };
  }

  // Check filename length
  if (filename.length > 255) {
    return {
      isValid: false,
      error: 'Filename too long (maximum 255 characters)'
    };
  }

  return { isValid: true };
};

export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  // In a real implementation, you'd store and validate against server-side tokens
  // For now, we'll do basic validation
  return token === sessionToken && token.length > 10;
};