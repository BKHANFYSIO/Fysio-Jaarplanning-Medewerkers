import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface SnelkoppelingenGroep {
  id: string;
  naam: string;
  beschrijving?: string;
  actief: boolean;
  volgorde: number;
}

export interface Snelkoppeling {
  id: string;
  titel: string;
  url: string;
  beschrijving?: string;
  actief: boolean;
  volgorde: number;
  groepId: string;
}

export const useSnelkoppelingen = () => {
  const [snelkoppelingen, setSnelkoppelingen] = useState<Snelkoppeling[]>([]);
  const [groepen, setGroepen] = useState<SnelkoppelingenGroep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    // Load snelkoppelingen
    const unsubscribeSnelkoppelingen = onSnapshot(
      collection(db, 'snelkoppelingen'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Snelkoppeling));
        
        // Sorteer op volgorde
        data.sort((a, b) => a.volgorde - b.volgorde);
        
        setSnelkoppelingen(data);
      },
      (err) => {
        console.error('Error fetching snelkoppelingen:', err);
        setError('Fout bij het laden van snelkoppelingen');
      }
    );
    
    // Load groepen
    const unsubscribeGroepen = onSnapshot(
      collection(db, 'snelkoppelingen-groepen'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SnelkoppelingenGroep));
        
        // Sorteer op volgorde
        data.sort((a, b) => a.volgorde - b.volgorde);
        
        setGroepen(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching groepen:', err);
        setError('Fout bij het laden van groepen');
        setLoading(false);
      }
    );
    
    unsubscribes.push(unsubscribeSnelkoppelingen, unsubscribeGroepen);

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const addSnelkoppeling = async (snelkoppeling: Omit<Snelkoppeling, 'id'>) => {
    try {
      await addDoc(collection(db, 'snelkoppelingen'), snelkoppeling);
    } catch (err) {
      console.error('Error adding snelkoppeling:', err);
      throw new Error('Fout bij het toevoegen van snelkoppeling');
    }
  };

  const updateSnelkoppeling = async (id: string, updates: Partial<Snelkoppeling>) => {
    try {
      await updateDoc(doc(db, 'snelkoppelingen', id), updates);
    } catch (err) {
      console.error('Error updating snelkoppeling:', err);
      throw new Error('Fout bij het bijwerken van snelkoppeling');
    }
  };

  const deleteSnelkoppeling = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'snelkoppelingen', id));
    } catch (err) {
      console.error('Error deleting snelkoppeling:', err);
      throw new Error('Fout bij het verwijderen van snelkoppeling');
    }
  };

  // Groep CRUD functions
  const addGroep = async (groep: Omit<SnelkoppelingenGroep, 'id'>) => {
    try {
      await addDoc(collection(db, 'snelkoppelingen-groepen'), groep);
    } catch (err) {
      console.error('Error adding groep:', err);
      throw new Error('Fout bij het toevoegen van groep');
    }
  };

  const updateGroep = async (id: string, updates: Partial<SnelkoppelingenGroep>) => {
    try {
      await updateDoc(doc(db, 'snelkoppelingen-groepen', id), updates);
    } catch (err) {
      console.error('Error updating groep:', err);
      throw new Error('Fout bij het bijwerken van groep');
    }
  };

  const deleteGroep = async (id: string) => {
    try {
      // Eerst alle snelkoppelingen in deze groep verwijderen
      const snelkoppelingenInGroep = snelkoppelingen.filter(s => s.groepId === id);
      for (const snelkoppeling of snelkoppelingenInGroep) {
        await deleteDoc(doc(db, 'snelkoppelingen', snelkoppeling.id));
      }
      // Dan de groep zelf verwijderen
      await deleteDoc(doc(db, 'snelkoppelingen-groepen', id));
    } catch (err) {
      console.error('Error deleting groep:', err);
      throw new Error('Fout bij het verwijderen van groep');
    }
  };

  return {
    snelkoppelingen,
    groepen,
    loading,
    error,
    addSnelkoppeling,
    updateSnelkoppeling,
    deleteSnelkoppeling,
    addGroep,
    updateGroep,
    deleteGroep
  };
};
