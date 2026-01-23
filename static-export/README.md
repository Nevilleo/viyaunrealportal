# Digital Delta - Static HTML/CSS Export

Dit is een statische HTML/CSS versie van de Digital Delta applicatie. U kunt deze bestanden direct openen in een webbrowser of bewerken in Visual Studio Code.

## Bestanden

### Statische HTML/CSS Versie (Direct te openen)
```
static-export/
├── styles.css         # Complete CSS stylesheet
├── index.html         # Landing page
├── login.html         # Login pagina
├── dashboard.html     # Dashboard overzicht
├── vehicle.html       # LCM Voertuig pagina
├── monitoring.html    # Kaart/Monitoring pagina
└── settings.html      # Instellingen (met light mode)
```

### React Bronbestanden (Origineel)
```
frontend/src/
├── App.js                           # Hoofd component + routing
├── index.css                        # CSS variabelen + Tailwind
├── layouts/
│   └── DashboardLayout.jsx          # Sidebar layout
└── pages/
    ├── LandingPage.jsx              # Landing page
    ├── LoginPage.jsx                # Login pagina
    └── dashboard/
        ├── Overview.jsx             # Dashboard overzicht
        ├── Vehicle.jsx              # LCM Voertuig
        ├── Monitoring.jsx           # Kaart pagina
        └── Settings.jsx             # Instellingen
```

## Gebruik

### Statische HTML bestanden openen
1. Open de `static-export` folder in Visual Studio Code
2. Installeer de "Live Server" extensie (optioneel)
3. Open `index.html` en klik rechts → "Open with Live Server"
4. Of dubbelklik gewoon op `index.html` om in browser te openen

### Light/Dark Mode
De instellingen pagina (`settings.html`) heeft een werkende light mode toggle.
U kunt ook in de browser console typen: `toggleTheme()` om te wisselen.

## Technologie Stack

### Originele React App
- React 18
- React Router DOM
- Tailwind CSS
- Shadcn/UI componenten
- CesiumJS (3D kaart)
- FastAPI backend
- MongoDB database

### Statische Versie
- Pure HTML5
- CSS3 (met CSS Variables voor theming)
- Font Awesome icons
- Google Fonts (Barlow Condensed, Public Sans, JetBrains Mono)

## Opmerkingen

1. **3D Kaart**: De statische versie toont een gesimuleerde kaart. De originele React app gebruikt CesiumJS met een API key voor echte 3D visualisatie.

2. **Backend**: De statische versie heeft geen backend functionaliteit. Formulieren en login zijn alleen visueel.

3. **Responsiviteit**: De sidebar is geoptimaliseerd voor desktop. Voor mobile support is extra CSS nodig.

4. **Afbeeldingen**: Alle afbeeldingen worden geladen van externe URLs. Voor offline gebruik, download deze lokaal.

## Kleuren Referentie

| Kleur | HSL | Gebruik |
|-------|-----|---------|
| Primary (Cyan) | hsl(199, 89%, 48%) | Knoppen, links, accenten |
| Emerald | #22c55e | Succes, operational status |
| Amber | #f59e0b | Waarschuwingen |
| Red | #ef4444 | Fouten, kritiek |
| Purple | #a855f7 | Onderhoud status |

## Contact

Voor vragen over het project, neem contact op via het contactformulier op de landing page.

---
© 2025 Rijkswaterstaat - Digital Delta Platform
