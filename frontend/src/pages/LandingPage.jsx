import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import CesiumGlobe from '../components/CesiumGlobe';
import { 
  Database, Cpu, Globe2, Waves, Building2, ArrowRight, Menu, X, ChevronDown,
  Activity, Shield, Zap, Send, MapPin, Phone, Mail, LogIn
} from 'lucide-react';

// Navigation Component
const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#hero", label: "Home" },
    { href: "#features", label: "Technologie" },
    { href: "#use-cases", label: "Toepassingen" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "glass-strong py-3" : "bg-transparent py-6"}`} data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group" data-testid="logo-link">
            <div className="relative">
              <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center border border-primary/30">
                <Globe2 className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-secondary animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-lg tracking-tight text-foreground">DIGITAL DELTA</span>
              <span className="block text-xs font-mono text-muted-foreground tracking-widest">RIJKSWATERSTAAT</span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-mono tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors" data-testid={`nav-${link.label.toLowerCase()}`}>
                {link.label}
              </a>
            ))}
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 rounded-sm uppercase tracking-widest font-bold text-xs" data-testid="nav-dashboard-btn">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 rounded-sm uppercase tracking-widest font-bold text-xs" data-testid="nav-login-btn">
                  <LogIn className="w-4 h-4 mr-2" />
                  Inloggen
                </Button>
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} data-testid="mobile-menu-toggle">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-white/10">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="block py-3 text-sm font-mono tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link to={user ? "/dashboard" : "/login"} onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 rounded-sm uppercase tracking-widest font-bold text-xs">
                {user ? 'Dashboard' : 'Inloggen'}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

// Hero Section
const HeroSection = () => (
  <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
    <div className="absolute inset-0 z-0">
      <img 
        src="https://customer-assets.emergentagent.com/job_twin-vehicle-app/artifacts/jlhtjysw_LCM%20Minimalist%20Variant%203.png" 
        alt="LCM Vehicle"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background z-10" />
    </div>

    <div className="absolute inset-0 z-20 pointer-events-none">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-24 left-6 md:left-12 lg:left-24">
        <div className="flex items-center gap-2 text-xs font-mono text-primary/70">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>SYS_STATUS: NOMINAL</span>
        </div>
      </div>
      <div className="absolute top-24 right-6 md:right-12 lg:right-24 text-right">
        <div className="flex items-center gap-2 text-xs font-mono text-primary/70 justify-end">
          <span>DATA_STREAM: ACTIVE</span>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </div>

    <div className="relative z-30 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm glass mb-8 opacity-0 animate-fade-in-up">
        <Activity className="w-4 h-4 text-accent" />
        <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Powered by SAS Viya + Unreal Engine + Cesium</span>
      </div>

      <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tighter uppercase mb-6 opacity-0 animate-fade-in-up animate-delay-100">
        <span className="text-foreground">DIGITAL</span><br />
        <span className="text-gradient">TWIN</span><br />
        <span className="text-foreground">PLATFORM</span>
      </h1>

      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-body leading-relaxed opacity-0 animate-fade-in-up animate-delay-200">
        Real-time 3D visualisatie van Nederlandse infrastructuur met geavanceerde analytics en predictive maintenance.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up animate-delay-300">
        <Link to="/login">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 rounded-sm uppercase tracking-widest font-bold text-sm border-l-4 border-white/20 transition-all hover:pl-12 group" data-testid="hero-login-btn">
            <LogIn className="w-4 h-4 mr-2" />
            Inloggen
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <Button variant="outline" className="bg-transparent border border-primary/30 text-primary hover:bg-primary/10 h-14 px-10 rounded-sm uppercase tracking-widest font-bold text-sm backdrop-blur-sm" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} data-testid="hero-explore-btn">
          Ontdek Platform
        </Button>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in-up animate-delay-500">
        <a href="#features" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <span className="text-xs font-mono tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </a>
      </div>
    </div>
  </section>
);

// Feature Card
const FeatureCard = ({ icon: Icon, title, description, accent, large }) => (
  <div className={`relative p-6 md:p-8 glass rounded-sm hover:border-primary/50 transition-all duration-300 group overflow-hidden corner-brackets tracing-beam ${large ? "md:col-span-2 md:row-span-2" : ""}`}>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${accent}15 0%, transparent 70%)` }} />
    <div className="relative z-10">
      <div className="w-14 h-14 rounded-sm flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ backgroundColor: `${accent}20`, borderColor: `${accent}40` }}>
        <Icon className="w-7 h-7" style={{ color: accent }} />
      </div>
      <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground font-body leading-relaxed">{description}</p>
    </div>
  </div>
);

