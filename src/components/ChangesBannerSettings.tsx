import React, { useState, useEffect } from 'react';
import { Settings, Save, Eye, EyeOff, Bell } from 'lucide-react';
import { useSettings, BannerSettings } from '../hooks/useSettings';
import { toast } from 'react-hot-toast';

export const ChangesBannerSettings: React.FC = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<BannerSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalConfig(settings.changesBanner);
    }
  }, [settings]);

  const handleSave = async () => {
    if (localConfig) {
      try {
        await updateSettings({ changesBanner: localConfig });
        toast.success('Instellingen voor wijzigingenbanner opgeslagen!');
        setIsEditing(false);
      } catch (error) {
        toast.error('Fout bij opslaan van instellingen.');
        console.error(error);
      }
    }
  };

  const handleCancel = () => {
    if (settings) {
      setLocalConfig(settings.changesBanner);
    }
    setIsEditing(false);
  };

  const handleToggleBanner = () => {
    setLocalConfig(prev => prev ? { ...prev, enabled: !prev.enabled } : null);
  };

  const handleTextChange = (field: 'title' | 'description', value: string) => {
    setLocalConfig(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleDelayChange = (value: string) => {
    setLocalConfig(prev => prev ? { ...prev, autoHideDelay: parseInt(value, 10) || 0 } : null);
  }

  if (loading) {
    return <div>Instellingen laden...</div>;
  }

  if (!settings || !localConfig) {
    return <div>Kon instellingen niet laden.</div>;
  }

  const config = settings.changesBanner;

  return (
    <div className="space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="font-medium">Wijzigingenbanner Instellingen</span>
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
           {config.enabled ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-600" />}
           <span className="text-sm font-medium text-gray-700">
             Wijzigingenbanner: {config.enabled ? 'Zichtbaar' : 'Verborgen'}
           </span>
         </div>
         <p className="text-xs text-gray-500 mt-1">
           {config.enabled 
             ? 'Bezoekers zien de melding over belangrijke wijzigingen.' 
             : 'Bezoekers zien geen wijzigingenmelding.'
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
               checked={localConfig.enabled}
               onChange={handleToggleBanner}
               className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
             />
             <span className="text-sm font-medium">Wijzigingenbanner tonen</span>
           </label>
           <p className="text-xs text-gray-500 ml-6">
             Schakelt de banner in/uit die bezoekers informeert over belangrijke wijzigingen.
           </p>
         </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Banner Titel
            </label>
            <input
              type="text"
              value={localConfig.title}
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
              value={localConfig.description}
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
                onChange={(e) => handleDelayChange(e.target.value)}
                className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15"
              />
              <span className="text-sm text-gray-600">
                seconden (0 = geen auto-hide)
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Tijd voordat de banner automatisch verdwijnt. Zet op 0 om auto-hide uit te schakelen.
            </p>
          </div>
          
          <div className="flex items-center justify-end pt-2">
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
      {config.enabled && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Banner Voorvertoning:</h4>
          <div className="text-blue-800">
            <p className="font-medium text-sm">
              <strong>{config.title}</strong>
            </p>
            <p className="text-xs mt-1">
              {config.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
