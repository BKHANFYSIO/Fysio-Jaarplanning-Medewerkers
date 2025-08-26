# Ontwikkelingsbanner Beheer

## Overzicht
Deze applicatie bevat een ontwikkelingsbanner die bezoekers informeert dat de app nog in ontwikkeling is.

## Locatie
De banner wordt getoond bovenaan elke pagina, net onder de browser tab maar boven de hoofdinhoud.

## Configuratie
De banner kan worden beheerd via het bestand: `src/config/development.ts`

### Instellingen
- `showDevelopmentBanner`: Zet dit op `false` om de banner volledig uit te schakelen
- `showDevelopmentMessages`: Zet dit op `false` om alle ontwikkelingsmeldingen uit te schakelen
- `bannerText`: Pas hier de tekst van de banner aan

### Voorbeeld
```typescript
export const developmentConfig = {
  showDevelopmentBanner: false, // Banner uitschakelen
  showDevelopmentMessages: false,
  bannerText: {
    title: "Aangepaste titel",
    description: "Aangepaste beschrijving"
  }
};
```

## Uitschakelen
Om de banner permanent uit te schakelen:

1. Open `src/config/development.ts`
2. Zet `showDevelopmentBanner` op `false`
3. Sla het bestand op
4. De wijziging wordt automatisch toegepast

## Gebruikerservaring
- De banner verdwijnt automatisch na 10 seconden
- Gebruikers kunnen de banner handmatig sluiten met het kruisje
- Na het sluiten wordt de banner niet meer getoond (opgeslagen in localStorage)
- De banner wordt alleen getoond bij nieuwe bezoekers

## Styling
De banner gebruikt Tailwind CSS klassen:
- Achtergrond: `bg-amber-50` (licht geel)
- Rand: `border-amber-200` (geel)
- Tekst: `text-amber-800` (donker geel)
- Icoon: `AlertTriangle` van Lucide React
