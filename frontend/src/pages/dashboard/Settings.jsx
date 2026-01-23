import React from 'react';
import { useAuth, useTheme } from '../../App';
import { 
  User, 
  Mail, 
  Shield,
  Bell,
  Moon,
  Sun,
  Globe2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    veldwerker: 'Veldwerker'
  };

  return (
    <div className="p-6 lg:p-8 grid-bg min-h-screen" data-testid="settings-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight uppercase mb-2">
          Instellingen
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Beheer uw account en voorkeuren
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <div className="glass p-6 rounded-sm">
          <h2 className="font-heading font-bold text-lg uppercase tracking-tight mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profiel
          </h2>
          
          <div className="flex items-start gap-6">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-20 h-20 rounded-sm object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-sm bg-primary/20 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase mb-1">Naam</label>
                <p className="text-foreground font-medium">{user?.name}</p>
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-foreground">{user?.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase mb-1">Rol</label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="text-foreground">{roleLabels[user?.role] || user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass p-6 rounded-sm">
          <h2 className="font-heading font-bold text-lg uppercase tracking-tight mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificaties
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notificaties</p>
                <p className="text-sm text-muted-foreground">Ontvang alerts via email</p>
              </div>
              <Switch defaultChecked data-testid="email-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Kritieke Alerts</p>
                <p className="text-sm text-muted-foreground">Direct bericht bij kritieke situaties</p>
              </div>
              <Switch defaultChecked data-testid="critical-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Onderhouds Herinneringen</p>
                <p className="text-sm text-muted-foreground">Herinneringen voor gepland onderhoud</p>
              </div>
              <Switch defaultChecked data-testid="maintenance-reminders" />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="glass p-6 rounded-sm">
          <h2 className="font-heading font-bold text-lg uppercase tracking-tight mb-6 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            Weergave
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Light Mode</p>
                <p className="text-sm text-muted-foreground">Schakel over naar lichte weergave</p>
              </div>
              <Switch 
                checked={theme === 'light'} 
                onCheckedChange={() => {
                  toggleTheme();
                  toast.success(theme === 'dark' ? 'Light mode ingeschakeld' : 'Dark mode ingeschakeld');
                }}
                data-testid="light-mode-toggle" 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Compacte Weergave</p>
                <p className="text-sm text-muted-foreground">Meer informatie per scherm</p>
              </div>
              <Switch data-testid="compact-view" />
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="glass p-6 rounded-sm">
          <h2 className="font-heading font-bold text-lg uppercase tracking-tight mb-6 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-primary" />
            Taal & Regio
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Taal</label>
              <div className="flex items-center gap-2 p-3 bg-slate-950/50 border border-white/10 rounded-sm">
                <span className="text-lg">🇳🇱</span>
                <span>Nederlands</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Tijdzone</label>
              <div className="flex items-center gap-2 p-3 bg-slate-950/50 border border-white/10 rounded-sm">
                <span>Europe/Amsterdam (CET)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-sm uppercase tracking-widest font-bold"
          data-testid="save-settings"
        >
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
}
