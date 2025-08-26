import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { developmentConfig } from '../config/development';

export const DevelopmentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAutoHide, setIsAutoHide] = useState(true);
  const [config, setConfig] = useState(developmentConfig);

  // Lees configuratie uit localStorage (als beschikbaar)
  useEffect(() => {
    const loadConfig = () => {
      const savedConfig = localStorage.getItem('developmentConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(parsedConfig);
        } catch (error) {
          console.error('Error parsing development config:', error);
        }
      }
    };

    // Laad configuratie bij het laden
    loadConfig();

    // Luister naar custom events voor real-time updates
    const handleConfigChange = () => {
      loadConfig();
    };

    window.addEventListener('developmentConfigChanged', handleConfigChange);

    return () => {
      window.removeEventListener('developmentConfigChanged', handleConfigChange);
    };
  }, []);

  // Auto-hide na geconfigureerde tijd
  useEffect(() => {
    if (isAutoHide && config.autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, config.autoHideDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [isAutoHide, config.autoHideDelay]);

  // Check of gebruiker de banner al heeft gezien
  useEffect(() => {
    const hasSeenBanner = localStorage.getItem('hasSeenDevelopmentBanner');
    if (hasSeenBanner === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenDevelopmentBanner', 'true');
  };

  // Controleer of de banner moet worden getoond
  if (!isVisible || !config.showDevelopmentBanner) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-amber-800">
            <p className="font-medium">
              <strong>{config.bannerText.title}</strong>
            </p>
            <p className="text-sm mt-1">
              {config.bannerText.description}
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
