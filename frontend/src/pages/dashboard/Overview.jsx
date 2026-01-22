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
  XCircle,
  Map,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    secondary: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    danger: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-all" data-testid="stat-card">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-mono ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-heading font-bold text-white">{value}</p>
    </div>
  );
};

const AlertItem = ({ alert, onAcknowledge }) => {
  const severityColors = {
    low: 'border-l-emerald-500 bg-emerald-500/5',
    medium: 'border-l-amber-500 bg-amber-500/5',
    high: 'border-l-orange-500 bg-orange-500/5',
    critical: 'border-l-red-500 bg-red-500/5'
  };

  return (
    <div className={`p-3 border-l-4 rounded-r-lg ${severityColors[alert.severity]}`} data-testid="alert-item">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-white text-sm">{alert.title}</p>
          <p className="text-xs text-slate-400 mt-1">{alert.asset_name}</p>
        </div>
        {alert.status === 'active' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 px-2 text-slate-400 hover:text-white"
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
  const [allAssets, setAllAssets] = useState([]);
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
      setAllAssets(assetsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      <div className="p-6 lg:p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-cyan-500 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400 font-mono text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusIcons = {
    operational: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    maintenance: <Clock className="w-4 h-4 text-purple-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    critical: <XCircle className="w-4 h-4 text-red-500" />
  };

  const statusColors = {
    operational: 'bg-emerald-500',
    maintenance: 'bg-purple-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500'
  };

  return (
    <div className="p-4 lg:p-6 bg-slate-950 min-h-screen" data-testid="dashboard-overview">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-tight uppercase mb-1 text-white">
          Dashboard <span className="text-cyan-500">Overzicht</span>
        </h1>
        <p className="text-slate-400 font-mono text-sm">
          Real-time status van alle infrastructuur assets
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Box} label="Totaal Assets" value={analytics?.total_assets || 0} color="primary" />
        <StatCard icon={AlertTriangle} label="Actieve Alerts" value={analytics?.active_alerts || 0} color={analytics?.active_alerts > 0 ? 'secondary' : 'accent'} />
        <StatCard icon={TrendingUp} label="Gem. Gezondheid" value={`${analytics?.average_health_score || 0}%`} trend={2.3} color="accent" />
        <StatCard icon={Waves} label="Uptime" value={`${analytics?.uptime_percentage || 99.7}%`} color="primary" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left - Alerts */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-sm uppercase tracking-tight text-white">
                Recente Alerts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/alerts')}
                className="text-xs font-mono h-7 px-2 text-slate-400 hover:text-white"
                data-testid="view-all-alerts"
              >
                Alle
              </Button>
            </div>
            <div className="space-y-2">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <AlertItem key={alert.alert_id} alert={alert} onAcknowledge={handleAcknowledge} />
                ))
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">
                  Geen actieve alerts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center - Map Preview Card */}
        <div className="lg:col-span-4">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-full cursor-pointer group hover:border-cyan-500/50 transition-all"
            onClick={() => navigate('/dashboard/monitoring')}
            data-testid="map-preview-card"
          >
            {/* Map Preview Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-cyan-500" />
                  <h2 className="font-heading font-bold text-sm uppercase tracking-tight text-white">
                    Infrastructuur Kaart
                  </h2>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            
            {/* Map Preview Image */}
            <div className="relative h-64 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="absolute inset-0 opacity-30">
                <svg viewBox="0 0 200 150" className="w-full h-full">
                  {/* Simplified Netherlands outline */}
                  <path 
                    d="M100,20 L130,30 L140,60 L150,80 L140,100 L130,120 L110,130 L80,125 L60,110 L50,80 L60,50 L80,30 Z" 
                    fill="none" 
                    stroke="#0ea5e9" 
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  {/* Asset markers */}
                  <circle cx="100" cy="60" r="4" fill="#22c55e" />
                  <circle cx="85" cy="75" r="4" fill="#22c55e" />
                  <circle cx="110" cy="80" r="4" fill="#f59e0b" />
                  <circle cx="95" cy="95" r="4" fill="#a855f7" />
                  <circle cx="120" cy="70" r="4" fill="#22c55e" />
                </svg>
              </div>
              <div className="text-center z-10">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <MapPin className="w-8 h-8 text-cyan-500" />
                </div>
                <p className="text-slate-300 font-medium">Bekijk Kaart</p>
                <p className="text-xs text-slate-500 mt-1">3D Cesium Visualisatie</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 border-t border-slate-800">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-emerald-500">{analytics?.status_distribution?.operational || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Normaal</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-500">{analytics?.status_distribution?.warning || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Warning</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-500">{analytics?.status_distribution?.maintenance || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Onderhoud</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Asset List */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-sm uppercase tracking-tight text-white">
                Assets
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/assets')}
                className="text-xs font-mono h-7 px-2 text-slate-400 hover:text-white"
                data-testid="view-all-assets"
              >
                Alle
              </Button>
            </div>
            <div className="space-y-2">
              {allAssets.slice(0, 7).map((asset) => (
                <div 
                  key={asset.asset_id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-all"
                  onClick={() => navigate('/dashboard/monitoring')}
                  data-testid={`asset-${asset.asset_id}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[asset.status]}`} />
                    <div>
                      <p className="text-xs font-medium text-white truncate max-w-[140px]">{asset.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{asset.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-cyan-400">{asset.health_score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Status Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mt-4">
        <h2 className="font-heading font-bold text-sm uppercase tracking-tight mb-4 text-white">
          Status Verdeling
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {analytics?.status_distribution && Object.entries(analytics.status_distribution).map(([status, count]) => (
            <div key={status} className="text-center p-3 bg-slate-800/50 rounded-lg">
              {statusIcons[status]}
              <p className="text-xl font-heading font-bold mt-1 text-white">{count}</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