// Features Section
const FeaturesSection = () => {
  const features = [
    { icon: Database, title: "SAS Viya Analytics", description: "Geavanceerde data analytics en machine learning voor predictive maintenance. Real-time verwerking van sensor data en IoT streams.", accent: "#0ea5e9", large: true },
    { icon: Cpu, title: "Unreal Engine", description: "Fotorealistische 3D visualisaties en interactieve simulaties voor training.", accent: "#eab308" },
    { icon: Globe2, title: "Cesium Platform", description: "Wereldwijde geospatiale data integratie met millimeter precisie.", accent: "#22c55e" },
    { icon: Shield, title: "Enterprise Security", description: "Overheids-gecertificeerde beveiliging met BIO standaarden.", accent: "#0ea5e9" },
    { icon: Zap, title: "Real-time Processing", description: "Milliseconde latency voor kritieke infrastructuur monitoring.", accent: "#eab308" }
  ];

  return (
    <section id="features" className="py-24 md:py-32 relative" data-testid="features-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="text-center mb-16 md:mb-24">
          <span className="inline-block text-xs font-mono tracking-widest uppercase text-primary mb-4">Technologie Stack</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-6">
            NEXT-GEN <span className="text-gradient">INFRASTRUCTURE</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Een unieke combinatie van wereldklasse technologieën voor de meest geavanceerde digital twin oplossing.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => <FeatureCard key={index} {...feature} />)}
        </div>
      </div>
    </section>
  );
};

