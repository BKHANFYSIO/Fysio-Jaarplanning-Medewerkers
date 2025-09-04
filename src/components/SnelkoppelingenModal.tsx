import { X, ExternalLink } from 'lucide-react';
import { Snelkoppeling, SnelkoppelingenGroep } from '../hooks/useSnelkoppelingen';

interface SnelkoppelingenModalProps {
  isOpen: boolean;
  onClose: () => void;
  snelkoppelingen: Snelkoppeling[];
  groepen: SnelkoppelingenGroep[];
}

export const SnelkoppelingenModal = ({ isOpen, onClose, snelkoppelingen, groepen }: SnelkoppelingenModalProps) => {
  if (!isOpen) return null;

  const actieveGroepen = groepen.filter(g => g.actief).sort((a, b) => a.volgorde - b.volgorde);
  const actieveSnelkoppelingen = snelkoppelingen.filter(s => s.actief);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            Snelkoppelingen
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {actieveGroepen.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-slate-500 mb-2">
                <ExternalLink size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 dark:text-slate-400">
                Er zijn momenteel geen snelkoppelingen beschikbaar.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {actieveGroepen.map((groep) => {
                const snelkoppelingenInGroep = actieveSnelkoppelingen
                  .filter(s => s.groepId === groep.id)
                  .sort((a, b) => a.volgorde - b.volgorde);
                
                if (snelkoppelingenInGroep.length === 0) return null;
                
                return (
                  <div key={groep.id} className="space-y-3">
                    <div className="border-b border-gray-200 dark:border-slate-700 pb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        {groep.naam}
                      </h3>
                      {groep.beschrijving && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                          {groep.beschrijving}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-3">
                      {snelkoppelingenInGroep.map((snelkoppeling) => (
                        <a
                          key={snelkoppeling.id}
                          href={snelkoppeling.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {snelkoppeling.titel}
                              </h4>
                              {snelkoppeling.beschrijving && (
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                                  {snelkoppeling.beschrijving}
                                </p>
                              )}
                            </div>
                            <ExternalLink 
                              size={16} 
                              className="text-gray-400 group-hover:text-blue-500 transition-colors ml-2 flex-shrink-0 mt-1" 
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
          <p className="text-sm text-gray-600 dark:text-slate-400 text-center">
            Klik op een snelkoppeling om deze in een nieuw tabblad te openen
          </p>
        </div>
      </div>
    </div>
  );
};
