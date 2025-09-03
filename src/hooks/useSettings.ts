import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

export interface ChangeItem {
  id: string;
  title: string;
  content: string; // HTML (WYSIWYG-output)
  visibleUntil: string; // ISO datetime string
  visibleFrom?: string; // optional ISO datetime string
}

export interface BannerSettings {
  enabled: boolean;
  title: string;
  description: string;
  autoHideDelay: number; // in seconds
  items?: ChangeItem[]; // alleen gebruikt door changesBanner
  version?: number;
  updatedAt?: string;
}

export interface AllBannerSettings {
  developmentBanner: BannerSettings;
  changesBanner: BannerSettings;
}

const defaultSettings: AllBannerSettings = {
  developmentBanner: {
    enabled: false,
    title: 'App in Ontwikkeling',
    description: 'Deze applicatie is momenteel in actieve ontwikkeling. Functionaliteiten kunnen veranderen.',
    autoHideDelay: 10,
    version: 1,
    updatedAt: '',
  },
  changesBanner: {
    enabled: false,
    title: 'Belangrijke Wijziging',
    description: 'Er is een belangrijke wijziging doorgevoerd.',
    autoHideDelay: 15,
    items: [],
    version: 1,
    updatedAt: '',
  },
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AllBannerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'banners');

    const unsubscribe = onSnapshot(settingsRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          // Merge with defaults to ensure all fields are present
          const data = docSnap.data() as Partial<AllBannerSettings>;
          setSettings({
            developmentBanner: { ...defaultSettings.developmentBanner, ...data.developmentBanner },
            changesBanner: { ...defaultSettings.changesBanner, ...data.changesBanner },
          });
        } else {
          // If the document doesn't exist, create it with default values
          console.log('No settings document found, creating one with default values.');
          setDoc(settingsRef, defaultSettings)
            .then(() => setSettings(defaultSettings))
            .catch(e => {
              console.error("Error creating settings document:", e);
              setError('Kon de instellingen niet initialiseren.');
            });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching settings:", err);
        setError('Fout bij het laden van de instellingen.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<AllBannerSettings>) => {
    const settingsRef = doc(db, 'settings', 'banners');
    
    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(settingsRef);
        
        if (!docSnap.exists()) {
          // Document doesn't exist, create it with defaults
          const initialData = { ...defaultSettings, ...newSettings };
          transaction.set(settingsRef, initialData);
          return;
        }
        
        const currentData = docSnap.data() as Partial<AllBannerSettings>;
        
        // Check for version conflicts and update versions
        const updatedData: Partial<AllBannerSettings> = {};
        
        if (newSettings.developmentBanner) {
          const currentDev = currentData.developmentBanner || defaultSettings.developmentBanner;
          const newDev = newSettings.developmentBanner;
          
          if (currentDev.version && newDev.version && currentDev.version !== newDev.version) {
            throw new Error('Wijzigingsconflict: De ontwikkelingsbanner is door iemand anders gewijzigd. Herlaad de pagina en probeer opnieuw.');
          }
          
          updatedData.developmentBanner = {
            ...newDev,
            version: (currentDev.version || 1) + 1,
            updatedAt: new Date().toISOString(),
          };
        }
        
        if (newSettings.changesBanner) {
          const currentChanges = currentData.changesBanner || defaultSettings.changesBanner;
          const newChanges = newSettings.changesBanner;
          
          if (currentChanges.version && newChanges.version && currentChanges.version !== newChanges.version) {
            throw new Error('Wijzigingsconflict: De wijzigingsbanner is door iemand anders gewijzigd. Herlaad de pagina en probeer opnieuw.');
          }
          
          updatedData.changesBanner = {
            ...newChanges,
            version: (currentChanges.version || 1) + 1,
            updatedAt: new Date().toISOString(),
          };
        }
        
        transaction.update(settingsRef, updatedData);
      });

      // Forceer een directe herlaad zodat de UI meteen de serverwaarde toont
      try {
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<AllBannerSettings>;
          setSettings({
            developmentBanner: { ...defaultSettings.developmentBanner, ...data.developmentBanner },
            changesBanner: { ...defaultSettings.changesBanner, ...data.changesBanner },
          });
        }
      } catch (refetchErr) {
        // Niet fataal; onSnapshot vangt de update in de meeste gevallen al op
        console.warn('Kon settings niet direct herladen na update. Snapshot zal waarschijnlijk volgen.', refetchErr);
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Kon de instellingen niet bijwerken.');
    }
  };

  const forceUpdateDevelopmentBanner = async (banner: BannerSettings) => {
    const settingsRef = doc(db, 'settings', 'banners');
    try {
      await setDoc(settingsRef, { 
        developmentBanner: {
          ...banner,
          version: (banner.version || 1) + 1,
          updatedAt: new Date().toISOString(),
        }
      }, { merge: true });
      
      // Reload settings after force update
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<AllBannerSettings>;
        setSettings({
          developmentBanner: { ...defaultSettings.developmentBanner, ...data.developmentBanner },
          changesBanner: { ...defaultSettings.changesBanner, ...data.changesBanner },
        });
      }
    } catch (err) {
      console.error("Error force updating development banner:", err);
      throw new Error('Kon de ontwikkelingsbanner niet forceren bij te werken.');
    }
  };

  return { settings, loading, error, updateSettings, forceUpdateDevelopmentBanner };
};
