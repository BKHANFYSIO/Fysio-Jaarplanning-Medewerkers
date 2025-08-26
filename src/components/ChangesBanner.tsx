import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export const ChangesBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (settings?.changesBanner.enabled) {
      const hasSeenBanner = sessionStorage.getItem('hasSeenChangesBanner');
      if (hasSeenBanner !== 'true') {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [settings]);

  useEffect(() => {
    if (isVisible && settings?.changesBanner.autoHideDelay && settings.changesBanner.autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, settings.changesBanner.autoHideDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, settings]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenChangesBanner', 'true');
  };

  if (loading || !isVisible || !settings?.changesBanner.enabled) {
    return null;
  }
  
  const { title, description } = settings.changesBanner;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="text-blue-800">
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
          className="p-1 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
          title="Sluit melding"
        >
          <X className="w-4 h-4 text-blue-600" />
        </button>
      </div>
    </div>
  );
};
