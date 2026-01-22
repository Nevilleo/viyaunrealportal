import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { useAuth } from '../../App';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Filter,
  Check,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const { user } = useAuth();

  const canResolve = user?.role === 'admin' || user?.role === 'manager';

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts`, { withCredentials: true });
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.put(`${API}/alerts/${alertId}/acknowledge`, {}, { withCredentials: true });
      toast.success('Alert bevestigd');
      fetchAlerts();
    } catch (error) {
      toast.error('Actie mislukt');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await axios.put(`${API}/alerts/${alertId}/resolve`, {}, { withCredentials: true });
      toast.success('Alert opgelost');
      fetchAlerts();
    } catch (error) {
      toast.error('Actie mislukt');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    return matchesStatus && matchesSeverity;
  });

  const severityColors = {
    low: 'border-l-emerald-500 bg-emerald-500/5',
    medium: 'border-l-yellow-500 bg-yellow-500/5',
    high: 'border-l-orange-500 bg-orange-500/5',
    critical: 'border-l-red-500 bg-red-500/5'
  };

  const severityBadges = {
    low: 'bg-emerald-500/20 text-emerald-500',
    medium: 'bg-yellow-500/20 text-yellow-500',
    high: 'bg-orange-500/20 text-orange-500',
    critical: 'bg-red-500/20 text-red-500'
  };

  const statusIcons = {
    active: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    acknowledged: <Clock className="w-5 h-5 text-blue-500" />,
    resolved: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
  };

  const typeLabels = {
    predictive: 'Predictief',
    warning: 'Waarschuwing',
    critical: 'Kritiek'
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 min-h-screen flex items-center justify-center">
        <Bell className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;

  return (
    <div className="p-6 lg:p-8 grid-bg min-h-screen" data-testid="alerts-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight uppercase mb-2">
          Predictive <span className="text-primary">Alerts</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          {activeCount} actief • {acknowledgedCount} bevestigd • {filteredAlerts.length} totaal weergegeven
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{alerts.filter(a => a.severity === 'critical').length}</p>
              <p className="text-xs font-mono text-muted-foreground">KRITIEK</p>
            </div>
          </div>
        </div>
        <div className="glass p-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{alerts.filter(a => a.severity === 'high').length}</p>
              <p className="text-xs font-mono text-muted-foreground">HOOG</p>
            </div>
          </div>
        </div>
        <div className="glass p-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{alerts.filter(a => a.severity === 'medium').length}</p>
              <p className="text-xs font-mono text-muted-foreground">MEDIUM</p>
            </div>
          </div>
        </div>
        <div className="glass p-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{alerts.filter(a => a.status === 'resolved').length}</p>
              <p className="text-xs font-mono text-muted-foreground">OPGELOST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48 bg-slate-950/50 border-white/10 rounded-sm" data-testid="filter-status">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Actief</SelectItem>
              <SelectItem value="acknowledged">Bevestigd</SelectItem>
              <SelectItem value="resolved">Opgelost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full md:w-48 bg-slate-950/50 border-white/10 rounded-sm" data-testid="filter-severity">
              <SelectValue placeholder="Ernst" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Ernst</SelectItem>
              <SelectItem value="critical">Kritiek</SelectItem>
              <SelectItem value="high">Hoog</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Laag</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="glass p-12 rounded-sm text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Geen alerts gevonden</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.alert_id}
              className={`glass p-6 rounded-sm border-l-4 ${severityColors[alert.severity]}`}
              data-testid={`alert-${alert.alert_id}`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {statusIcons[alert.status]}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading font-bold text-lg">{alert.title}</h3>
                      <span className={`px-2 py-0.5 rounded-sm text-xs font-mono uppercase ${severityBadges[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded-sm text-xs font-mono uppercase bg-white/10">
                        {typeLabels[alert.type]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      <span>Asset: {alert.asset_name}</span>
                      <span>•</span>
                      <span>{new Date(alert.created_at).toLocaleString('nl-NL')}</span>
                      {alert.status !== 'active' && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{alert.status}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {alert.status !== 'resolved' && (
                  <div className="flex items-center gap-2">
                    {alert.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.alert_id)}
                        className="rounded-sm"
                        data-testid={`acknowledge-${alert.alert_id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Bevestig
                      </Button>
                    )}
                    {canResolve && (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(alert.alert_id)}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-sm"
                        data-testid={`resolve-${alert.alert_id}`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Oplossen
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
