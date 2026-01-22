import React, { useState, useEffect, useRef } from 'react';
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
  Maximize2,
  MapPin,
  Loader2
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
    <div className="glass p-4 rounded-sm hover:border-primary/30 transition-all group" data-testid="stat-card">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-mono ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
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
    <div className={`p-3 border-l-4 rounded-r-sm ${severityColors[alert.severity]}`} data-testid="alert-item">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{alert.asset_name}</p>
        </div>
        {alert.status === 'active' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 px-2"
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
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [analyticsRes, alertsRes, assetsRes] = await Promise.all([
        axios.get(`${API}/analytics/overview`, { withCredentials: true }),
        axios.get(`${API}/alerts?status=active`, { withCredentials: true }),
        axios.get(`${API}/assets`, { withCredentials: true })
      ]);
      setAnalytics(analyticsRes.data);
      setAlerts(alertsRes.data.slice(0, 4));
      setAssets(assetsRes.data.slice(0, 5));
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

  // Initialize Cesium for embedded map
  useEffect(() => {
    if (loading || allAssets.length === 0 || !cesiumContainerRef.current) return;

    let isMounted = true;

    const initCesium = async () => {
      try {
        const Cesium = await import('cesium');
        
        const token = process.env.REACT_APP_CESIUM_ION_TOKEN;
        if (token) {
          Cesium.Ion.defaultAccessToken = token;
        }

        if (!isMounted || !cesiumContainerRef.current) return;

        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
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
          scene3DOnly: true,
          skyBox: false,
        });

        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0f172a');
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1e293b');
        
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(5.5, 52.2, 400000),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-50),
            roll: 0,
          },
        });

        // Add markers
        allAssets.forEach((asset) => {
          const color = asset.status === 'critical' ? '#ef4444' :
                       asset.status === 'warning' ? '#f59e0b' :
                       asset.status === 'maintenance' ? '#a855f7' : '#22c55e';
          
          viewer.entities.add({
            id: asset.asset_id,
            position: Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, 0),
            point: {
              pixelSize: 14,
              color: Cesium.Color.fromCssColorString(color),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          });
        });

        // Click handler
        viewer.screenSpaceEventHandler.setInputAction((click) => {
          const picked = viewer.scene.pick(click.position);
          if (Cesium.defined(picked) && picked.id) {
            const asset = allAssets.find(a => a.asset_id === picked.id.id);
            if (asset) setSelectedAsset(asset);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        viewerRef.current = viewer;
        setMapLoading(false);

      } catch (err) {
        console.error('Cesium init error:', err);
        setMapLoading(false);
      }
    };

    initCesium();

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [loading, allAssets]);

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.put(`${API}/alerts/${alertId}/acknowledge`, {}, { withCredentials: true });
      fetchData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleMarkerClick = (assetId) => {
    const asset = allAssets.find(a => a.asset_id === assetId);
    if (asset) {
      setSelectedAsset(asset);
    }
  };

  const handleAssetHover = (asset) => {
    setFlyTo({ latitude: asset.latitude, longitude: asset.longitude });
    setSelectedAsset(asset);
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

  const statusColors = {
    operational: 'bg-emerald-500',
    maintenance: 'bg-purple-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  return (
    <div className="p-4 lg:p-6 grid-bg min-h-screen" data-testid="dashboard-overview">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-tight uppercase mb-1">
          Dashboard <span className="text-primary">Overzicht</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Real-time status van alle infrastructuur assets
        </p>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

      {/* Main Content: Map in Center with Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar - Alerts */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="glass p-4 rounded-sm h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-sm uppercase tracking-tight">
                Recente Alerts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/alerts')}
                className="text-xs font-mono h-7 px-2"
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
                <p className="text-muted-foreground text-sm text-center py-4">
                  Geen actieve alerts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center - Map Canvas */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <div className="glass rounded-sm overflow-hidden" data-testid="map-canvas">
            {/* Map Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-slate-950/80 relative z-30">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="font-heading font-bold text-sm uppercase tracking-tight">
                  Infrastructuur Kaart
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/monitoring')}
                className="text-xs font-mono h-7 px-2"
                data-testid="expand-map"
              >
                <Maximize2 className="w-3 h-3 mr-1" />
                Volledig
              </Button>
            </div>
            
            {/* Map Container - Fixed height with relative positioning */}
            <div className="relative w-full" style={{ height: '450px' }}>
              <div className="absolute inset-0 w-full h-full">
                <CesiumGlobe 
                  markers={allAssets} 
                  onMarkerClick={handleMarkerClick}
                  flyTo={flyTo}
                />
              </div>
              
              {/* Selected Asset Overlay */}
              {selectedAsset && (
                <div className="absolute bottom-4 left-4 right-4 glass p-3 rounded-sm z-30" data-testid="selected-asset-info">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${statusColors[selectedAsset.status]}`} />
                      <div>
                        <p className="font-medium text-sm">{selectedAsset.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{selectedAsset.type} • {selectedAsset.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-heading font-bold text-primary">{selectedAsset.health_score}%</p>
                      <p className="text-xs text-muted-foreground capitalize">{selectedAsset.status}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute top-4 right-4 glass p-2 rounded-sm z-30">
                <div className="flex flex-col gap-1 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Operationeel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">Waarschuwing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground">Onderhoud</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Asset List */}
        <div className="lg:col-span-3 order-3">
          <div className="glass p-4 rounded-sm h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-sm uppercase tracking-tight">
                Assets
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/assets')}
                className="text-xs font-mono h-7 px-2"
                data-testid="view-all-assets"
              >
                Alle
              </Button>
            </div>
            <div className="space-y-2">
              {allAssets.map((asset) => (
                <div 
                  key={asset.asset_id} 
                  className={`flex items-center justify-between p-2 rounded-sm cursor-pointer transition-all ${
                    selectedAsset?.asset_id === asset.asset_id 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'bg-slate-900/30 hover:bg-slate-900/50'
                  }`}
                  onClick={() => handleAssetHover(asset)}
                  data-testid={`asset-${asset.asset_id}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[asset.status]}`} />
                    <div>
                      <p className="text-xs font-medium text-foreground truncate max-w-[120px]">{asset.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{asset.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-foreground">{asset.health_score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Status Distribution */}
      <div className="glass p-4 rounded-sm mt-4">
        <h2 className="font-heading font-bold text-sm uppercase tracking-tight mb-3">
          Status Verdeling
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {analytics?.status_distribution && Object.entries(analytics.status_distribution).map(([status, count]) => (
            <div key={status} className="text-center p-3 bg-slate-900/30 rounded-sm">
              {statusIcons[status]}
              <p className="text-xl font-heading font-bold mt-1">{count}</p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
