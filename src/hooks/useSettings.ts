import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface BannerSettings {
  enabled: boolean;
  title: string;
  description: string;
  autoHideDelay: number; // in seconds
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
  },
  changesBanner: {
    enabled: false,
    title: 'Belangrijke Wijziging',
    description: 'Er is een belangrijke wijziging doorgevoerd.',
    autoHideDelay: 15,
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
      // Use getDoc to check if the document exists before updating
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        await updateDoc(settingsRef, newSettings);
      } else {
        // If it still doesn't exist (edge case), use setDoc with merge option
        await setDoc(settingsRef, newSettings, { merge: true });
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      throw new Error('Kon de instellingen niet bijwerken.');
    }
  };

  return { settings, loading, error, updateSettings };
};
