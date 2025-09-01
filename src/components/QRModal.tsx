import React from 'react';
import { X, QrCode } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const targetUrl = 'https://fysio-jaarplanning-medewerkers.vercel.app/';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(targetUrl)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-gray-700"/>
            <h3 className="text-base font-semibold text-gray-800">Open op je telefoon</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" title="Sluiten">
            <X className="w-4 h-4 text-gray-500"/>
          </button>
        </div>
        <div className="p-5 flex flex-col items-center gap-3">
          <img src={qrUrl} alt="QR code jaarplanning" className="w-60 h-60"/>
          <p className="text-sm text-gray-600 text-center">Scan de QR-code om de Jaarplanning Fysiotherapie (Medewerkers) op je telefoon te openen.</p>
        </div>
      </div>
    </div>
  );
}


