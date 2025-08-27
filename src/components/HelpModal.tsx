import React from 'react';
import { X, Info, Calendar, Filter, FileText, AlertTriangle } from 'lucide-react';

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
                  Activiteiten die meerdere weken duren. Deze worden ingeklapt weergegeven om de overzichtelijkheid te behouden.
                  Klik op het driehoekje om ze uit te klappen of gebruik de "Toon alle doorlopende activiteiten" knop.
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
                  Filter op P, H1, H2/3 of algemene activiteiten. Klik op de gekleurde pillen om specifieke fases te tonen.
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
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
                    <span>Waarderen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                    <span>Juniorstage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                    <span>IPL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-300 rounded-full"></div>
                    <span>BVP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pink-300 rounded-full"></div>
                    <span>PZW</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-300 rounded-full"></div>
                    <span>Minor</span>
                  </div>
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
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Deadlines
                </h4>
                <div className="text-sm space-y-1">
                  <p className="text-red-800">
                    Valt de einddatum in deze week, dan licht de einddatum op (rood, pulserend) en krijgt de footer van de kaart een rode achtergrond.
                  </p>
                  <p className="text-gray-700">
                    De kolom "Deadline" wordt momenteel niet actief gebruikt. Eventuele tekst in deze kolom wordt wel getoond op de kaart.
                  </p>
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