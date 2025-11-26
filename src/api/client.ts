const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  return '/api';
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
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Если ответ не JSON, пытаемся получить текст
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        } catch (textError) {
          // Если и текст не получается, используем дефолтное сообщение
          if (response.status === 401) {
            errorMessage = 'Неверные учетные данные';
          } else if (response.status === 403) {
            errorMessage = 'Доступ запрещен';
          } else if (response.status === 404) {
            errorMessage = 'Ресурс не найден';
          } else if (response.status >= 500) {
            errorMessage = 'Ошибка сервера. Попробуйте позже';
          } else {
            errorMessage = 'Произошла ошибка';
          }
        }
      }
      const err: any = new Error(errorMessage);
      err.status = response.status;
      err.response = { status: response.status };
      throw err;
    }

    return response.json();
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData,
    method: 'POST' | 'PUT' = 'POST'
  ): Promise<T> {
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: formData,
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

  async getProfile() {
    return this.request<any>('/profile');
  }

  async updateProfile(data: { first_name?: string; last_name?: string; email?: string }) {
    return this.request<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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

  async getAllNotes() {
    return this.request<any[]>('/notes');
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

  async getAllComments() {
    return this.request<any[]>('/comments');
  }

  // Public content API methods (no auth required for reading)
  async getNews(page: number = 1, limit: number = 20) {
    const response = await this.request<{ data: any[], pagination: any }>(`/news?page=${page}&limit=${limit}`);
    return response.data || response; // Обратная совместимость
  }

  async getRecordings(page: number = 1, limit: number = 20) {
    const response = await this.request<{ data: any[], pagination: any }>(`/recordings?page=${page}&limit=${limit}`);
    return response.data || response; // Обратная совместимость
  }

  async recordRecordingView(recordingId: number) {
    return this.request<{ success: boolean }>(`/recordings/${recordingId}/view`, {
      method: 'POST',
    });
  }

  async getFAQ() {
    return this.request<any[]>('/faq');
  }

  // Admin API methods (auth required for write operations)
  async createNews(data: any) {
    return this.request<any>('/admin/news', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNews(id: number, data: any) {
    return this.request<any>(`/admin/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNews(id: number) {
    return this.request<any>(`/admin/news/${id}`, {
      method: 'DELETE',
    });
  }

  async createNewsWithImage(formData: FormData) {
    return this.requestFormData<any>('/admin/news', formData, 'POST');
  }

  async updateNewsWithImage(id: number, formData: FormData) {
    return this.requestFormData<any>(`/admin/news/${id}`, formData, 'PUT');
  }

  async createRecording(data: any) {
    return this.request<any>('/admin/recordings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecording(id: number, data: any) {
    return this.request<any>(`/admin/recordings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createRecordingWithImage(formData: FormData) {
    return this.requestFormData<any>('/admin/recordings', formData, 'POST');
  }

  async updateRecordingWithImage(id: number, formData: FormData) {
    return this.requestFormData<any>(`/admin/recordings/${id}`, formData, 'PUT');
  }

  async deleteRecording(id: number) {
    return this.request<any>(`/admin/recordings/${id}`, {
      method: 'DELETE',
    });
  }

  async createFAQ(data: any) {
    return this.request<any>('/admin/faq', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFAQ(id: number, data: any) {
    return this.request<any>(`/admin/faq/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFAQ(id: number) {
    return this.request<any>(`/admin/faq/${id}`, {
      method: 'DELETE',
    });
  }

  async getUsers(params?: { page?: number; limit?: number; cohort_id?: number; product_id?: number; search?: string; signal?: AbortSignal }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.cohort_id) queryParams.append('cohort_id', params.cohort_id.toString());
    if (params?.product_id) queryParams.append('product_id', params.product_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{
      data: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }
    }>(url, { signal: params?.signal });
  }

  async createUser(data: { username: string; email: string; password?: string; first_name?: string; last_name?: string; role?: 'user' | 'admin' }) {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: { username?: string; email?: string; password?: string; first_name?: string; last_name?: string; role?: 'user' | 'admin' }) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserRole(id: number, role: 'user' | 'admin') {
    return this.request<any>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(id: number) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getEmailCampaigns() {
    return this.request<any[]>('/admin/emails');
  }

  async getEmailCampaignDetails(id: number) {
    return this.request<any>(`/admin/emails/${id}`);
  }

  async createEmailCampaign(data: any) {
    return this.request<any>('/admin/emails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmailCampaign(id: number, data: any) {
    return this.request<any>(`/admin/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmailCampaign(id: number) {
    return this.request<any>(`/admin/emails/${id}`, {
      method: 'DELETE',
    });
  }

  async sendEmailCampaign(id: number, testMode: boolean = false, recipients?: string[]) {
    return this.request<any>(`/admin/emails/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ test_mode: testMode, recipients }),
    });
  }

  async getEmailCampaignStats(id: number) {
    return this.get<any>(`/admin/emails/${id}/stats`);
  }

  async previewEmailSegment(segmentData: { segment_type: string, segment_product_id?: number, segment_cohort_id?: number }) {
    return this.post<any>('/admin/emails/preview-segment', segmentData);
  }

  async refreshEmailStats(id: number) {
    return this.post<any>(`/admin/emails/${id}/refresh-stats`);
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

  // Password reset methods
  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.post('/forgot-password', { email });
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
    return this.get(`/verify-reset-token/${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.post('/reset-password', { token, newPassword });
  }

  // Initial password setup methods (admin only)
  async sendInitialPasswords(): Promise<{ sent: number; failed: number; total: number; message: string }> {
    return this.post('/admin/send-initial-passwords');
  }

  async getInitialPasswordStats(): Promise<{ stats: { total: number; used: number; active: number; expired: number } }> {
    return this.get('/admin/initial-passwords/stats');
  }

  // Setup password (for initial password creation)
  async verifySetupToken(token: string): Promise<{ valid: boolean; message?: string }> {
    return this.get(`/verify-setup-token/${token}`);
  }

  async setupPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.post('/setup-password', { token, newPassword });
  }

  // Products management
  async getProducts() {
    return this.get<any[]>('/admin/products');
  }

  async getProduct(id: number) {
    return this.get<any>(`/admin/products/${id}`);
  }

  async createProduct(data: any) {
    return this.post<any>('/admin/products', data);
  }

  async updateProduct(id: number, data: any) {
    return this.put<any>(`/admin/products/${id}`, data);
  }

  async deleteProduct(id: number) {
    return this.delete(`/admin/products/${id}`);
  }

  // Pricing tiers management
  async getCohortTiers(productId: number, cohortId: number) {
    return this.get<any[]>(`/admin/products/${productId}/cohorts/${cohortId}/tiers`);
  }

  async createCohortTier(productId: number, cohortId: number, data: any) {
    return this.post<any>(`/admin/products/${productId}/cohorts/${cohortId}/tiers`, data);
  }

  async updateCohortTier(productId: number, cohortId: number, tierId: number, data: any) {
    return this.put<any>(`/admin/products/${productId}/cohorts/${cohortId}/tiers/${tierId}`, data);
  }

  async deleteCohortTier(productId: number, cohortId: number, tierId: number) {
    return this.delete(`/admin/products/${productId}/cohorts/${cohortId}/tiers/${tierId}`);
  }

  // Backward compatibility (deprecated - use cohort-specific methods instead)
  async getProductTiers(productId: number) {
    return this.get<any[]>(`/admin/products/${productId}/tiers`);
  }

  async createProductTier(productId: number, data: any) {
    return this.post<any>(`/admin/products/${productId}/tiers`, data);
  }

  async updateProductTier(productId: number, tierId: number, data: any) {
    return this.put<any>(`/admin/products/${productId}/tiers/${tierId}`, data);
  }

  async deleteProductTier(productId: number, tierId: number) {
    return this.delete(`/admin/products/${productId}/tiers/${tierId}`);
  }

  // Cohorts management
  async getCohorts(productId?: number) {
    const query = productId ? `?product_id=${productId}` : '';
    return this.get<any[]>(`/admin/cohorts${query}`);
  }

  async getCohort(id: number) {
    return this.get<any>(`/admin/cohorts/${id}`);
  }

  async createCohort(data: any) {
    return this.post<any>('/admin/cohorts', data);
  }

  async updateCohort(id: number, data: any) {
    return this.put<any>(`/admin/cohorts/${id}`, data);
  }

  async deleteCohort(id: number) {
    return this.delete(`/admin/cohorts/${id}`);
  }

  async getCohortMembers(cohortId: number) {
    return this.get<any[]>(`/admin/cohorts/${cohortId}/members`);
  }

  async addCohortMembers(cohortId: number, userIds: number[]) {
    return this.post<any>(`/admin/cohorts/${cohortId}/members`, { user_ids: userIds });
  }

  async removeCohortMembers(cohortId: number, userIds: number[]) {
    return this.post<any>(`/admin/cohorts/${cohortId}/members/remove`, { user_ids: userIds });
  }

  async copyCohort(cohortId: number, data: { name: string }) {
    return this.post<any>(`/admin/cohorts/${cohortId}/copy`, data);
  }

  async getCohortMaterials(cohortId: number) {
    return this.get<any[]>(`/admin/cohorts/${cohortId}/materials`);
  }

  async getAvailableMaterials(cohortId: number) {
    return this.get<any>(`/admin/cohorts/${cohortId}/available-materials`);
  }

  async assignCohortMaterials(cohortId: number, data: { material_type: string, material_ids: number[], is_visible?: boolean }) {
    return this.post<any>(`/admin/cohorts/${cohortId}/materials`, data);
  }

  async updateMaterialsVisibility(cohortId: number, materials: Array<{type: string, id: number, visible: boolean}>) {
    return this.put<any>(`/admin/cohorts/${cohortId}/materials/visibility`, { materials });
  }

  async removeCohortMaterial(cohortId: number, materialType: string, materialId: number) {
    return this.delete(`/admin/cohorts/${cohortId}/materials/${materialType}/${materialId}`);
  }

  // User enrollments management
  async getEnrollments(userId?: number, productId?: number) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (productId) params.append('product_id', productId.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.get<any[]>(`/admin/enrollments${query}`);
  }

  async createEnrollment(data: any) {
    return this.post<any>('/admin/enrollments', data);
  }

  async updateEnrollment(id: number, data: any) {
    return this.put<any>(`/admin/enrollments/${id}`, data);
  }

  async deleteEnrollment(id: number) {
    return this.delete(`/admin/enrollments/${id}`);
  }

  // Product resources (materials assignment)
  async getProductResources(productId: number, resourceType?: string) {
    const query = resourceType ? `?resource_type=${resourceType}` : '';
    return this.get<any[]>(`/admin/resources/${productId}${query}`);
  }

  async assignProductResource(productId: number, data: any) {
    return this.post<any>(`/admin/resources/${productId}`, data);
  }

  async assignProductResourcesBatch(productId: number, resources: any[]) {
    return this.post<any>(`/admin/resources/${productId}/batch`, { resources });
  }

  async removeProductResource(productId: number, resourceId: number) {
    return this.delete(`/admin/resources/${productId}/${resourceId}`);
  }

  // Public catalog
  async getCatalogProducts() {
    return this.get<any[]>('/catalog/products');
  }

  async getCatalogProduct(id: number) {
    return this.get<any>(`/catalog/products/${id}`);
  }
}

export const apiClient = new ApiClient();
