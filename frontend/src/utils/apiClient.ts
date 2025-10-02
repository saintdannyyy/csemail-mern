// API client for Emmisor backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Get token from localStorage if it exists
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Check if user is authenticated with valid token
  isAuthenticated(): boolean {
    if (!this.token) return false;

    try {
      // Basic JWT token validation (check if it's properly formatted and not expired)
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        console.warn('Token has expired');
        this.clearToken();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid token format:', error);
      this.clearToken();
      return false;
    }
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('API Request:', { url, method: options.method, hasBody: !!options.body, bodyType: options.body?.constructor.name });
    
    // Use a plain object for headers to allow custom keys
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Only add Content-Type if it's not FormData (FormData sets its own Content-Type)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add auth token if available
    if (this.token) {
      headers["authorization"] = `Bearer ${this.token}`;
    }

    console.log('Request headers:', headers);
    
    // Log FormData contents if it's FormData
    if (options.body instanceof FormData) {
      console.log('FormData entries being sent:');
      for (let [key, value] of options.body.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            size: value.size,
            type: value.type,
            lastModified: value.lastModified
          });
        } else {
          console.log(`${key}:`, value);
        }
      }
    } else {
      console.log('Request body type:', options.body?.constructor.name);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Handle authentication errors - redirect to login
        if (response.status === 401) {
          console.warn('Authentication failed - token expired or invalid');
          this.clearToken();
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          throw new Error('Authentication expired. Please log in again.');
        }
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Success response:', result);
      return result;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/api/health');
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const response = await this.post<{ user: any; token: string }>('/api/auth/login', {
      email,
      password,
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async getCurrentUser(): Promise<any> {
    return this.get('/api/auth/me');
  }

  // Contact methods
  async getContacts(page: number = 1, limit: number = 20): Promise<any> {
    return this.get(`/api/contacts?page=${page}&limit=${limit}`);
  }

  async createContact(contact: any): Promise<any> {
    return this.post('/api/contacts', contact);
  }

  async updateContact(contactId: string, contact: any): Promise<any> {
    return this.put(`/api/contacts/${contactId}`, contact);
  }
  async deleteContact(contactId: string): Promise<any> {
    return this.delete(`/api/contacts/${contactId}`);
  }

  // Import contacts method - make sure this exists and is correctly named
  async importContacts(formData: FormData): Promise<any> {
    return this.post('/api/contacts/import', formData);
  }

  // Export contacts method
  async exportContacts(options: {
    format: string;
    includeFields: string[];
    filterType: string;
  }): Promise<Blob> {
    const params = new URLSearchParams({
      format: options.format,
      fields: options.includeFields.join(','),
      filterType: options.filterType,
    });

    const response = await fetch(`${this.baseURL}/api/contacts/export?${params}`, {
      method: 'GET',
      headers: {
        ...(this.token && { authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  }

  // Contact List methods
  async getContactLists(): Promise<any> {
    return this.get('/api/contacts/lists');
  }

  async createContactList(list: any): Promise<any> {
    return this.post('/api/contacts/lists', list);
  }

  async updateContactList(listId: string, list: any): Promise<any> {
    return this.put(`/api/contacts/lists/${listId}`, list);
  }

  async deleteContactList(listId: string): Promise<any> {
    return this.delete(`/api/contacts/lists/${listId}`);
  }

  // Campaign methods
  async getCampaigns(page: number = 1, limit: number = 20): Promise<any> {
    return this.get(`/api/campaigns?page=${page}&limit=${limit}`);
  }

  async createCampaign(campaign: any): Promise<any> {
    return this.post('/api/campaigns', campaign);
  }

  async sendCampaign(campaignId: string, options?: any): Promise<any> {
    return this.post(`/api/campaigns/${campaignId}/send`, options || {});
  }

  async previewCampaign(campaignId: string, variables?: any, sampleContact?: any): Promise<any> {
    return this.post(`/api/campaigns/${campaignId}/preview`, { variables, sampleContact });
  }

  async testCampaign(campaignId: string, testEmails: string[], variables?: any, sampleContact?: any): Promise<any> {
    return this.post(`/api/campaigns/${campaignId}/test`, { testEmails, variables, sampleContact });
  }

  async getCampaignAnalytics(campaignId: string): Promise<any> {
    return this.get(`/api/campaigns/${campaignId}/analytics`);
  }

  // Template methods
  async getTemplates(): Promise<any> {
    return this.get('/api/templates');
  }

  async getTemplate(id: string): Promise<any> {
    return this.get(`/api/templates/${id}`);
  }

  async createTemplate(template: any): Promise<any> {
    return this.post('/api/templates', template);
  }

  async updateTemplate(id: string, template: any): Promise<any> {
    return this.put(`/api/templates/${id}`, template);
  }

  async deleteTemplate(id: string): Promise<any> {
    return this.delete(`/api/templates/${id}`);
  }

  async getTemplateLibrary(category?: string): Promise<any> {
    const endpoint = category ? `/api/templates/library?category=${category}` : '/api/templates/library';
    return this.get(endpoint);
  }

  async seedTemplates(force?: boolean): Promise<any> {
    return this.post('/api/templates/seed', { force });
  }

  // Reports methods
  async getReports(): Promise<any> {
    return this.get('/api/reports/dashboard');
  }

  async getCampaignStats(): Promise<any> {
    return this.get('/api/reports/campaigns');
  }

  // Activity methods
  async getRecentActivity(): Promise<any> {
    return this.get('/api/activity/recent');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;

const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, options);
  return res.json();
}