import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Snelkoppeling {
  id: string;
  titel: string;
  url: string;
  beschrijving?: string;
  actief: boolean;
  volgorde: number;
}

export const useSnelkoppelingen = () => {
  const [snelkoppelingen, setSnelkoppelingen] = useState<Snelkoppeling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'snelkoppelingen'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Snelkoppeling));
        
        // Sorteer op volgorde
        data.sort((a, b) => a.volgorde - b.volgorde);
        
        setSnelkoppelingen(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching snelkoppelingen:', err);
        setError('Fout bij het laden van snelkoppelingen');
        setLoading(false);
      }
    );

    return () => unsubscribe();
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

  return {
    snelkoppelingen,
    loading,
    error,
    addSnelkoppeling,
    updateSnelkoppeling,
    deleteSnelkoppeling
  };
};
