const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.protocol}//${window.location.hostname}:3001/api`;
  }
  
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      const err: any = new Error(error.error || `HTTP ${response.status}`);
      err.status = response.status;
      err.response = { status: response.status };
      throw err;
    }

    return response.json();
  }

  async register(username: string, email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async getInstructions(params?: { category?: string; search?: string }) {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return this.request<any[]>(`/instructions${queryString}`);
  }

  async getInstruction(id: number) {
    return this.request<any>(`/instructions/${id}`);
  }

  async createInstruction(data: any) {
    return this.request<any>('/instructions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstruction(id: number, data: any) {
    return this.request<any>(`/instructions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInstruction(id: number) {
    return this.request<any>(`/instructions/${id}`, {
      method: 'DELETE',
    });
  }

  async getEvents() {
    return this.request<any[]>('/events');
  }

  async createEvent(data: any) {
    return this.request<any>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: number, data: any) {
    return this.request<any>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: number) {
    return this.request<any>(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async getFavorites() {
    return this.request<any[]>('/favorites');
  }

  async addToFavorites(instructionId: number) {
    return this.request<any>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ instruction_id: instructionId }),
    });
  }

  async removeFromFavorites(instructionId: number) {
    return this.request<any>(`/favorites/${instructionId}`, {
      method: 'DELETE',
    });
  }

  async getNote(instructionId: number) {
    return this.request<any>(`/notes/${instructionId}`);
  }

  async saveNote(instructionId: number, content: string) {
    return this.request<any>('/notes', {
      method: 'POST',
      body: JSON.stringify({ instruction_id: instructionId, content }),
    });
  }

  async deleteNote(instructionId: number) {
    return this.request<any>(`/notes/${instructionId}`, {
      method: 'DELETE',
    });
  }

  async getProgress() {
    return this.request<any[]>('/progress');
  }

  async updateProgress(instructionId: number, completed: boolean) {
    return this.request<any>('/progress', {
      method: 'POST',
      body: JSON.stringify({ instruction_id: instructionId, completed }),
    });
  }

  // Generic methods for custom API calls
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
