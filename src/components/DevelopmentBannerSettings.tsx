import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import DOMPurify from 'dompurify';
import { Settings, Save, Eye, EyeOff } from 'lucide-react';
import { useSettings, BannerSettings } from '../hooks/useSettings';
import { toast } from 'react-hot-toast';

export const DevelopmentBannerSettings: React.FC = () => {
  const { settings, updateSettings, forceUpdateDevelopmentBanner, loading } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<BannerSettings | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  useEffect(() => {
    if (settings && !hasLocalChanges) {
      setLocalConfig(settings.developmentBanner);
    }
  }, [settings, hasLocalChanges]);

  const cleanHtml = (html: string): string => {
    // Verwijder Quill-artefacten
    let cleaned = html
      .replace(/<span class="ql-ui"[^>]*><\/span>/g, '') // Verwijder ql-ui spans
      .replace(/contenteditable="[^"]*"/g, '') // Verwijder contenteditable attributen
      .replace(/data-list="[^"]*"/g, ''); // Verwijder data-list attributen
    
    // Normaliseer anchors
    cleaned = cleaned.replace(/<a([^>]*)>/g, (match, attrs) => {
      // Voeg target="_blank" en rel="noopener noreferrer" toe als ze er niet zijn
      let newAttrs = attrs;
      if (!newAttrs.includes('target=')) {
        newAttrs += ' target="_blank"';
      }
      if (!newAttrs.includes('rel=')) {
        newAttrs += ' rel="noopener noreferrer"';
      }
      return `<a${newAttrs}>`;
    });
    
    return cleaned;
  };

  const handleSave = async () => {
    if (localConfig) {
      try {
        const cleanedConfig = {
          ...localConfig,
          description: cleanHtml(localConfig.description)
        };
        
        await updateSettings({ developmentBanner: cleanedConfig });
        toast.success('Instellingen opgeslagen!');
        setIsEditing(false);
        setHasLocalChanges(false);
      } catch (error) {
        console.error('Primary save failed, trying fallback:', error);
        
        // Fallback: gebruik forceUpdateDevelopmentBanner
        try {
          const cleanedConfig = {
            ...localConfig,
            description: cleanHtml(localConfig.description)
          };
          
          await forceUpdateDevelopmentBanner(cleanedConfig);
          toast.success('Instellingen opgeslagen (fallback)!');
          setIsEditing(false);
          setHasLocalChanges(false);
        } catch (fallbackError) {
          toast.error('Fout bij opslaan van instellingen.');
          console.error('Fallback save also failed:', fallbackError);
        }
      }
    }
  };

  const handleCancel = () => {
    if (settings) {
      setLocalConfig(settings.developmentBanner);
    }
    setIsEditing(false);
    setHasLocalChanges(false);
  };

  const handleToggleBanner = () => {
    setLocalConfig(prev => prev ? { ...prev, enabled: !prev.enabled } : null);
    setHasLocalChanges(true);
  };

  const handleTextChange = (field: 'title' | 'description', value: string) => {
    setLocalConfig(prev => prev ? { ...prev, [field]: value } : null);
    setHasLocalChanges(true);
  };
  
  const handleDelayChange = (value: string) => {
    setLocalConfig(prev => prev ? { ...prev, autoHideDelay: parseInt(value, 10) || 0 } : null);
    setHasLocalChanges(true);
  }

  // Quill toolbar geconfigureerd in StrictMode-veilige wrapper

  if (loading) {
    return <div>Instellingen laden...</div>;
  }

  if (!settings || !localConfig) {
    return <div>Kon instellingen niet laden.</div>;
  }

  const config = settings.developmentBanner;

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
           {config.enabled ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-600" />}
           <span className="text-sm font-medium text-gray-700">
             Ontwikkelingsbanner: {config.enabled ? 'Zichtbaar' : 'Verborgen'}
           </span>
         </div>
         <p className="text-xs text-gray-500 mt-1">
           {config.enabled 
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
               checked={localConfig.enabled}
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
            <div className="border border-gray-300 rounded-md">
              <RichTextEditor
                value={localConfig.description}
                onChange={(value) => handleTextChange('description', value)}
              />
            </div>
            <p className="text-xs text-gray-500">Gebruik de knoppen om opmaak toe te passen of plak opgemaakte tekst rechtstreeks.</p>
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
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Banner Voorvertoning:</h4>
          <div className="text-amber-800">
            <p className="font-medium text-sm">
              <strong>{config.title}</strong>
            </p>
            <div className="text-xs mt-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_em]:italic [&_a]:underline [&_a]:text-amber-700">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(config.description, { USE_PROFILES: { html: true }, ALLOWED_ATTR: ['href','target','rel','style'] }) }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
