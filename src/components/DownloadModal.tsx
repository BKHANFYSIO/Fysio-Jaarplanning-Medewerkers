import React from 'react';
import { X, Download, FileText, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  filteredItemsCount: number;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ 
  isOpen, 
  onClose, 
  onDownload, 
  filteredItemsCount 
}) => {
  const [showInstructions, setShowInstructions] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Activiteiten Downloaden</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Info over huidige selectie */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-1">Huidige Selectie</h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Je gaat <strong>{filteredItemsCount} activiteiten</strong> downloaden op basis van je huidige filterinstellingen.
                  {filteredItemsCount === 0 && (
                    <span className="block mt-2 text-orange-600 dark:text-orange-400">
                      ⚠️ Geen activiteiten gevonden. Pas je filters aan om activiteiten te selecteren.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Download instructies */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">Wat krijg je?</h4>
            <p className="text-green-800 dark:text-green-200 text-sm mb-3">
              Een Excel bestand met alle relevante activiteiten die je kunt bewerken en terugsturen naar de beheerders.
            </p>
            <div className="bg-white dark:bg-slate-800 p-3 rounded border border-green-200 dark:border-green-700">
              <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                <strong>Het bestand bevat:</strong>
              </p>
              <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li>Alle activiteiten die voldoen aan je huidige filters</li>
                <li>Status kolom voor change tracking</li>
                <li>Gewijzigd door kolom voor audit trail</li>
                <li>Opmerkingen kolom voor feedback</li>
              </ul>
            </div>
          </div>

          {/* Bewerkingsinstructies - Inklapbaar */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900 dark:text-slate-100">Bewerkingsinstructies</span>
              </div>
              {showInstructions ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {showInstructions && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-slate-700">
                <div className="pt-4 space-y-4">
                  {/* Status kolom */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Status Kolom</h5>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      Gebruik deze kolom om aan te geven wat je hebt gewijzigd:
                    </p>
                    <ul className="text-blue-800 dark:text-blue-200 text-sm mt-2 space-y-1 list-disc list-inside">
                      <li><strong>"Nieuw"</strong> - voor nieuwe activiteiten die je toevoegt</li>
                      <li><strong>"Bewerkt"</strong> - voor bestaande activiteiten die je wijzigt</li>
                      <li><strong>Leeg laten</strong> - voor activiteiten die ongewijzigd blijven</li>
                    </ul>
                  </div>

                  {/* Gewijzigd door kolom */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <h5 className="font-medium text-green-900 dark:text-green-200 mb-2">Gewijzigd door Kolom</h5>
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      Vul hier je naam of rol in (bijv. "Docent A", "CC", "Studenten").
                    </p>
                  </div>

                  {/* Opmerkingen kolom */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                    <h5 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">Opmerkingen Kolom</h5>
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      Voeg hier eventuele opmerkingen toe over je wijzigingen of nieuwe activiteiten.
                    </p>
                  </div>

                  {/* Instructies en Links kolommen */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                    <h5 className="font-medium text-purple-900 dark:text-purple-200 mb-2">Instructies & Links Kolommen</h5>
                    <div className="text-purple-800 dark:text-purple-200 text-sm space-y-2">
                      <p><strong>Instructies kolom:</strong> Voeg hier een URL toe naar documentatie of instructies.</p>
                      <p><strong>Links kolom:</strong> Gebruik het formaat <code>Titel: URL</code>. Voor meerdere links: <code>Titel1: URL1, Titel2: URL2</code></p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        💡 Tip: URL's moeten beginnen met http:// of https://
                      </p>
                    </div>
                  </div>

                  {/* Waarschuwingen */}
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <h5 className="font-medium text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Belangrijke Waarschuwingen
                    </h5>
                    <ul className="text-red-800 dark:text-red-200 text-sm space-y-1 list-disc list-inside">
                      <li>Rol en Onderwerp moeten <strong>exact</strong> overeenkomen met bestaande waarden</li>
                      <li>Datum formaat: <strong>dd-mm-yyyy</strong> (bijv. 15-09-2024)</li>
                      <li>Tijd formaat: <strong>hh:mm</strong> (bijv. 09:00)</li>
                      <li>Fase kolommen: gebruik <strong>v</strong> voor actief, leeg voor inactief</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terugsturen instructies */}
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-2">Na Bewerking</h4>
            <p className="text-gray-700 dark:text-slate-300 text-sm">
              Stuur het bewerkte Excel bestand naar de beheerders per email. 
              Zij zullen de wijzigingen controleren en verwerken in het systeem.
            </p>
          </div>
        </div>

        {/* Footer met download knop */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={onDownload}
              disabled={filteredItemsCount === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Excel ({filteredItemsCount} activiteiten)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
