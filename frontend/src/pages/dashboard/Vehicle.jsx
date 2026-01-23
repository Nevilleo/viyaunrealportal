import React, { useState } from 'react';
import { useTheme } from '../../App';
import { 
  Car, 
  Eye, 
  Cpu, 
  Droplets, 
  Radio, 
  Brain, 
  MessageSquare, 
  Shield, 
  Leaf,
  Camera,
  Gauge,
  AlertTriangle,
  Navigation,
  Thermometer,
  Wind,
  Waves,
  Satellite,
  Activity,
  ChevronRight,
  RotateCcw,
  Truck
} from 'lucide-react';
import { Button } from '../../components/ui/button';

// Vehicle images
const VEHICLE_IMAGES = {
  realistic: {
    side: 'https://customer-assets.emergentagent.com/job_viya-unreal-portal/artifacts/m5mzf65b_LCM%20Minimalist%20Variant%203.png',
  },
  schematic: {
    perspective: 'https://customer-assets.emergentagent.com/job_viya-unreal-portal/artifacts/c6pu2sjr_LCM%20Truck%20-%20Perspective%20View.png',
    front: 'https://customer-assets.emergentagent.com/job_viya-unreal-portal/artifacts/osg1fgv4_LCM%20Truck%20-%20Front%20View.png',
    side: 'https://customer-assets.emergentagent.com/job_viya-unreal-portal/artifacts/bn2btzqc_LCM%20Pickup%20Truck%20-%20Minimalist%20Clean%20%281%29.png',
  },
  sections: {
    hud: 'https://customer-assets.emergentagent.com/job_twin-vehicle-app/artifacts/0bts72yf_HUD.png',
  }
};

