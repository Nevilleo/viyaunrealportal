import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, useTheme } from '../../App';
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
  ArrowRight,
  Car
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, trend, color = 'primary', isLight }) => {
  const colorClasses = {
    primary: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    secondary: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    danger: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`} data-testid="stat-card">
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
      <p className={`text-xs font-mono uppercase tracking-widest mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-2xl font-heading font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</p>
    </div>
  );
};

const AlertItem = ({ alert, onAcknowledge, isLight }) => {
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
          <p className={`font-medium text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{alert.title}</p>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{alert.asset_name}</p>
        </div>
        {alert.status === 'active' && (
          <Button
            size="sm"
            variant="ghost"
            className={`text-xs h-7 px-2 ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
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
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
      <div className={`p-6 lg:p-8 min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 text-cyan-500 animate-pulse mx-auto mb-4" />
          <p className={`font-mono text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading dashboard...</p>
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
    <div className={`p-4 lg:p-6 min-h-screen ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`} data-testid="dashboard-overview">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-heading font-bold tracking-tight uppercase mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Dashboard <span className="text-cyan-500">Overzicht</span>
          </h1>
          <p className={`font-mono text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time status van alle infrastructuur assets
          </p>
        </div>
        {/* LCM Voertuig Button */}
        <Button
          onClick={() => navigate('/dashboard/vehicle')}
          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-6 h-11 rounded-lg font-bold shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/40"
          data-testid="lcm-vehicle-btn"
        >
          <Car className="w-5 h-5 mr-2" />
          LCM Voertuig
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Box} label="Totaal Assets" value={analytics?.total_assets || 0} color="primary" isLight={isLight} />
        <StatCard icon={AlertTriangle} label="Actieve Alerts" value={analytics?.active_alerts || 0} color={analytics?.active_alerts > 0 ? 'secondary' : 'accent'} isLight={isLight} />
        <StatCard icon={TrendingUp} label="Gem. Gezondheid" value={`${analytics?.average_health_score || 0}%`} trend={2.3} color="accent" isLight={isLight} />
        <StatCard icon={Waves} label="Uptime" value={`${analytics?.uptime_percentage || 99.7}%`} color="primary" isLight={isLight} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left - Alerts */}
        <div className="lg:col-span-4">
          <div className={`border rounded-lg p-4 h-full ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-heading font-bold text-sm uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Recente Alerts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/alerts')}
                className={`text-xs font-mono h-7 px-2 ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                data-testid="view-all-alerts"
              >
                Alle
              </Button>
            </div>
            <div className="space-y-2">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <AlertItem key={alert.alert_id} alert={alert} onAcknowledge={handleAcknowledge} isLight={isLight} />
                ))
              ) : (
                <p className={`text-sm text-center py-8 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Geen actieve alerts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center - Map Preview Card */}
        <div className="lg:col-span-4">
          <div 
            className={`border rounded-lg overflow-hidden h-full cursor-pointer group transition-all ${isLight ? 'bg-white border-slate-200 hover:border-cyan-400' : 'bg-slate-900 border-slate-800 hover:border-cyan-500/50'}`}
            onClick={() => navigate('/dashboard/monitoring')}
            data-testid="map-preview-card"
          >
            {/* Map Preview Header */}
            <div className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-cyan-500" />
                  <h2 className={`font-heading font-bold text-sm uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Infrastructuur Kaart
                  </h2>
                </div>
                <ArrowRight className={`w-4 h-4 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
              </div>
            </div>
            
            {/* Map Preview Image */}
            <div className={`relative h-64 flex items-center justify-center ${isLight ? 'bg-gradient-to-br from-slate-100 to-slate-200' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
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
                <p className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Bekijk Kaart</p>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>3D Cesium Visualisatie</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`p-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-emerald-500">{analytics?.status_distribution?.operational || 0}</p>
                  <p className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Normaal</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-500">{analytics?.status_distribution?.warning || 0}</p>
                  <p className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Warning</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-500">{analytics?.status_distribution?.maintenance || 0}</p>
                  <p className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Onderhoud</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Asset List */}
        <div className="lg:col-span-4">
          <div className={`border rounded-lg p-4 h-full ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-heading font-bold text-sm uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Assets
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/assets')}
                className={`text-xs font-mono h-7 px-2 ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                data-testid="view-all-assets"
              >
                Alle
              </Button>
            </div>
            <div className="space-y-2">
              {allAssets.slice(0, 7).map((asset) => (
                <div 
                  key={asset.asset_id} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-slate-800/50 hover:bg-slate-800'}`}
                  onClick={() => navigate('/dashboard/monitoring')}
                  data-testid={`asset-${asset.asset_id}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[asset.status]}`} />
                    <div>
                      <p className={`text-xs font-medium truncate max-w-[140px] ${isLight ? 'text-slate-900' : 'text-white'}`}>{asset.name}</p>
                      <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{asset.type}</p>
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
      <div className={`border rounded-lg p-4 mt-4 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
        <h2 className={`font-heading font-bold text-sm uppercase tracking-tight mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Status Verdeling
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {analytics?.status_distribution && Object.entries(analytics.status_distribution).map(([status, count]) => (
            <div key={status} className={`text-center p-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
              {statusIcons[status]}
              <p className={`text-xl font-heading font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{count}</p>
              <p className={`text-[10px] font-mono uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
