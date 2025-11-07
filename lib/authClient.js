// Client-side utility to get Firebase auth token for API requests
import { auth } from './firebase';

/**
 * Get the current user's ID token for authenticated API requests
 * @param {boolean} forceRefresh - Force token refresh (default: false)
 * @returns {Promise<string|null>} - ID token or null if not authenticated
 */
export async function getAuthToken(forceRefresh = false) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('No authenticated user found');
      return null;
    }

    const token = await currentUser.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

/**
 * Get authorization headers for authenticated API requests
 * @param {boolean} forceRefresh - Force token refresh (default: false)
 * @returns {Promise<object>} - Headers object with Authorization header
 */
export async function getAuthHeaders(forceRefresh = false) {
  const token = await getAuthToken(forceRefresh);
  
  if (!token) {
    throw new Error('User not authenticated');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Make an authenticated fetch request
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @param {boolean} forceRefresh - Force token refresh (default: false)
 * @returns {Promise<Response>} - Fetch response
 */
export async function authenticatedFetch(url, options = {}, forceRefresh = false) {
  try {
    const authHeaders = await getAuthHeaders(forceRefresh);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    // If token expired, try refreshing and retry once
    if (response.status === 401 && !forceRefresh) {
      const data = await response.json();
      if (data.code === 'AUTH_TOKEN_EXPIRED') {
        console.log('Token expired, refreshing...');
        return authenticatedFetch(url, options, true);
      }
    }

    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
}

/**
 * Make an authenticated POST request with JSON body
 * @param {string} url - API endpoint URL
 * @param {object} body - Request body
 * @param {object} extraHeaders - Additional headers
 * @returns {Promise<object>} - JSON response
 */
export async function authenticatedPost(url, body = {}, extraHeaders = {}) {
  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Authenticated POST error:', error);
    throw error;
  }
}

/**
 * Make an authenticated GET request
 * @param {string} url - API endpoint URL
 * @param {object} params - Query parameters
 * @returns {Promise<object>} - JSON response
 */
export async function authenticatedGet(url, params = {}) {
  try {
    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await authenticatedFetch(fullUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Authenticated GET error:', error);
    throw error;
  }
}

/**
 * Make an authenticated multipart/form-data request (for file uploads)
 * @param {string} url - API endpoint URL
 * @param {FormData} formData - Form data to upload
 * @returns {Promise<object>} - JSON response
 */
export async function authenticatedUpload(url, formData) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser sets it with boundary
      },
      body: formData,
    });

    // Handle token expiration
    if (response.status === 401) {
      const data = await response.json();
      if (data.code === 'AUTH_TOKEN_EXPIRED') {
        console.log('Token expired, refreshing...');
        const newToken = await getAuthToken(true);
        
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
          body: formData,
        });

        if (!retryResponse.ok) {
          const error = await retryResponse.json();
          throw new Error(error.error || `Upload failed with status ${retryResponse.status}`);
        }

        return await retryResponse.json();
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Upload failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Authenticated upload error:', error);
    throw error;
  }
}
