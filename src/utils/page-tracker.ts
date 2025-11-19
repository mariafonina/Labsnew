import { apiClient } from '../api/client';

interface PageVisitData {
  page_path: string;
  page_title?: string;
  page_type?: string;
  page_id?: string;
  referrer?: string;
  session_id: string;
  time_spent_seconds?: number;
  user_agent?: string;
  device_type?: string;
}

class PageTracker {
  private sessionId: string;
  private currentPageStartTime: number = 0;
  private currentPagePath: string = '';
  private pendingVisit: PageVisitData | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor() {
    // Generate session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Track visibility changes to measure time accurately
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        // Page is hidden, record time spent
        this.recordTimeSpent();
      } else {
        // Page is visible again, restart timer
        if (this.currentPagePath) {
          this.currentPageStartTime = Date.now();
        }
      }
    };

    // Track before unload to record final time
    this.beforeUnloadHandler = () => {
      this.recordTimeSpent();
      // Try to send pending visit synchronously
      if (this.pendingVisit) {
        this.sendVisit(this.pendingVisit, true);
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private extractPageInfo(pathname: string, search: string = ''): { page_type?: string; page_id?: string } {
    const fullPath = pathname + search;
    
    // Match routes and extract info
    if (pathname === '/' || pathname === '') {
      return { page_type: 'onboarding' };
    }
    
    // News routes
    if (pathname.startsWith('/news')) {
      const match = pathname.match(/^\/news(?:\/(\d+))?$/);
      return {
        page_type: 'news',
        page_id: match?.[1] || undefined,
      };
    }
    
    // Events routes
    if (pathname.startsWith('/events') || pathname.startsWith('/calendar')) {
      const match = pathname.match(/\/(?:events|calendar)(?:\/(\d+))?$/);
      return {
        page_type: 'event',
        page_id: match?.[1] || undefined,
      };
    }
    
    // Instructions routes
    if (pathname.startsWith('/instructions') || pathname.startsWith('/library')) {
      const match = pathname.match(/\/(?:instructions|library)(?:\/(\d+))?$/);
      return {
        page_type: 'instruction',
        page_id: match?.[1] || undefined,
      };
    }
    
    // Recordings routes
    if (pathname.startsWith('/recordings')) {
      const match = pathname.match(/^\/recordings(?:\/(\d+))?$/);
      return {
        page_type: 'recording',
        page_id: match?.[1] || undefined,
      };
    }
    
    // FAQ routes
    if (pathname.startsWith('/faq')) {
      const match = pathname.match(/^\/faq(?:\/(\d+))?$/);
      return {
        page_type: 'faq',
        page_id: match?.[1] || undefined,
      };
    }
    
    // Profile
    if (pathname.startsWith('/profile')) {
      return { page_type: 'profile' };
    }
    
    // Favorites
    if (pathname.startsWith('/favorites')) {
      return { page_type: 'favorites' };
    }
    
    // Notes
    if (pathname.startsWith('/notes')) {
      return { page_type: 'notes' };
    }
    
    return {};
  }

  private recordTimeSpent(): void {
    if (this.currentPageStartTime > 0 && this.currentPagePath) {
      const timeSpent = Math.floor((Date.now() - this.currentPageStartTime) / 1000);
      if (this.pendingVisit && timeSpent > 0) {
        this.pendingVisit.time_spent_seconds = timeSpent;
      }
    }
  }

  private async sendVisit(data: PageVisitData, sync: boolean = false): Promise<void> {
    try {
      // For beforeunload, try to send synchronously but don't block
      if (sync) {
        // Use fetch with keepalive for beforeunload
        const token = localStorage.getItem('auth_token');
        fetch('/api/analytics/page-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {
          // Silently fail
        });
      } else {
        await apiClient.trackPageVisit(data);
      }
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug('Failed to track page visit:', error);
    }
  }

  trackPage(pathname: string, search: string = ''): void {
    // Record time spent on previous page
    if (this.currentPagePath && this.currentPagePath !== pathname) {
      this.recordTimeSpent();
      
      // Send previous page visit
      if (this.pendingVisit) {
        this.sendVisit(this.pendingVisit);
      }
    }

    // Start tracking new page
    const fullPath = pathname + search;
    const pageInfo = this.extractPageInfo(pathname, search);
    
    this.currentPagePath = pathname;
    this.currentPageStartTime = Date.now();
    
    this.pendingVisit = {
      page_path: fullPath,
      page_title: document.title || undefined,
      page_type: pageInfo.page_type,
      page_id: pageInfo.page_id,
      referrer: document.referrer || undefined,
      session_id: this.sessionId,
      user_agent: navigator.userAgent,
      device_type: this.getDeviceType(),
    };

    // Send visit immediately (time will be updated on page change)
    this.sendVisit(this.pendingVisit);
  }

  destroy(): void {
    // Record final time
    this.recordTimeSpent();
    
    // Send final visit
    if (this.pendingVisit) {
      this.sendVisit(this.pendingVisit, true);
    }

    // Clean up event listeners
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }
}

// Singleton instance
let trackerInstance: PageTracker | null = null;

export function initPageTracker(): PageTracker {
  if (!trackerInstance) {
    trackerInstance = new PageTracker();
  }
  return trackerInstance;
}

export function getPageTracker(): PageTracker | null {
  return trackerInstance;
}

export function destroyPageTracker(): void {
  if (trackerInstance) {
    trackerInstance.destroy();
    trackerInstance = null;
  }
}

