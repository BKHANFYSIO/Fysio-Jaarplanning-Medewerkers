import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface BannerProps {
  onClose: () => void;
}

export const DevelopmentBanner: React.FC<BannerProps> = ({ onClose }) => {
  const [internalVisible, setInternalVisible] = useState(true);
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (internalVisible && settings?.developmentBanner.autoHideDelay && settings.developmentBanner.autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setInternalVisible(false);
      }, settings.developmentBanner.autoHideDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [internalVisible, settings]);

  const handleClose = () => {
    setInternalVisible(false);
    onClose();
  };

  if (loading || !settings?.developmentBanner.enabled || !internalVisible) {
    return null;
  }
  
  const { title, description } = settings.developmentBanner;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 animate-wiggle" />
          <div className="text-amber-800">
            <p className="font-medium">
              <strong>{title}</strong>
            </p>
            <p className="text-sm mt-1">
              {description}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-amber-100 rounded-full transition-colors flex-shrink-0"
          title="Sluit melding"
        >
          <X className="w-4 h-4 text-amber-600" />
        </button>
      </div>
    </div>
  );
};
