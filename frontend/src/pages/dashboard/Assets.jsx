import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { useAuth } from '../../App';
import { 
  Box, 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const { user } = useAuth();

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const [formData, setFormData] = useState({
    name: '',
    type: 'barrier',
    location: '',
    latitude: '',
    longitude: '',
    status: 'operational',
    health_score: 100
  });

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

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        health_score: parseInt(formData.health_score)
      };

      if (editingAsset) {
        await axios.put(`${API}/assets/${editingAsset.asset_id}`, data, { withCredentials: true });
        toast.success('Asset bijgewerkt');
      } else {
        await axios.post(`${API}/assets`, data, { withCredentials: true });
        toast.success('Asset aangemaakt');
      }

      setIsDialogOpen(false);
      setEditingAsset(null);
      resetForm();
      fetchAssets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Er ging iets mis');
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Weet u zeker dat u dit asset wilt verwijderen?')) return;
    
    try {
      await axios.delete(`${API}/assets/${assetId}`, { withCredentials: true });
      toast.success('Asset verwijderd');
      fetchAssets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Verwijderen mislukt');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'barrier',
      location: '',
      latitude: '',
      longitude: '',
      status: 'operational',
      health_score: 100
    });
  };

  const openEditDialog = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      location: asset.location,
      latitude: asset.latitude.toString(),
      longitude: asset.longitude.toString(),
      status: asset.status,
      health_score: asset.health_score
    });
    setIsDialogOpen(true);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const statusIcons = {
    operational: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    maintenance: <Clock className="w-4 h-4 text-purple-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    critical: <XCircle className="w-4 h-4 text-red-500" />
  };

  const typeLabels = {
    barrier: 'Waterkering',
    lock: 'Sluis',
    bridge: 'Brug',
    road: 'Weg'
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 min-h-screen flex items-center justify-center">
        <Box className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 grid-bg min-h-screen" data-testid="assets-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight uppercase mb-2">
            Asset <span className="text-primary">Management</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {filteredAssets.length} van {assets.length} assets
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              resetForm();
              setEditingAsset(null);
              setIsDialogOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest font-bold text-xs"
            data-testid="add-asset-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Asset
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken op naam of locatie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-950/50 border-white/10 rounded-sm"
              data-testid="search-input"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-40 bg-slate-950/50 border-white/10 rounded-sm" data-testid="filter-type">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Types</SelectItem>
              <SelectItem value="barrier">Waterkering</SelectItem>
              <SelectItem value="lock">Sluis</SelectItem>
              <SelectItem value="bridge">Brug</SelectItem>
              <SelectItem value="road">Weg</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-40 bg-slate-950/50 border-white/10 rounded-sm" data-testid="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="operational">Operationeel</SelectItem>
              <SelectItem value="maintenance">Onderhoud</SelectItem>
              <SelectItem value="warning">Waarschuwing</SelectItem>
              <SelectItem value="critical">Kritiek</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Asset</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Type</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Locatie</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Gezondheid</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Volgend Onderhoud</th>
                {canEdit && <th className="text-right p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Acties</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr 
                  key={asset.asset_id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  data-testid={`asset-row-${asset.asset_id}`}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{asset.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{asset.asset_id}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm capitalize">{typeLabels[asset.type] || asset.type}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm">{asset.location}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {statusIcons[asset.status]}
                      <span className="text-sm capitalize">{asset.status}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
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
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(asset.next_maintenance).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  </td>
                  {canEdit && (
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(asset)}
                          data-testid={`edit-${asset.asset_id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset.asset_id)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`delete-${asset.asset_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase tracking-tight">
              {editingAsset ? 'Asset Bewerken' : 'Nieuw Asset'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Naam</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="bg-slate-950/50 border-white/10 rounded-sm"
                data-testid="asset-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Type</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="bg-slate-950/50 border-white/10 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barrier">Waterkering</SelectItem>
                    <SelectItem value="lock">Sluis</SelectItem>
                    <SelectItem value="bridge">Brug</SelectItem>
                    <SelectItem value="road">Weg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="bg-slate-950/50 border-white/10 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operationeel</SelectItem>
                    <SelectItem value="maintenance">Onderhoud</SelectItem>
                    <SelectItem value="warning">Waarschuwing</SelectItem>
                    <SelectItem value="critical">Kritiek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Locatie</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
                className="bg-slate-950/50 border-white/10 rounded-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  required
                  className="bg-slate-950/50 border-white/10 rounded-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  required
                  className="bg-slate-950/50 border-white/10 rounded-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">
                Gezondheid Score: {formData.health_score}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.health_score}
                onChange={(e) => setFormData({...formData, health_score: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-sm"
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground rounded-sm"
                data-testid="save-asset-btn"
              >
                {editingAsset ? 'Bijwerken' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
