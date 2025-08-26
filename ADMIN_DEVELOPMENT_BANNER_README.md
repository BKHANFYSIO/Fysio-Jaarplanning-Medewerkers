# Admin: Ontwikkelingsbanner Beheer

## Overzicht
De admin pagina bevat nu een nieuwe sectie "Algemene Instellingen" waar je de ontwikkelingsbanner kunt beheren.

## Locatie
De nieuwe sectie bevindt zich naast de "Data Integriteit Status" sectie, in een twee-kolommen layout op grote schermen.

## Functies

### 1. Status Overzicht
- **Banner Status**: Toont of de banner zichtbaar of verborgen is
- **Meldingen Status**: Toont of ontwikkelingsmeldingen actief zijn
- **Voorvertoning**: Toont hoe de banner eruit ziet met de huidige instellingen

### 2. Instellingen Bewerken
Klik op de "Bewerken" knop om de instellingen aan te passen:

#### Checkboxes
- **Ontwikkelingsbanner tonen**: Schakelt de banner volledig in/uit
- **Ontwikkelingsmeldingen tonen**: Schakelt alle ontwikkelingsmeldingen in/uit

#### Tekst Bewerking
- **Banner Titel**: Pas de hoofdtitel van de banner aan
- **Banner Beschrijving**: Pas de beschrijvingstekst aan

### 3. Extra Functies
- **Reset Zichtbaarheid**: Reset de banner zichtbaarheid voor alle gebruikers
- **Voorvertoning**: Zie direct hoe wijzigingen eruit zien

## Gebruik

### Banner Uitschakelen
1. Ga naar de Admin pagina
2. Zoek de "Algemene Instellingen" sectie
3. Klik op "Bewerken"
4. Vink "Ontwikkelingsbanner tonen" uit
5. Klik op "Opslaan"

### Tekst Aanpassen
1. Klik op "Bewerken"
2. Pas de titel en/of beschrijving aan
3. Klik op "Opslaan"

### Banner Resetten voor Alle Gebruikers
1. Klik op "Bewerken"
2. Klik op "Reset Zichtbaarheid"
3. Bevestig de actie

## Technische Details

### Opslag
- Instellingen worden opgeslagen in localStorage
- Na het opslaan wordt de pagina automatisch herladen
- Alle gebruikers zien de wijzigingen onmiddellijk

### Synchronisatie
- De banner leest instellingen uit localStorage
- Wijzigingen zijn direct zichtbaar voor alle bezoekers
- Geen server-side opslag vereist (kan later worden toegevoegd)

## Layout

```
┌─────────────────────────────────┬─────────────────────────────────┐
│        Data Integriteit         │      Algemene Instellingen     │
│           Status                │                                │
│                                 │  • Banner Status               │
│  • Wees-activiteiten           │  • Meldingen Status            │
│  • Data validatie              │  • Tekst bewerken              │
│  • Probleem detectie           │  • Voorvertoning               │
└─────────────────────────────────┴─────────────────────────────────┘
```

## Toekomstige Uitbreidingen
- Opslaan van instellingen in Firestore
- Meerdere banner types
- Schema-gebaseerde validatie
- Audit log van wijzigingen
- Rollback functionaliteit

## Troubleshooting

### Banner wordt niet getoond
1. Controleer of "Ontwikkelingsbanner tonen" is aangevinkt
2. Controleer of de gebruiker de banner al heeft gesloten
3. Gebruik "Reset Zichtbaarheid" om dit op te lossen

### Wijzigingen worden niet opgeslagen
1. Controleer of je op "Opslaan" hebt geklikt
2. Controleer de browser console voor fouten
3. Probeer de pagina te verversen

### Banner tekst wordt niet bijgewerkt
1. Wacht tot de pagina automatisch herlaadt
2. Ververs handmatig als dit niet gebeurt
3. Controleer of de wijzigingen zijn opgeslagen