// Info sections data
const INFO_SECTIONS = [
  {
    id: 'voertuig',
    icon: Truck,
    title: 'Voertuig',
    subtitle: 'LCM Inspectie Voertuig - Rijkswaterstaat',
    color: 'amber',
    isVehicleOverview: true,
    items: [
      {
        title: 'Voertuig Specificaties',
        details: ['Mercedes X-Klasse pickup', 'Volledig uitgerust inspectieplatform', 'Elektrisch / Waterstof aandrijving']
      },
      {
        title: 'Hoofdfuncties',
        details: ['Rijdend meetstation', 'Digital Twin koppeling', 'Real-time data streaming', 'Calamiteiten ondersteuning']
      },
      {
        title: 'Inzetgebied',
        details: ['Dijkinspecties', 'Watermonitoring', 'Wegonderhoud', 'Infrastructuur controle']
      }
    ]
  },
  {
    id: 'hud',
    icon: Eye,
    title: 'HUD & Bestuurdersinterface',
    subtitle: 'Alles zichtbaar zonder blik van de weg te halen',
    color: 'cyan',
    items: [
      {
        title: 'Augmented Reality HUD',
        details: ['Waterstanden, stroming en peiltrends geprojecteerd op de weg', 'Risicozones (overstroming, verzakking) in kleuroverlay']
      },
      {
        title: 'Live Navigatie (RWS-specifiek)',
        details: ['Routes afgestemd op wegafsluitingen', 'Water op het wegdek', 'Dijkinspecties']
      },
      {
        title: 'Realtime waarschuwingen',
        details: ['Drempelwaarden (kritische waterhoogte)', 'Sensor-alerts (rood/oranje/groen)']
      }
    ]
  },
  {
    id: 'water',
    icon: Droplets,
    title: 'Water & Omgevingsmonitoring',
    subtitle: 'Core RWS-taak - Sterk doorontwikkeld',
    color: 'blue',
    items: [
      {
        title: 'Waterkwaliteit',
        details: ['pH, zuurstof, troebelheid', 'Detectie van olie, chemische stoffen']
      },
      {
        title: 'Waterstand & Hydrologie',
        details: ['Koppeling met NAP', 'Peilschalen, gemalen & sluizen']
      },
      {
        title: 'Neerslag & Wolkbreukdetectie',
        details: ['Radar + lokale sensoren', 'Voorspelling wateroverlast per straat']
      },
      {
        title: 'Zoutindringing',
        details: ['Vooral relevant bij kust en rivieren']
      }
    ]
  },
  {
    id: 'sensors',
    icon: Radio,
    title: 'Sensoren & Externe Hardware',
    subtitle: 'Het voertuig als rijdend meetstation',
    color: 'purple',
    items: [
      {
        title: '360° camera\'s',
        details: ['Dag + nacht opnames', 'Continue monitoring']
      },
      {
        title: 'LiDAR',
        details: ['Dijkvervorming detectie', 'Scheuren in asfalt']
      },
      {
        title: 'Grondwatersensoren',
        details: ['Lokale stijging / verzakking']
      },
      {
        title: 'Luchtkwaliteit',
        details: ['Fijnstof, NO₂, CO₂']
      },
      {
        title: 'Akoestische sensoren',
        details: ['Detectie van lekkages', 'Instabiele constructies']
      }
    ]
  },
  {
    id: 'digital-twin',
    icon: Cpu,
    title: 'Digital Twin & Data-integratie',
    subtitle: 'RWS Data & AI Lab - Hier wordt het echt innovatief',
    color: 'emerald',
    items: [
      {
        title: 'Live koppeling met RWS Digital Twin',
        details: ['Wegen', 'Waterkeringen', 'Bruggen en sluizen']
      },
      {
        title: '3D-viewer in het voertuig',
        details: ['Cesium/Unreal-achtige visualisatie']
      },
      {
        title: 'Scenario-modus',
        details: ['"Wat als de waterstand +50 cm stijgt?"']
      },
      {
        title: 'Historische vergelijking',
        details: ['Nu vs vorige inspectie']
      }
    ]
  },
  {
    id: 'ai',
    icon: Brain,
    title: 'AI & Decision Support',
    subtitle: 'Van meten → begrijpen → handelen',
    color: 'amber',
    items: [
      {
        title: 'AI-voorspellingen',
        details: ['Kans op falen dijk/weg', 'Tijd tot kritieke situatie']
      },
      {
        title: 'Beslisadvies',
        details: ['Afsluiten?', 'Extra inspectie?', 'Opschalen naar calamiteit?']
      },
      {
        title: 'Automatische rapportage',
        details: ['Direct naar meldkamer', 'Dashboard', 'Inspectierapport']
      }
    ]
  },
  {
    id: 'communication',
    icon: MessageSquare,
    title: 'Communicatie & Samenwerking',
    subtitle: 'LCM als knooppunt in crisissituaties',
    color: 'rose',
    items: [
      {
        title: 'Live verbinding met',
        details: ['Verkeerscentrales', 'Waterschappen', 'Veiligheidsregio\'s']
      },
      {
        title: 'Push-to-talk + datakanalen',
        details: ['Directe communicatie']
      },
      {
        title: 'Drone-integratie',
        details: ['Starten vanaf voertuig', 'Live beeld in HUD']
      },
      {
        title: '5G / satelliet fallback',
        details: ['Werkt ook bij netwerkuitval']
      }
    ]
  },
  {
    id: 'safety',
    icon: Shield,
    title: 'Veiligheid & Ergonomie',
    subtitle: 'Ontworpen voor lange inzet',
    color: 'orange',
    items: [
      {
        title: 'Adaptieve verlichting',
        details: ['Automatisch bij mist / regen']
      },
      {
        title: 'Biometrische login',
        details: ['Persoonlijke HUD-profielen']
      },
      {
        title: 'Stress- & vermoeidheidsdetectie',
        details: ['Continue monitoring bestuurder']
      },
      {
        title: 'Calamiteitenmodus',
        details: ['Interface vereenvoudigd', 'Alleen kritische info zichtbaar']
      }
    ]
  },
  {
    id: 'sustainability',
    icon: Leaf,
    title: 'Duurzaamheid & Toekomst',
    subtitle: 'Passend bij RWS en overheid',
    color: 'green',
    items: [
      {
        title: 'Aandrijving',
        details: ['Elektrisch of waterstof']
      },
      {
        title: 'Energie',
        details: ['Zonnepanelen op dak', 'Energie-terugwinning']
      },
      {
        title: 'Modulair interieur',
        details: ['Inspectie / calamiteit / monitoring configuraties']
      }
    ]
  }
];

const colorClasses = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-500', glow: 'shadow-cyan-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', glow: 'shadow-blue-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', glow: 'shadow-purple-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', glow: 'shadow-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-500', glow: 'shadow-rose-500/20' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500', glow: 'shadow-orange-500/20' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', glow: 'shadow-green-500/20' },
};

