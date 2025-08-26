import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, Save, Eye, EyeOff } from 'lucide-react';
import { developmentConfig } from '../config/development';

interface DevelopmentBannerSettingsProps {
  onSettingsChange: (config: typeof developmentConfig) => void;
}

export const DevelopmentBannerSettings: React.FC<DevelopmentBannerSettingsProps> = ({ onSettingsChange }) => {
  const [config, setConfig] = useState(developmentConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState(developmentConfig);

  // Lees configuratie uit localStorage bij het laden
  useEffect(() => {
    const savedConfig = localStorage.getItem('developmentConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        setLocalConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing development config:', error);
      }
    }
  }, []);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    // Update localStorage
    localStorage.setItem('developmentConfig', JSON.stringify(localConfig));
    
    // Update de lokale state
    setConfig(localConfig);
    onSettingsChange(localConfig);
    setIsEditing(false);
    
    // Trigger custom event voor real-time updates
    window.dispatchEvent(new CustomEvent('developmentConfigChanged'));
  };

  const handleCancel = () => {
    setLocalConfig(config);
    setIsEditing(false);
  };

  const handleToggleBanner = () => {
    setLocalConfig(prev => ({
      ...prev,
      showDevelopmentBanner: !prev.showDevelopmentBanner
    }));
  };



  const handleTextChange = (field: 'title' | 'description', value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      bannerText: {
        ...prev.bannerText,
        [field]: value
      }
    }));
  };

  const resetBannerVisibility = () => {
    localStorage.removeItem('hasSeenDevelopmentBanner');
    alert('Banner zichtbaarheid is gereset. Alle gebruikers zullen de banner opnieuw zien.');
  };

  return (
    <div className="space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <span className="font-medium">Ontwikkelingsbanner Instellingen</span>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            Bewerken
          </button>
        )}
      </div>

             {/* Current Status */}
       <div className="p-3 rounded-lg border bg-gray-50">
         <div className="flex items-center gap-2">
           {config.showDevelopmentBanner ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-600" />}
           <span className="text-sm font-medium text-gray-700">
             Ontwikkelingsbanner: {config.showDevelopmentBanner ? 'Zichtbaar' : 'Verborgen'}
           </span>
         </div>
         <p className="text-xs text-gray-500 mt-1">
           {config.showDevelopmentBanner 
             ? 'Bezoekers zien de melding dat de app nog in ontwikkeling is' 
             : 'Bezoekers zien geen ontwikkelingsmelding'
           }
         </p>
       </div>

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                   <div className="space-y-3">
           <label className="flex items-center gap-2">
             <input
               type="checkbox"
               checked={localConfig.showDevelopmentBanner}
               onChange={handleToggleBanner}
               className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
             />
             <span className="text-sm font-medium">Ontwikkelingsbanner tonen</span>
           </label>
           <p className="text-xs text-gray-500 ml-6">
             Schakelt de gele waarschuwingsbanner in/uit die bezoekers informeren dat de app nog in ontwikkeling is
           </p>
         </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Banner Titel
            </label>
            <input
              type="text"
              value={localConfig.bannerText.title}
              onChange={(e) => handleTextChange('title', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Voer de banner titel in"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Banner Beschrijving
            </label>
            <textarea
              value={localConfig.bannerText.description}
              onChange={(e) => handleTextChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Voer de banner beschrijving in"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Auto-hide Tijd (seconden)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="300"
                value={localConfig.autoHideDelay}
                onChange={(e) => setLocalConfig(prev => ({
                  ...prev,
                  autoHideDelay: parseInt(e.target.value) || 0
                }))}
                className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
              <span className="text-sm text-gray-600">
                seconden (0 = geen auto-hide)
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Tijd voordat de banner automatisch verdwijnt. Zet op 0 om auto-hide uit te schakelen.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={resetBannerVisibility}
              className="px-3 py-1 text-sm text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100"
              title="Reset banner zichtbaarheid voor alle gebruikers"
            >
              Reset Zichtbaarheid
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {config.showDevelopmentBanner && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Banner Voorvertoning:</h4>
          <div className="text-amber-800">
            <p className="font-medium text-sm">
              <strong>{config.bannerText.title}</strong>
            </p>
            <p className="text-xs mt-1">
              {config.bannerText.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
