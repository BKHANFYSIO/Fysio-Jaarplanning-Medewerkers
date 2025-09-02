import React from 'react';
import { AlertTriangle, Calendar, Download } from 'lucide-react';

interface CalendarWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activityTitle: string;
}

export const CalendarWarningModal: React.FC<CalendarWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  activityTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Agenda Export
            </h3>
            <p className="text-sm text-gray-600">
              {activityTitle}
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <h4 className="flex items-center font-semibold text-amber-800 mb-2">
            <AlertTriangle size={16} className="mr-2" />
            Belangrijke Informatie
          </h4>
          <div className="text-sm text-amber-700 space-y-2">
            <p>
              <strong>Geen Synchronisatie:</strong> Dit agenda-item wordt niet automatisch gesynchroniseerd met de app. Wijzigingen in de app worden niet doorgevoerd in jouw agenda.
            </p>
            <p>
              <strong>Eigen Verantwoordelijkheid:</strong> Je bent zelf verantwoordelijk voor het bijhouden en bijwerken van agenda-items.
            </p>
            <p>
              <strong>Eenmalige Export:</strong> Dit is een momentopname. Voor updates moet je opnieuw exporteren.
            </p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="flex items-center font-semibold text-blue-800 mb-2">
            <Download size={16} className="mr-2" />
            Wat Gebeurt Er?
          </h4>
          <div className="text-sm text-blue-700">
            <p>
              Er wordt een <strong>.ics bestand</strong> gedownload dat je kunt importeren in:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Microsoft Outlook (werk/privé)</li>
              <li>Google Calendar</li>
              <li>Apple Calendar</li>
              <li>Andere agenda applicaties</li>
            </ul>
          </div>
        </div>

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <h4 className="flex items-center font-semibold text-green-800 mb-2">
            <Calendar size={16} className="mr-2" />
            Hoe Importeren?
          </h4>
          <div className="text-sm text-green-700 space-y-2">
            <div>
              <strong>Automatisch (aanbevolen):</strong>
              <p>Dubbelklik op het gedownloade .ics bestand - je standaard agenda opent automatisch.</p>
            </div>
            <div>
              <strong>Handmatig importeren:</strong>
              <ul className="ml-4 list-disc space-y-1 mt-1">
                <li><strong>Outlook:</strong> Bestand → Openen & Exporteren → Agenda importeren</li>
                <li><strong>Google Calendar:</strong> Instellingen → Importeren & exporteren → Importeren</li>
                <li><strong>Apple Calendar:</strong> Bestand → Importeren → Selecteer .ics bestand</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Calendar size={16} />
              Download Agenda Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
