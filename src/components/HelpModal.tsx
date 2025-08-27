import React from 'react';
import { X, Info, Calendar, Filter, FileText, AlertTriangle, Link } from 'lucide-react';
import { filterConfig } from '../config/filters';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Uitleg Jaarplanning Fysiotherapie</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Eerste keer melding */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Eerste bezoek</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Welkom! Deze uitleg wordt automatisch getoond bij je eerste bezoek. 
                  Daarna kun je de uitleg altijd opnieuw bekijken via de "Uitleg" knop rechtsboven in de app.
                </p>
              </div>
            </div>
          </div>

          {/* Welkom */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Welkom bij de Jaarplanning Fysiotherapie</h3>
            <p className="text-gray-700 leading-relaxed">
              Deze applicatie biedt een overzicht van alle activiteiten en deadlines voor de Fysiotherapie opleiding. 
              Hier vind je alles wat je moet weten over je studiejaar, van deadlines tot doorlopende activiteiten.
            </p>
          </section>

          {/* Navigatie */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Navigatie en Weergave
            </h3>
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Huidige Week</h4>
                <p className="text-green-800 text-sm">
                  De app toont automatisch de huidige week of de eerstvolgende week. 
                  Gebruik de "Ga naar huidige week" knop om snel naar de relevante periode te navigeren.
                  Je herkent de huidige week aan de <strong>groene markering</strong> en het groene label "Huidige week".
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Start- & Eindmomenten Activiteiten</h4>
                <p className="text-blue-800 text-sm">
                  Activiteiten die in deze week beginnen of eindigen. Deze worden altijd getoond en zijn niet inklapbaar.
                  Eindmomenten hebben een pulserende animatie om extra aandacht te trekken.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Doorlopende Activiteiten</h4>
                <p className="text-gray-700 text-sm">
                  Dit zijn activiteiten die meerdere weken beslaan. De <strong>tussenliggende weken</strong> worden compacter/ingeklapt getoond om het overzicht te bewaren.
                  De <strong>eerste</strong> en <strong>laatste</strong> week van zo’n activiteit worden duidelijk weergegeven (met start- en eindmoment) en zijn niet inklapbaar.
                  Klik op het driehoekje om een doorlopende activiteit open te klappen of gebruik de knop "Toon alle doorlopende activiteiten" om alles in één keer te openen.
                </p>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters en Zoeken
            </h3>
            <div className="space-y-3">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Studiefase Filter</h4>
                <p className="text-purple-800 text-sm">
                  Filter op <strong>P</strong>, <strong>H1</strong> of <strong>H2/3</strong>. Elke activiteit is altijd aan één of meerdere fases gekoppeld.
                </p>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Onderwerp Filter</h4>
                <p className="text-indigo-800 text-sm">
                  Filter op specifieke onderwerpen zoals BVP, PZW, Minor, IPL, Juniorstage, etc. 
                  De gekleurde stippen op elke kaart geven aan welke onderwerpen van toepassing zijn.
                </p>
              </div>
            </div>
          </section>

          {/* Activiteitenkaarten */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Activiteitenkaarten</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Kleurcodering</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {filterConfig
                    .find(cfg => cfg.id === 'subject')
                    ?.options.map(opt => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${opt.color}-300`}></div>
                        <span>{opt.label}</span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Instructies
                </h4>
                <p className="text-gray-700 text-sm">
                  Klik op "Instructies" om naar de bijbehorende documentatie of instructies te gaan. 
                  Deze link opent in een nieuw tabblad.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Links
                </h4>
                <p className="text-gray-700 text-sm">
                  Activiteiten kunnen ook één of meer links bevatten, bijvoorbeeld naar extra informatie of een inschrijfformulier. 
                  Links openen altijd in een nieuw tabblad. Bij meerdere links zie je "link 1", "link 2", enzovoort; de mouse-over toont de titel van de link.
                </p>
              </div>
              
              {/* Einddatums */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Einddatums
                </h4>
                <div className="text-sm space-y-3">
                  <p className="text-red-800">
                    Valt de <strong>einddatum</strong> in deze week, dan wordt de datum rood en pulserend weergegeven en krijgt de footer van de kaart een rode achtergrond.
                  </p>
                  <div className="mt-2 rounded border border-red-200 bg-red-100 px-3 py-2 inline-flex items-center gap-3">
                    <span className="flex items-center gap-1.5 font-semibold text-red-600">
                      <Calendar className="w-4 h-4" />
                      3-sep (10:00)
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-700">Voorbeeld: einddatum in deze week</span>
                  </div>
                </div>
              </div>

              {/* Deadlines (actie vereist) */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Deadlines (actie vereist)
                </h4>
                <div className="text-sm space-y-3">
                  <p className="text-gray-800">
                    Een <strong>deadline met actie vereist</strong> wordt extra benadrukt. Je ziet dan:
                  </p>
                  <ul className="list-disc ml-5 text-gray-800 space-y-1">
                    <li>Een duidelijk rood waarschuwing-icoon in de kaart-footer</li>
                    <li>Een tooltip met de tekst "Deadline (actie vereist)" wanneer je over het icoon beweegt</li>
                  </ul>
                  <div className="mt-2 rounded border border-red-200 bg-red-100 px-3 py-2 inline-flex items-center gap-3">
                    <span className="text-red-600 inline-flex items-center" title="Deadline (actie vereist)">
                      <AlertTriangle className="w-5 h-5 animate-heartbeat" />
                    </span>
                    <span className="text-gray-700">Voorbeeld: deadline met actie</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Handige Tips</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">•</span>
                <span>Gebruik de filters om specifieke activiteiten te vinden</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">•</span>
                <span>Klik op "Reset Filters" om alle filters te wissen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">•</span>
                <span>Doorlopende activiteiten kunnen in- en uitgeklapt worden</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">•</span>
                <span>De app werkt het beste op desktop voor optimale overzichtelijkheid</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Heb je vragen of opmerkingen? Neem contact op met de opleiding Fysiotherapie.
          </p>
        </div>
      </div>
    </div>
  );
}; 