export default function VehiclePage() {
  const [viewMode, setViewMode] = useState('realistic'); // realistic or schematic
  const [perspective, setPerspective] = useState('side'); // side, front, perspective
  const [activeSection, setActiveSection] = useState('voertuig');
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const currentImage = viewMode === 'realistic' 
    ? VEHICLE_IMAGES.realistic.side 
    : VEHICLE_IMAGES.schematic[perspective];

  const activeInfo = INFO_SECTIONS.find(s => s.id === activeSection);

  return (
    <div className={`h-screen flex flex-col ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`} data-testid="vehicle-page">
      {/* Header */}
      <div className={`flex-shrink-0 px-6 py-4 border-b ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-heading font-bold tracking-tight uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
              LCM <span className="text-cyan-500">Voertuig</span>
            </h1>
            <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Rijkswaterstaat Life Cycle Management Inspectie Voertuig
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className={`flex rounded-lg p-1 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
              <Button
                size="sm"
                variant={viewMode === 'realistic' ? 'default' : 'ghost'}
                onClick={() => setViewMode('realistic')}
                className={`h-8 px-3 text-xs ${viewMode === 'realistic' ? 'bg-cyan-600 text-white' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                data-testid="view-realistic"
              >
                Realistisch
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'schematic' ? 'default' : 'ghost'}
                onClick={() => setViewMode('schematic')}
                className={`h-8 px-3 text-xs ${viewMode === 'schematic' ? 'bg-cyan-600 text-white' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                data-testid="view-schematic"
              >
                Schematisch
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Category Navigation */}
        <div className={`w-64 flex-shrink-0 border-r overflow-y-auto p-4 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <h3 className={`text-xs font-mono uppercase tracking-widest mb-3 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Systemen</h3>
          <div className="space-y-1">
            {INFO_SECTIONS.map((section) => {
              const Icon = section.icon;
              const colors = colorClasses[section.color];
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    isActive 
                      ? `${colors.bg} ${colors.border} border` 
                      : isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                  }`}
                  data-testid={`nav-${section.id}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <span className={`text-sm font-medium ${isActive ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-600' : 'text-slate-400')}`}>
                    {section.title.split(' ')[0]}
                  </span>
                  {isActive && <ChevronRight className={`w-4 h-4 ml-auto ${colors.text}`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center - Vehicle Canvas */}
        <div className={`flex-1 relative ${isLight ? 'bg-gradient-to-b from-slate-200 to-slate-100' : 'bg-gradient-to-b from-slate-900 to-slate-950'}`}>
          {/* Perspective Controls (only for schematic) */}
          {viewMode === 'schematic' && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex backdrop-blur-sm rounded-lg p-1 ${isLight ? 'bg-white/90 shadow-md' : 'bg-slate-800/90'}`}>
              <Button
                size="sm"
                variant={perspective === 'perspective' ? 'default' : 'ghost'}
                onClick={() => setPerspective('perspective')}
                className={`h-8 px-4 text-xs ${perspective === 'perspective' ? 'bg-cyan-600 text-white' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                Perspectief
              </Button>
              <Button
                size="sm"
                variant={perspective === 'front' ? 'default' : 'ghost'}
                onClick={() => setPerspective('front')}
                className={`h-8 px-4 text-xs ${perspective === 'front' ? 'bg-cyan-600 text-white' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                Front
              </Button>
              <Button
                size="sm"
                variant={perspective === 'side' ? 'default' : 'ghost'}
                onClick={() => setPerspective('side')}
                className={`h-8 px-4 text-xs ${perspective === 'side' ? 'bg-cyan-600 text-white' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                Zijkant
              </Button>
            </div>
          )}

          {/* Vehicle Image */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full h-full max-w-4xl max-h-[500px] flex items-center justify-center">
              <img
                src={activeSection === 'hud' ? VEHICLE_IMAGES.sections.hud : currentImage}
                alt={activeSection === 'hud' ? 'HUD Interface' : 'LCM Voertuig'}
                className={`max-w-full max-h-full object-contain transition-all duration-500 ${
                  viewMode === 'realistic' && activeSection !== 'hud' ? 'drop-shadow-2xl' : ''
                }`}
                data-testid="vehicle-image"
              />
              
              {/* HUD Overlay indicators for realistic view */}
              {viewMode === 'realistic' && (
                <>
                  {/* Sensor indicators */}
                  <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                  <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                </>
              )}
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className={`absolute bottom-0 left-0 right-0 backdrop-blur-sm border-t p-4 ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'}`}>
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Status:</span>
                  <span className="text-sm font-medium text-emerald-500">Operationeel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-500" />
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sensoren:</span>
                  <span className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>24 Actief</span>
                </div>
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-purple-500" />
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Connectie:</span>
                  <span className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>5G + Satelliet</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Live Data Stream</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Info Panel */}
        <div className={`w-96 flex-shrink-0 border-l overflow-y-auto ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`} data-testid="info-panel">
          {activeInfo && (
            <>
              <div className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[activeInfo.color].bg}`}>
                    <activeInfo.icon className={`w-5 h-5 ${colorClasses[activeInfo.color].text}`} />
                  </div>
                  <div>
                    <h2 className={`font-heading font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeInfo.title}</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{activeInfo.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {activeInfo.items.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${colorClasses[activeInfo.color].bg} ${colorClasses[activeInfo.color].border}`}
                  >
                    <h3 className={`font-medium text-sm mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</h3>
                    <ul className="space-y-1">
                      {item.details.map((detail, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          <ChevronRight className={`w-3 h-3 mt-1 flex-shrink-0 ${colorClasses[activeInfo.color].text}`} />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Technical Specs */}
              <div className={`p-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <h3 className={`text-xs font-mono uppercase tracking-widest mb-3 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Technische Specificaties
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Voertuig Type</span>
                    <span className={isLight ? 'text-slate-900' : 'text-white'}>Mercedes X-Klasse</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Aandrijving</span>
                    <span className="text-emerald-500">Elektrisch / Waterstof</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Sensoren</span>
                    <span className={isLight ? 'text-slate-900' : 'text-white'}>24 stuks</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Data Connectie</span>
                    <span className={isLight ? 'text-slate-900' : 'text-white'}>5G + Satelliet</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
