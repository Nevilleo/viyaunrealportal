import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  PieChart
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

// Simple bar chart component
const SimpleBarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="glass p-6 rounded-sm">
      <h3 className="font-heading font-bold text-lg mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground w-24 truncate">{item.label}</span>
            <div className="flex-1 h-6 bg-slate-800 rounded-sm overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-sm font-mono w-12 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Donut chart component
const DonutChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  const colors = ['#22c55e', '#eab308', '#a855f7', '#ef4444'];
  
  return (
    <div className="glass p-6 rounded-sm">
      <h3 className="font-heading font-bold text-lg mb-4">{title}</h3>
      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const dashArray = `${percentage} ${100 - percentage}`;
              const dashOffset = 100 - cumulativePercentage;
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke={colors[index % colors.length]}
                  strokeWidth="3"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-heading font-bold">{total}</span>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [assets, setAssets] = useState([]);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, forecastRes, assetsRes] = await Promise.all([
          axios.get(`${API}/analytics/overview`, { withCredentials: true }),
          axios.get(`${API}/analytics/maintenance-forecast`, { withCredentials: true }),
          axios.get(`${API}/assets`, { withCredentials: true })
        ]);
        setAnalytics(analyticsRes.data);
        setForecast(forecastRes.data);
        setAssets(assetsRes.data);
      } catch (error) {
        console.error('Failed to fetch reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 min-h-screen flex items-center justify-center">
        <BarChart3 className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  const statusData = analytics?.status_distribution ? [
    { label: 'Operationeel', value: analytics.status_distribution.operational || 0 },
    { label: 'Waarschuwing', value: analytics.status_distribution.warning || 0 },
    { label: 'Onderhoud', value: analytics.status_distribution.maintenance || 0 },
    { label: 'Kritiek', value: analytics.status_distribution.critical || 0 }
  ] : [];

  const typeData = assets.reduce((acc, asset) => {
    const existing = acc.find(item => item.label === asset.type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ label: asset.type, value: 1 });
    }
    return acc;
  }, []);

  const healthRanges = [
    { label: '90-100%', value: assets.filter(a => a.health_score >= 90).length },
    { label: '70-89%', value: assets.filter(a => a.health_score >= 70 && a.health_score < 90).length },
    { label: '50-69%', value: assets.filter(a => a.health_score >= 50 && a.health_score < 70).length },
    { label: '<50%', value: assets.filter(a => a.health_score < 50).length }
  ];

  return (
    <div className="p-6 lg:p-8 grid-bg min-h-screen" data-testid="reports-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight uppercase mb-2">
            Rapportages & <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Inzichten en statistieken van uw infrastructuur
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 bg-slate-950/50 border-white/10 rounded-sm">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Laatste 7 dagen</SelectItem>
              <SelectItem value="30">Laatste 30 dagen</SelectItem>
              <SelectItem value="90">Laatste 90 dagen</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-sm" data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Exporteer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Totaal Assets</span>
          </div>
          <p className="text-3xl font-heading font-bold">{analytics?.total_assets || 0}</p>
        </div>
        <div className="glass p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Gem. Gezondheid</span>
          </div>
          <p className="text-3xl font-heading font-bold text-emerald-500">{analytics?.average_health_score || 0}%</p>
        </div>
        <div className="glass p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-2">
            <PieChart className="w-5 h-5 text-yellow-500" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Actieve Alerts</span>
          </div>
          <p className="text-3xl font-heading font-bold text-yellow-500">{analytics?.active_alerts || 0}</p>
        </div>
        <div className="glass p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Gepland Onderhoud</span>
          </div>
          <p className="text-3xl font-heading font-bold text-purple-500">{forecast?.total_scheduled || 0}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DonutChart data={statusData} title="Status Verdeling" />
        <DonutChart data={typeData} title="Asset Types" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SimpleBarChart data={healthRanges} title="Gezondheid Verdeling" />
        
        {/* Maintenance Forecast */}
        <div className="glass p-6 rounded-sm">
          <h3 className="font-heading font-bold text-lg mb-4">Onderhouds Forecast (30 dagen)</h3>
          {forecast?.forecast?.length > 0 ? (
            <div className="space-y-3">
              {forecast.forecast.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-sm border-l-4 ${
                    item.priority === 'high' ? 'border-l-red-500 bg-red-500/5' : 'border-l-blue-500 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.asset_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">
                        {new Date(item.scheduled_date).toLocaleDateString('nl-NL')}
                      </p>
                      <span className={`text-xs uppercase ${item.priority === 'high' ? 'text-red-500' : 'text-blue-500'}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              Geen gepland onderhoud in de komende 30 dagen
            </p>
          )}
        </div>
      </div>

      {/* Asset Health Table */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-heading font-bold text-lg">Asset Gezondheid Overzicht</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Asset</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Type</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Status</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Gezondheid</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Trend</th>
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, 10).map((asset) => (
                <tr key={asset.asset_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <p className="font-medium">{asset.name}</p>
                  </td>
                  <td className="p-4 capitalize">{asset.type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-sm text-xs font-mono uppercase ${
                      asset.status === 'operational' ? 'bg-emerald-500/20 text-emerald-500' :
                      asset.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                      asset.status === 'maintenance' ? 'bg-purple-500/20 text-purple-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            asset.health_score >= 80 ? 'bg-emerald-500' :
                            asset.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${asset.health_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono">{asset.health_score}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <TrendingUp className={`w-4 h-4 ${
                      asset.health_score >= 80 ? 'text-emerald-500' : 'text-yellow-500 rotate-180'
                    }`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
