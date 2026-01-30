import React, { useState, useEffect, useRef } from 'react';
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
  Car,
  Maximize2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

// Mini Cesium Map Component for Dashboard
const MiniCesiumMap = ({ assets, isLight }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initCesium = async () => {
      try {
        const Cesium = await import('cesium');
        
        const token = process.env.REACT_APP_CESIUM_ION_TOKEN;
        if (token) {
          Cesium.Ion.defaultAccessToken = token;
        }

        window.CESIUM_BASE_URL = '/cesium/';

        if (!isMounted || !containerRef.current) return;

        // Destroy existing viewer if any
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          vrButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          navigationInstructionsInitiallyVisible: false,
          scene3DOnly: true,
          skyBox: false,
          skyAtmosphere: new Cesium.SkyAtmosphere(),
          contextOptions: {
            webgl: { alpha: true },
          },
        });

        viewerRef.current = viewer;

        // Style the canvas
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(isLight ? '#f1f5f9' : '#0f172a');
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(isLight ? '#e2e8f0' : '#1e293b');

        // Hide credits
        viewer.cesiumWidget.creditContainer.style.display = 'none';

        // Set camera to Afsluitdijk
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(5.25, 52.93, 80000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-50),
            roll: 0
          }
        });

        // Status colors
        const statusColors = {
          operational: Cesium.Color.fromCssColorString('#22c55e'),
          warning: Cesium.Color.fromCssColorString('#f59e0b'),
          critical: Cesium.Color.fromCssColorString('#ef4444'),
          maintenance: Cesium.Color.fromCssColorString('#a855f7')
        };

        // Add markers for assets
        if (assets && assets.length > 0) {
          assets.forEach(asset => {
            viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, 50),
              point: {
                pixelSize: 12,
                color: statusColors[asset.status] || statusColors.operational,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
              }
            });
          });
        }

        // Disable interactions for mini view
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableTranslate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        viewer.scene.screenSpaceCameraController.enableTilt = false;
        viewer.scene.screenSpaceCameraController.enableLook = false;

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Cesium init error:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    initCesium();

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {}
        viewerRef.current = null;
      }
    };
  }, [assets, isLight]);

  if (hasError) {
    return (
      <div className={`h-full flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
        <div className="text-center">
          <MapPin className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
          <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Kaart laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center z-10 ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
          <div className="text-center">
            <Activity className="w-8 h-8 text-cyan-500 animate-pulse mx-auto mb-2" />
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Kaart laden...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: '280px' }} />
    </div>
  );
};

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

      {/* Main Content Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* Left - Alerts (smaller on desktop) */}
        <div className="md:col-span-1 xl:col-span-3 order-2 xl:order-1">
          <div className={`border rounded-lg p-3 lg:p-4 h-full ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`font-heading font-bold text-xs lg:text-sm uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Recente Alerts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/alerts')}
                className={`text-xs font-mono h-6 px-2 ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                data-testid="view-all-alerts"
              >
                Alle
              </Button>
            </div>
            <div className="space-y-2 max-h-[400px] xl:max-h-none overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <AlertItem key={alert.alert_id} alert={alert} onAcknowledge={handleAcknowledge} isLight={isLight} />
                ))
              ) : (
                <p className={`text-sm text-center py-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Geen actieve alerts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center - Cesium Map (larger) */}
        <div className="md:col-span-2 xl:col-span-6 order-1 xl:order-2">
          <div 
            className={`border rounded-lg overflow-hidden h-full transition-all ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}
            data-testid="map-preview-card"
          >
            {/* Map Header */}
            <div className={`p-3 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-cyan-500" />
                <h2 className={`font-heading font-bold text-xs lg:text-sm uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Infrastructuur Kaart
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/monitoring')}
                className={`text-xs h-7 px-2 ${isLight ? 'text-slate-500 hover:text-cyan-600' : 'text-slate-400 hover:text-cyan-400'}`}
              >
                <Maximize2 className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Volledig</span>
              </Button>
            </div>
            
            {/* Live Cesium Map - Taller */}
            <div className="relative h-[300px] sm:h-[350px] lg:h-[400px]">
              <MiniCesiumMap assets={allAssets} isLight={isLight} />
              
              {/* Legend Overlay */}
              <div className={`absolute bottom-2 left-2 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 ${isLight ? 'bg-white/90 shadow-md' : 'bg-slate-900/90 border border-slate-700'}`}>
                <div className="flex gap-2 sm:gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500" />
                    <span className={`text-[9px] sm:text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>OK</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500" />
                    <span className={`text-[9px] sm:text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Let op</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500" />
                    <span className={`text-[9px] sm:text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Onderhoud</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`p-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base lg:text-lg font-bold text-emerald-500">{analytics?.status_distribution?.operational || 0}</p>
                  <p className={`text-[9px] lg:text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Normaal</p>
                </div>
                <div>
                  <p className="text-base lg:text-lg font-bold text-amber-500">{analytics?.status_distribution?.warning || 0}</p>
                  <p className={`text-[9px] lg:text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Warning</p>
                </div>
                <div>
                  <p className="text-base lg:text-lg font-bold text-purple-500">{analytics?.status_distribution?.maintenance || 0}</p>
                  <p className={`text-[9px] lg:text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Onderhoud</p>
                </div>
              </div>
            </div>
          </div>
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
