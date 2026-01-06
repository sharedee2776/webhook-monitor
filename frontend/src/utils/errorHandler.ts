/**
 * Standardized error handling utilities
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Parse API error response into user-friendly message
 */
export function parseApiError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    // Firebase errors
    if (error.code?.startsWith('auth/')) {
      return getFirebaseErrorMessage(error.code);
    }
    
    return error.message;
  }

  if (error?.jsonBody?.error) {
    return error.jsonBody.error;
  }

  if (error?.error) {
    return error.error;
  }

  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Get user-friendly Firebase error messages
 */
function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/wrong-password': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'This operation is not allowed.',
  };

  return messages[code] || 'Authentication error. Please try again.';
}

/**
 * Handle API response errors
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      const text = await response.text().catch(() => '');
      if (text) errorMessage = text;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Standard error handler for components
 */
export function handleError(error: any, setError: (message: string) => void) {
  const message = parseApiError(error);
  console.error('Error:', error);
  setError(message);
}
