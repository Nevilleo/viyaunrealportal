import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API, useTheme } from '../../App';
import { 
  MapPin, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Minimize2,
  Waves,
  Thermometer,
  Wind,
  Activity,
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Loader2 } from 'lucide-react';

// Sensor gauge component
const SensorGauge = ({ label, value, unit, status, icon: Icon, isLight }) => {
  const statusColors = {
    normal: 'text-emerald-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };

  return (
    <div className={`flex items-center justify-between p-2 rounded ${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${statusColors[status]}`} />
        <span className={`text-xs capitalize ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{label.replace('_', ' ')}</span>
      </div>
      <span className={`text-sm font-mono font-bold ${statusColors[status]}`}>
        {value} <span className="text-xs">{unit}</span>
      </span>
    </div>
  );
};

export default function MonitoringPage() {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await axios.get(`${API}/assets`, { withCredentials: true });
        setAssets(response.data);
        
        if (response.data.length === 0) {
          await axios.post(`${API}/seed`, {}, { withCredentials: true });
          const seededResponse = await axios.get(`${API}/assets`, { withCredentials: true });
          setAssets(seededResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // Initialize Cesium
  useEffect(() => {
    if (loading || !cesiumContainerRef.current) return;

    let isMounted = true;

    const initCesium = async () => {
      try {
        const Cesium = await import('cesium');
        await import('cesium/Build/Cesium/Widgets/widgets.css');
        
        const token = process.env.REACT_APP_CESIUM_ION_TOKEN;
        if (token) {
          Cesium.Ion.defaultAccessToken = token;
        }

        window.CESIUM_BASE_URL = '/cesium/';

        if (!isMounted || !cesiumContainerRef.current) return;

        // Create viewer
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
          navigationInstructionsInitiallyVisible: false,
          scene3DOnly: true,
          skyBox: false,
          skyAtmosphere: new Cesium.SkyAtmosphere(),
        });

        // Dark globe styling
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0f172a');
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1e293b');
        viewer.scene.globe.enableLighting = false;
        
        // Set initial view to Netherlands
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(5.5, 52.2, 500000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-60),
            roll: 0,
          },
        });

        // Add markers for each asset
        assets.forEach((asset) => {
          const color = asset.status === 'critical' ? Cesium.Color.fromCssColorString('#ef4444') :
                       asset.status === 'warning' ? Cesium.Color.fromCssColorString('#f59e0b') :
                       asset.status === 'maintenance' ? Cesium.Color.fromCssColorString('#a855f7') : 
                       Cesium.Color.fromCssColorString('#22c55e');
          
          viewer.entities.add({
            id: asset.asset_id,
            name: asset.name,
            position: Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, 0),
            point: {
              pixelSize: 18,
              color: color,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 3,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            label: {
              text: asset.name,
              font: '14px "Public Sans", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -25),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 300000),
            },
          });
        });

        // Click handler
        viewer.screenSpaceEventHandler.setInputAction((click) => {
          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject) && pickedObject.id) {
            const asset = assets.find(a => a.asset_id === pickedObject.id.id);
            if (asset) {
              setSelectedAsset(asset);
              // Fly to asset
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, 80000),
                orientation: {
                  heading: Cesium.Math.toRadians(0),
                  pitch: Cesium.Math.toRadians(-45),
                  roll: 0,
                },
                duration: 1.5,
              });
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        viewerRef.current = viewer;
        setMapLoading(false);

      } catch (err) {
        console.error('Failed to initialize Cesium:', err);
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
  }, [loading, assets]);

  // Fetch live sensor data for selected asset
  useEffect(() => {
    if (!selectedAsset) return;

    const fetchSensorData = async () => {
      try {
        const response = await axios.get(
          `${API}/sensors/live/${selectedAsset.asset_id}`,
          { withCredentials: true }
        );
        setSensorData(response.data.sensors);
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 3000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Zoom controls
  const handleZoomIn = () => {
    if (viewerRef.current) {
      viewerRef.current.camera.zoomIn(viewerRef.current.camera.positionCartographic.height * 0.3);
    }
  };

  const handleZoomOut = () => {
    if (viewerRef.current) {
      viewerRef.current.camera.zoomOut(viewerRef.current.camera.positionCartographic.height * 0.5);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/assets`, { withCredentials: true });
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetView = () => {
    if (viewerRef.current) {
      const Cesium = window.Cesium || require('cesium');
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(5.5, 52.2, 500000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0,
        },
        duration: 1.5,
      });
      setSelectedAsset(null);
    }
  };

  const statusColors = {
    operational: 'bg-emerald-500',
    maintenance: 'bg-purple-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500'
  };

  const statusIcons = {
    operational: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    maintenance: <Clock className="w-4 h-4 text-purple-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    critical: <AlertTriangle className="w-4 h-4 text-red-400" />
  };

  const sensorIcons = {
    water_level: Waves,
    pressure: Gauge,
    temperature: Thermometer,
    vibration: Activity,
    wind_speed: Wind
  };

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className={`font-mono text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading infrastructure data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`} data-testid="monitoring-page">
      {/* Header */}
      <div className={`flex-shrink-0 px-6 py-4 border-b ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-heading font-bold tracking-tight uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
              KAART
            </h1>
            <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Geografisch overzicht van meetpunten en assets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className={`h-9 w-9 p-0 ${isLight ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'}`}
              data-testid="zoom-in-btn"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className={`h-9 w-9 p-0 ${isLight ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'}`}
              data-testid="zoom-out-btn"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className={`gap-2 ${isLight ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'}`}
              data-testid="refresh-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Vernieuwen
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative">
          {/* Cesium Container */}
          <div 
            ref={cesiumContainerRef}
            className="absolute inset-0 w-full h-full"
            style={{ background: '#0f172a' }}
            data-testid="cesium-map-container"
          />

          {/* Map Loading Overlay */}
          {mapLoading && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-400 font-mono text-sm">Initializing 3D Globe...</p>
              </div>
            </div>
          )}

          {/* Legend - Bottom Left */}
          <div className="absolute bottom-6 left-6 z-20" data-testid="map-legend">
            <div className={`backdrop-blur-sm border rounded-lg p-4 min-w-[160px] ${isLight ? 'bg-white/95 border-slate-200 shadow-lg' : 'bg-slate-900/95 border-slate-700'}`}>
              <h3 className={`text-xs font-mono uppercase tracking-widest mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Legenda
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Normaal</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Waarschuwing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Kritiek</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Onderhoud</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reset View Button - Bottom Right */}
          <div className="absolute bottom-6 right-6 z-20">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              className={`backdrop-blur-sm gap-2 ${isLight ? 'bg-white/95 border-slate-200 hover:bg-slate-100 text-slate-700 shadow-lg' : 'bg-slate-900/95 border-slate-700 hover:bg-slate-800 text-white'}`}
              data-testid="reset-view-btn"
            >
              <Navigation className="w-4 h-4" />
              Reset View
            </Button>
          </div>

          {/* Cesium Attribution */}
          <div className="absolute bottom-2 right-2 z-10 text-xs text-slate-500">
            Cesium | © Cesium GS
          </div>
        </div>

        {/* Right Sidebar - Location Details */}
        <div className={`w-80 flex-shrink-0 border-l overflow-y-auto ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`} data-testid="location-details-panel">
          <div className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-500" />
              <h2 className={`font-heading font-bold text-sm uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Locatie Details
              </h2>
            </div>
          </div>

          {selectedAsset ? (
            <div className="p-4 space-y-4">
              {/* Asset Header */}
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded-full mt-1 ${statusColors[selectedAsset.status]}`} />
                <div className="flex-1">
                  <h3 className={`font-bold text-lg leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedAsset.name}</h3>
                  <p className={`text-xs font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{selectedAsset.asset_id}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {statusIcons[selectedAsset.status]}
                <span className={`text-sm capitalize ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{selectedAsset.status}</span>
              </div>

              {/* Location */}
              <div className={`rounded-lg p-3 ${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}`}>
                <p className={`text-xs uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Locatie</p>
                <p className={`text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedAsset.location}</p>
                <p className={`text-xs font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {selectedAsset.latitude.toFixed(4)}°N, {selectedAsset.longitude.toFixed(4)}°E
                </p>
              </div>

              {/* Health Score */}
              <div className={`rounded-lg p-3 ${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gezondheid Score</p>
                  <span className="text-lg font-bold text-cyan-400">{selectedAsset.health_score}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
                  <div 
                    className={`h-full transition-all duration-500 ${
                      selectedAsset.health_score >= 80 ? 'bg-emerald-500' :
                      selectedAsset.health_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${selectedAsset.health_score}%` }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-3 ${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}`}>
                  <p className={`text-xs uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Laatste Inspectie</p>
                  <div className="flex items-center gap-1">
                    <Calendar className={`w-3 h-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span className={`text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {new Date(selectedAsset.last_inspection).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>
                <div className={`rounded-lg p-3 ${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}`}>
                  <p className={`text-xs uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Volgend Onderhoud</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-500" />
                    <span className={`text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {new Date(selectedAsset.next_maintenance).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Sensor Data */}
              {sensorData && (
                <div className={`rounded-lg p-3 ${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
                    <p className={`text-xs uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Live Sensor Data</p>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(sensorData).map(([key, data]) => {
                      const Icon = sensorIcons[key] || Activity;
                      return (
                        <SensorGauge
                          key={key}
                          label={key}
                          value={data.value}
                          unit={data.unit}
                          status={data.status}
                          icon={Icon}
                          isLight={isLight}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                <Navigation className={`w-8 h-8 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              </div>
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Klik op een locatie op de kaart voor details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
