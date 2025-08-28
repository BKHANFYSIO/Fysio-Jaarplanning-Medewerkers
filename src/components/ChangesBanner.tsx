import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Bell, X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface BannerProps {
  onClose: () => void;
}

export const ChangesBanner: React.FC<BannerProps> = ({ onClose }) => {
  const [internalVisible, setInternalVisible] = useState(true);
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (internalVisible && settings?.changesBanner.autoHideDelay && settings.changesBanner.autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setInternalVisible(false);
      }, settings.changesBanner.autoHideDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [internalVisible, settings]);

  const handleClose = () => {
    setInternalVisible(false);
    onClose();
  };

  if (loading || !settings?.changesBanner || !internalVisible) {
    return null;
  }
  
  const { items } = settings.changesBanner;

  const now = new Date();
  const activeItems = (items || []).filter(item => {
    try {
      const until = new Date(item.visibleUntil);
      const from = item.visibleFrom ? new Date(item.visibleFrom) : null;
      const afterFrom = from ? now >= from : true;
      return afterFrom && now <= until;
    } catch {
      return false;
    }
  });

  // Als er geen actieve items zijn, toon geen banner
  if (activeItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 animate-bell-ring" />
          <div className="text-blue-800 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-0">
              {activeItems.map(item => (
                <div key={item.id} className="bg-white border border-blue-200 rounded-md p-3 shadow-sm">
                  <h4 className="font-semibold text-blue-900 text-sm">{item.title}</h4>
                  <div className="mt-1 text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_em]:italic [&_a]:underline [&_a]:text-blue-700">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content, { USE_PROFILES: { html: true }, ALLOWED_ATTR: ['href','target','rel','style'] }) }} />
                  </div>
                  <div className="mt-2 text-xs text-blue-700/70">
                    Zichtbaar t/m: {new Date(item.visibleUntil).toLocaleString('nl-NL')}
                  </div>
                </div>
              ))}
            </div>
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
