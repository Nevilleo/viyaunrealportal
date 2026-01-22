import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import CesiumGlobe from '../../components/CesiumGlobe';
import { 
  X, 
  Waves, 
  Thermometer, 
  Wind, 
  Activity,
  MapPin,
  Calendar,
  Gauge
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const SensorGauge = ({ label, value, unit, status, icon: Icon }) => {
  const statusColors = {
    normal: 'text-emerald-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500'
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-sm border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground uppercase">{label}</span>
        <Icon className={`w-4 h-4 ${statusColors[status]}`} />
      </div>
      <p className={`text-2xl font-heading font-bold ${statusColors[status]}`}>
        {value}<span className="text-sm ml-1">{unit}</span>
      </p>
    </div>
  );
};

export default function MonitoringPage() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await axios.get(`${API}/assets`, { withCredentials: true });
        setAssets(response.data);
        
        // If no data, seed the database
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

  const handleMarkerClick = (assetId) => {
    const asset = assets.find(a => a.asset_id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setFlyTo({ latitude: asset.latitude, longitude: asset.longitude });
    }
  };

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setFlyTo({ latitude: asset.latitude, longitude: asset.longitude });
  };

  const statusColors = {
    operational: 'bg-emerald-500',
    maintenance: 'bg-purple-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  const sensorIcons = {
    water_level: Waves,
    pressure: Gauge,
    temperature: Thermometer,
    vibration: Activity,
    wind_speed: Wind
  };

  return (
    <div className="h-screen relative" data-testid="monitoring-page">
      {/* Full-screen Cesium Map */}
      <div className="absolute inset-0">
        <CesiumGlobe 
          markers={assets} 
          onMarkerClick={handleMarkerClick}
          flyTo={flyTo}
        />
      </div>

      {/* Asset List Panel */}
      <div className="absolute top-4 left-4 w-80 max-h-[calc(100vh-8rem)] glass rounded-sm overflow-hidden z-20" data-testid="asset-panel">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-heading font-bold text-lg uppercase tracking-tight">
            Infrastructuur
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            {assets.length} assets • Afsluitdijk regio
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {assets.map((asset) => (
            <button
              key={asset.asset_id}
              onClick={() => handleAssetSelect(asset)}
              className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${
                selectedAsset?.asset_id === asset.asset_id ? 'bg-primary/10' : ''
              }`}
              data-testid={`asset-list-${asset.asset_id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColors[asset.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{asset.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{asset.type}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{asset.health_score}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Status Legend */}
      <div className="absolute bottom-4 left-4 glass p-3 rounded-sm z-20">
        <div className="flex items-center gap-4 text-xs font-mono">
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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Kritiek</span>
          </div>
        </div>
      </div>

      {/* Asset Detail Panel */}
      {selectedAsset && (
        <div className="absolute top-4 right-4 w-96 glass rounded-sm z-20" data-testid="asset-detail-panel">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg">{selectedAsset.name}</h3>
              <p className="text-xs font-mono text-muted-foreground">{selectedAsset.asset_id}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAsset(null)}
              data-testid="close-detail-panel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`px-2 py-1 rounded-sm text-xs font-mono uppercase ${
                selectedAsset.status === 'operational' ? 'bg-emerald-500/20 text-emerald-500' :
                selectedAsset.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                selectedAsset.status === 'maintenance' ? 'bg-purple-500/20 text-purple-500' :
                'bg-red-500/20 text-red-500'
              }`}>
                {selectedAsset.status}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{selectedAsset.location}</span>
            </div>

            {/* Health Score */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Gezondheid Score</span>
                <span className="font-mono font-bold">{selectedAsset.health_score}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    selectedAsset.health_score >= 80 ? 'bg-emerald-500' :
                    selectedAsset.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${selectedAsset.health_score}%` }}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">Laatste Inspectie</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{new Date(selectedAsset.last_inspection).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">Volgend Onderhoud</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <span>{new Date(selectedAsset.next_maintenance).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>
            </div>

            {/* Live Sensor Data */}
            {sensorData && (
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                  Live Sensor Data
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(sensorData).map(([key, data]) => {
                    const Icon = sensorIcons[key] || Activity;
                    return (
                      <SensorGauge
                        key={key}
                        label={key.replace('_', ' ')}
                        value={data.value}
                        unit={data.unit}
                        status={data.status}
                        icon={Icon}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-30">
          <div className="text-center">
            <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground font-mono text-sm">Loading infrastructure data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
