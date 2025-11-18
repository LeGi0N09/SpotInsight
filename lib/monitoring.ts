type MetricType = 'api_response' | 'db_query' | 'cron_job' | 'token_refresh';

interface Metric {
  type: MetricType;
  name: string;
  duration?: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

class Monitor {
  private metrics: Metric[] = [];
  private maxMetrics = 1000;

  track(metric: Omit<Metric, 'timestamp'>) {
    const fullMetric: Metric = {
      ...metric,
      timestamp: new Date().toISOString(),
    };
    
    this.metrics.push(fullMetric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Check for alerts
    this.checkAlerts(fullMetric);
  }

  private checkAlerts(metric: Metric) {
    // Alert: Cron fails 3+ times in a row
    if (metric.type === 'cron_job' && !metric.success) {
      const recentCronJobs = this.metrics
        .filter(m => m.type === 'cron_job')
        .slice(-3);
      
      if (recentCronJobs.length === 3 && recentCronJobs.every(m => !m.success)) {
        this.alert('Cron job failed 3 times in a row', metric.error);
      }
    }

    // Alert: Token refresh fails
    if (metric.type === 'token_refresh' && !metric.success) {
      this.alert('Token refresh failed', metric.error);
    }

    // Alert: Slow API response (>5s)
    if (metric.type === 'api_response' && metric.duration && metric.duration > 5000) {
      this.alert(`Slow API response: ${metric.name}`, `${metric.duration}ms`);
    }
  }

  private alert(message: string, details?: string) {
    console.error(`🚨 ALERT: ${message}`, details || '');
    // Future: Send to webhook, email, or monitoring service
  }

  getStats() {
    const now = Date.now();
    const last24h = this.metrics.filter(
      m => now - new Date(m.timestamp).getTime() < 86400000
    );

    return {
      total: last24h.length,
      byType: {
        api_response: last24h.filter(m => m.type === 'api_response').length,
        db_query: last24h.filter(m => m.type === 'db_query').length,
        cron_job: last24h.filter(m => m.type === 'cron_job').length,
        token_refresh: last24h.filter(m => m.type === 'token_refresh').length,
      },
      successRate: {
        overall: (last24h.filter(m => m.success).length / last24h.length) * 100,
        cron: this.getSuccessRate(last24h, 'cron_job'),
        api: this.getSuccessRate(last24h, 'api_response'),
      },
      avgDuration: {
        api: this.getAvgDuration(last24h, 'api_response'),
        db: this.getAvgDuration(last24h, 'db_query'),
      },
    };
  }

  private getSuccessRate(metrics: Metric[], type: MetricType) {
    const filtered = metrics.filter(m => m.type === type);
    if (filtered.length === 0) return 100;
    return (filtered.filter(m => m.success).length / filtered.length) * 100;
  }

  private getAvgDuration(metrics: Metric[], type: MetricType) {
    const filtered = metrics.filter(m => m.type === type && m.duration);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + (m.duration || 0), 0) / filtered.length;
  }
}

export const monitor = new Monitor();
