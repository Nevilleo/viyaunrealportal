import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { 
  Activity, 
  AlertTriangle, 
  Box, 
  TrendingUp, 
  Waves,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, subValue, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    secondary: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    danger: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  return (
    <div className="glass p-6 rounded-sm hover:border-primary/30 transition-all group" data-testid="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-sm flex items-center justify-center border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-mono ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-heading font-bold text-foreground">{value}</p>
      {subValue && <p className="text-sm text-muted-foreground mt-1">{subValue}</p>}
    </div>
  );
};

const AlertItem = ({ alert, onAcknowledge }) => {
  const severityColors = {
    low: 'border-l-emerald-500 bg-emerald-500/5',
    medium: 'border-l-yellow-500 bg-yellow-500/5',
    high: 'border-l-orange-500 bg-orange-500/5',
    critical: 'border-l-red-500 bg-red-500/5'
  };

  return (
    <div className={`p-4 border-l-4 rounded-r-sm ${severityColors[alert.severity]}`} data-testid="alert-item">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{alert.asset_name}</p>
        </div>
        {alert.status === 'active' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => onAcknowledge(alert.alert_id)}
            data-testid={`acknowledge-${alert.alert_id}`}
          >
            Bevestig
          </Button>
        )}
      </div>
    </div>
  );
};

export default function DashboardOverview() {
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [analyticsRes, alertsRes, assetsRes] = await Promise.all([
        axios.get(`${API}/analytics/overview`, { withCredentials: true }),
        axios.get(`${API}/alerts?status=active`, { withCredentials: true }),
        axios.get(`${API}/assets`, { withCredentials: true })
      ]);
      setAnalytics(analyticsRes.data);
      setAlerts(alertsRes.data.slice(0, 5));
      setAssets(assetsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.put(`${API}/alerts/${alertId}/acknowledge`, {}, { withCredentials: true });
      fetchData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 grid-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusIcons = {
    operational: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    maintenance: <Clock className="w-4 h-4 text-purple-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    critical: <XCircle className="w-4 h-4 text-red-500" />
  };

  return (
    <div className="p-6 lg:p-8 grid-bg min-h-screen" data-testid="dashboard-overview">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight uppercase mb-2">
          Dashboard <span className="text-primary">Overzicht</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Real-time status van alle infrastructuur assets
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Box}
          label="Totaal Assets"
          value={analytics?.total_assets || 0}
          color="primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Actieve Alerts"
          value={analytics?.active_alerts || 0}
          color={analytics?.active_alerts > 0 ? 'secondary' : 'accent'}
        />
        <StatCard
          icon={TrendingUp}
          label="Gem. Gezondheid"
          value={`${analytics?.average_health_score || 0}%`}
          trend={2.3}
          color="accent"
        />
        <StatCard
          icon={Waves}
          label="Uptime"
          value={`${analytics?.uptime_percentage || 99.7}%`}
          color="primary"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="glass p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg uppercase tracking-tight">
              Recente Alerts
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/alerts')}
              className="text-xs font-mono"
              data-testid="view-all-alerts"
            >
              Bekijk Alle
            </Button>
          </div>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertItem key={alert.alert_id} alert={alert} onAcknowledge={handleAcknowledge} />
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                Geen actieve alerts
              </p>
            )}
          </div>
        </div>

        {/* Asset Status */}
        <div className="glass p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg uppercase tracking-tight">
              Asset Status
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/assets')}
              className="text-xs font-mono"
              data-testid="view-all-assets"
            >
              Bekijk Alle
            </Button>
          </div>
          <div className="space-y-3">
            {assets.map((asset) => (
              <div 
                key={asset.asset_id} 
                className="flex items-center justify-between p-3 bg-slate-900/30 rounded-sm hover:bg-slate-900/50 transition-colors cursor-pointer"
                onClick={() => navigate('/dashboard/monitoring')}
                data-testid={`asset-${asset.asset_id}`}
              >
                <div className="flex items-center gap-3">
                  {statusIcons[asset.status]}
                  <div>
                    <p className="text-sm font-medium text-foreground">{asset.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{asset.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-foreground">{asset.health_score}%</p>
                  <p className="text-xs text-muted-foreground capitalize">{asset.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="glass p-6 rounded-sm mt-6">
        <h2 className="font-heading font-bold text-lg uppercase tracking-tight mb-4">
          Status Verdeling
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics?.status_distribution && Object.entries(analytics.status_distribution).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-slate-900/30 rounded-sm">
              {statusIcons[status]}
              <p className="text-2xl font-heading font-bold mt-2">{count}</p>
              <p className="text-xs font-mono text-muted-foreground uppercase">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
