// API client for CSEMail backend communication
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
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
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
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
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

  // Campaign methods
  async getCampaigns(page: number = 1, limit: number = 20): Promise<any> {
    return this.get(`/api/campaigns?page=${page}&limit=${limit}`);
  }

  async createCampaign(campaign: any): Promise<any> {
    return this.post('/api/campaigns', campaign);
  }

  // Template methods
  async getTemplates(): Promise<any> {
    return this.get('/api/templates');
  }

  async createTemplate(template: any): Promise<any> {
    return this.post('/api/templates', template);
  }

  // Reports methods
  async getReports(): Promise<any> {
    return this.get('/api/reports');
  }

  async getCampaignStats(): Promise<any> {
    return this.get('/api/reports/stats');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;