// Use Case Card
const UseCaseCard = ({ image, title, description, stats }) => (
  <div className="relative group overflow-hidden rounded-sm glass hover-lift" data-testid="use-case-card">
    <div className="relative h-48 md:h-56 overflow-hidden">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
    </div>
    <div className="p-6 md:p-8">
      <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground font-body mb-6 leading-relaxed">{description}</p>
      <div className="flex gap-6 pt-4 border-t border-white/10">
        {stats.map((stat, index) => (
          <div key={index}>
            <div className="text-2xl font-heading font-bold text-primary">{stat.value}</div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Use Cases Section
const UseCasesSection = () => {
  const useCases = [
    { image: "https://images.unsplash.com/photo-1500946692445-667e3f05df77?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", title: "Infrastructuur Monitoring", description: "Real-time monitoring van bruggen, sluizen en waterkeringen met predictive analytics.", stats: [{ value: "24/7", label: "Monitoring" }, { value: "99.9%", label: "Uptime" }] },
    { image: "https://images.pexels.com/photos/12200805/pexels-photo-12200805.jpeg?w=800", title: "Asset Lifecycle Management", description: "Volledig overzicht van de levenscyclus van alle assets met AI-gedreven planning.", stats: [{ value: "40%", label: "Besparing" }, { value: "2x", label: "Levensduur" }] },
    { image: "https://customer-assets.emergentagent.com/job_6ae21f61-41f1-4fe3-b686-c9b67c21c4f7/artifacts/uqgji9o1_LCM%20Minimalist%20Variant%203.png", title: "Mobile Field Operations", description: "Real-time data toegang voor veldwerkers met AR-ondersteuning.", stats: [{ value: "60%", label: "Efficiëntie" }, { value: "<1s", label: "Response" }] }
  ];

  return (
    <section id="use-cases" className="py-24 md:py-32 relative bg-muted/20" data-testid="use-cases-section">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="text-center mb-16 md:mb-24">
          <span className="inline-block text-xs font-mono tracking-widest uppercase text-secondary mb-4">Toepassingen</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-6">IMPACT <span className="text-gradient">IN ACTIE</span></h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Ontdek hoe onze digital twin oplossing de Nederlandse infrastructuur veiliger en efficiënter maakt.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {useCases.map((useCase, index) => <UseCaseCard key={index} {...useCase} />)}
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const [formData, setFormData] = useState({ name: "", email: "", organization: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/contact`, formData);
      toast.success("Bericht verzonden!", { description: "We nemen zo snel mogelijk contact met u op." });
      setFormData({ name: "", email: "", organization: "", message: "" });
    } catch (error) {
      toast.error("Er ging iets mis", { description: "Probeer het later opnieuw." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 relative" data-testid="contact-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          <div>
            <span className="inline-block text-xs font-mono tracking-widest uppercase text-primary mb-4">Contact</span>
            <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-6">START UW <span className="text-gradient">DIGITALE TRANSFORMATIE</span></h2>
            <p className="text-lg text-muted-foreground mb-12 leading-relaxed">Klaar om uw infrastructuur naar het volgende niveau te tillen? Neem contact met ons op voor een persoonlijke demo.</p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-primary" /></div>
                <div><div className="font-heading font-bold text-foreground mb-1">Locatie</div><div className="text-muted-foreground">Utrecht, Nederland</div></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-sm bg-secondary/10 flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5 text-secondary" /></div>
                <div><div className="font-heading font-bold text-foreground mb-1">Email</div><div className="text-muted-foreground">contact@digitaldelta.nl</div></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-accent" /></div>
                <div><div className="font-heading font-bold text-foreground mb-1">Telefoon</div><div className="text-muted-foreground">+31 (0)30 123 4567</div></div>
              </div>
            </div>
          </div>
          <div className="glass p-8 md:p-10 rounded-sm corner-brackets">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono tracking-widest uppercase text-muted-foreground mb-2">Naam *</label>
                <Input name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="bg-slate-950/50 border-white/10 focus:border-primary/50 rounded-sm h-12 font-body" placeholder="Uw naam" data-testid="contact-name-input" />
              </div>
              <div>
                <label className="block text-xs font-mono tracking-widest uppercase text-muted-foreground mb-2">Email *</label>
                <Input type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="bg-slate-950/50 border-white/10 focus:border-primary/50 rounded-sm h-12 font-body" placeholder="uw@email.nl" data-testid="contact-email-input" />
              </div>
              <div>
                <label className="block text-xs font-mono tracking-widest uppercase text-muted-foreground mb-2">Organisatie</label>
                <Input name="organization" value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} className="bg-slate-950/50 border-white/10 focus:border-primary/50 rounded-sm h-12 font-body" placeholder="Uw organisatie" />
              </div>
              <div>
                <label className="block text-xs font-mono tracking-widest uppercase text-muted-foreground mb-2">Bericht *</label>
                <Textarea name="message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required rows={4} className="bg-slate-950/50 border-white/10 focus:border-primary/50 rounded-sm font-body resize-none" placeholder="Vertel ons over uw project..." data-testid="contact-message-input" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-sm uppercase tracking-widest font-bold text-sm border-l-4 border-white/20 transition-all hover:pl-8 group" data-testid="contact-submit-btn">
                {isSubmitting ? "Verzenden..." : <><span>Verstuur Bericht</span><Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => (
  <footer className="py-12 border-t border-white/10" data-testid="footer">
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-primary/20 flex items-center justify-center border border-primary/30"><Globe2 className="w-4 h-4 text-primary" /></div>
          <span className="font-heading font-bold text-sm tracking-tight">DIGITAL DELTA</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground text-center">© 2025 Digital Delta Platform. In samenwerking met Rijkswaterstaat.</div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">Voorwaarden</a>
        </div>
      </div>
    </div>
  </footer>
);

// Main Landing Page
export default function LandingPage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <UseCasesSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
