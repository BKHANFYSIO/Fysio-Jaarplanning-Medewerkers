import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Importeer auth en db uit src/firebase
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'; // Firestore operaties

// interface definitions (hergebruikt van populateFirestore.js/types/index.ts)
interface PlanningItem {
  id?: string; // Optionele ID voor Firestore documenten
  title: string;
  description: string;
  link: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  deadline: string | null;
  subjects: {
    waarderen: boolean;
    juniorstage: boolean;
    ipl: boolean;
    bvp: boolean;
    pzw: boolean;
    minor: boolean;
    getuigschriften: boolean;
    inschrijven: boolean;
    overig: boolean;
  };
  phases: {
    p: boolean;
    h1: boolean;
    h2h3: boolean;
  };
}

interface WeekInfo {
  id?: string; // Optionele ID voor Firestore documenten
  weekCode: string;
  weekLabel: string;
  startDate: string;
  semester: 1 | 2;
  isVacation: boolean;
}

// Backend API URL - Verwijderd voor deployment
// const API_BASE_URL = 'http://localhost:3000/api';

const AdminPage: React.FC = () => {
  const [email, setEmail] = useState(''); // Gebruik email voor Firebase Auth
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null); // Firebase User object
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<'planningItems' | 'weeks'>('planningItems');

  // State voor bewerken/toevoegen
  const [editingItem, setEditingItem] = useState<PlanningItem | WeekInfo | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  
  // State voor import/export
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');

  // Effect om auth status te monitoren
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Fetch data zodra de gebruiker is ingelogd
        fetchData();
      }
    });
    return () => unsubscribe();
  }, []);

  // Functie om data op te halen uit Firestore via de Vercel API
  const fetchData = async () => {
    if (!user) return; // Alleen fetchen als user ingelogd is
    setMessage('');
    try {
      const planningResponse = await fetch('/api/data/planningItems', {
        headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
      });
      if (!planningResponse.ok) throw new Error('Kon planning data niet ophalen.');
      const planningData: PlanningItem[] = await planningResponse.json();
      setPlanningItems(planningData);

      const weeksResponse = await fetch('/api/data/weeks', {
        headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
      });
      if (!weeksResponse.ok) throw new Error('Kon week data niet ophalen.');
      const weeksData: WeekInfo[] = await weeksResponse.json();
      setWeeks(weeksData);

    } catch (error) {
      console.error('Fout bij het ophalen van data:', error);
      setMessage('Fout bij het laden van data.');
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('Login succesvol!');
    } catch (error: any) {
      console.error('Fout bij inloggen:', error);
      setMessage(error.message || 'Login mislukt.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMessage('Succesvol uitgelogd.');
      setPlanningItems([]);
      setWeeks([]);
    } catch (error: any) {
      console.error('Fout bij uitloggen:', error);
      setMessage(error.message || 'Uitloggen mislukt.');
    }
  };

  // Functies voor CRUD operaties
  const handleSaveItem = async (item: PlanningItem | WeekInfo) => {
    if (!user) { setMessage('Niet geauthenticeerd.'); return; }
    setMessage('');
    try {
      let response;
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await user.getIdToken()}` };
      const collection = selectedCollection;

      if (isNewItem) {
        response = await fetch(`/api/data/${collection}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(item),
        });
      } else if (item.id) {
        response = await fetch(`/api/data/${collection}?id=${item.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(item),
        });
      } else {
        throw new Error('Item ID ontbreekt voor bewerking.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fout bij opslaan item');
      }
      setMessage('Item succesvol opgeslagen.');
      setEditingItem(null);
      setIsNewItem(false);
      fetchData(); // Herlaad data
    } catch (error: any) {
      console.error('Fout bij opslaan item:', error);
      setMessage(error.message || 'Fout bij opslaan item.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) { setMessage('Niet geauthenticeerd.'); return; }
    if (!window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;
    setMessage('');
    try {
      const response = await fetch(`/api/data/${selectedCollection}?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fout bij verwijderen item');
      }
      setMessage('Item succesvol verwijderd.');
      fetchData(); // Herlaad data
    } catch (error: any) {
      console.error('Fout bij verwijderen item:', error);
      setMessage(error.message || 'Fout bij verwijderen item.');
    }
  };

  // Functies voor import/export
  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) { setMessage('Niet geauthenticeerd.'); return; }
    if (!fileToImport) { setMessage('Selecteer een bestand om te importeren.'); return; }
    setMessage('');

    const formData = new FormData();
    formData.append('file', fileToImport);
    // collectionName en mode als query parameters of via andere velden in formData

    try {
      const response = await fetch(`/api/import-csv?collectionName=${selectedCollection}&mode=${importMode}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await user.getIdToken()}` },
        body: formData,
      });

      const data = await response.json();
      setMessage(data.message);
      if (response.ok) {
        setFileToImport(null); // Reset file input
        fetchData(); // Herlaad data
      }
    } catch (error: any) {
      console.error('Fout bij import:', error);
      setMessage(error.message || 'Fout bij import.');
    }
  };

  const handleExport = async () => {
    if (!user) { setMessage('Niet geauthenticeerd.'); return; }
    setMessage('');
    try {
      const response = await fetch(`/api/export-csv?collectionName=${selectedCollection}`, {
        headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fout bij export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCollection}_export_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Export succesvol!');

    } catch (error: any) {
      console.error('Fout bij export:', error);
      setMessage(error.message || 'Fout bij export.');
    }
  };

  const currentData = selectedCollection === 'planningItems' ? planningItems : weeks;
  const isPlanningEditing = selectedCollection === 'planningItems';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto lg:max-w-4xl">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 lg:p-10">
            <p className="text-center text-gray-600">Laden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto lg:max-w-4xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-lightBlue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 lg:p-10">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Admin Paneel</h1>
          {message && (
            <p className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4">
              {message}
            </p>
          )}

          {!user ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <h2 className="text-2xl font-semibold text-center text-gray-700">Login</h2>
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Wachtwoord:
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                Login
              </button>
            </form>
          ) : (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">Bestandsbeheer</h2>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Uitloggen
                </button>
              </div>

              {/* Collectie selectie */}
              <div className="mb-6 flex space-x-4">
                <button
                  onClick={() => setSelectedCollection('planningItems')}
                  className={`py-2 px-4 rounded-md ${selectedCollection === 'planningItems' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Planning Items
                </button>
                <button
                  onClick={() => setSelectedCollection('weeks')}
                  className={`py-2 px-4 rounded-md ${selectedCollection === 'weeks' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Week Info
                </button>
              </div>

              {/* Toevoegen/Bewerken Formulier */}
              {editingItem ? (
                <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">{isNewItem ? 'Nieuw Item Toevoegen' : 'Item Bewerken'}</h3>
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(editingItem); }} className="space-y-4">
                    {/* Form fields based on selectedCollection */}
                    {isPlanningEditing ? (
                      <>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Titel:</label>
                          <input type="text" value={(editingItem as PlanningItem).title || ''} onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, title: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Beschrijving:</label>
                          <textarea value={(editingItem as PlanningItem).description || ''} onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, description: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Link:</label>
                          <input type="text" value={(editingItem as PlanningItem).link || ''} onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, link: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        {/* Data en Tijd velden */}
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Startdatum (DD-MMM-YYYY):</label>
                          <input type="text" value={(editingItem as PlanningItem).startDate || ''} onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, startDate: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Einddatum (DD-MMM-YYYY):</label>
                          <input type="text" value={(editingItem as PlanningItem).endDate || ''} onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, endDate: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Starttijd (HH:MM):</label>
                          <input type="text" value={(editingItem as PlanningItem).startTime || ''} onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, startTime: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Eindtijd (HH:MM):</label>
                          <input type="text" value={(editingItem as PlanningItem).endTime || ''} onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, endTime: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Deadline (DD-MMM-YYYY):</label>
                          <input type="text" value={(editingItem as PlanningItem).deadline || ''} onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, deadline: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        {/* Subjects checkboxes */}
                        <div className="grid grid-cols-2 gap-4">
                          {Object.keys((editingItem as PlanningItem).subjects).map(subKey => (
                            <div key={subKey}>
                              <input
                                type="checkbox"
                                id={`subject-${subKey}`}
                                checked={(editingItem as PlanningItem).subjects[subKey as keyof PlanningItem['subjects']]}
                                onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, subjects: { ...(editingItem as PlanningItem).subjects, [subKey]: e.target.checked } })}
                                className="mr-2 leading-tight"
                              />
                              <label htmlFor={`subject-${subKey}`} className="text-gray-700 text-sm font-bold">{subKey.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                            </div>
                          ))}
                        </div>
                        {/* Phases checkboxes */}
                        <div className="grid grid-cols-2 gap-4">
                          {Object.keys((editingItem as PlanningItem).phases).map(phKey => (
                            <div key={phKey}>
                              <input
                                type="checkbox"
                                id={`phase-${phKey}`}
                                checked={(editingItem as PlanningItem).phases[phKey as keyof PlanningItem['phases']]}
                                onChange={(e) => setEditingItem({ ...editingItem as PlanningItem, phases: { ...(editingItem as PlanningItem).phases, [phKey]: e.target.checked } })}
                                className="mr-2 leading-tight"
                              />
                              <label htmlFor={`phase-${phKey}`} className="text-gray-700 text-sm font-bold">{phKey.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Week Info fields */}
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Week Code:</label>
                          <input type="text" value={(editingItem as WeekInfo).weekCode || ''} onChange={(e) => setEditingItem({ ...editingItem as WeekInfo, weekCode: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Week Label:</label>
                          <input type="text" value={(editingItem as WeekInfo).weekLabel || ''} onChange={(e) => setEditingItem({ ...editingItem as WeekInfo, weekLabel: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Startdatum (DD-MMM-YYYY):</label>
                          <input type="text" value={(editingItem as WeekInfo).startDate || ''} onChange={(e) => setEditingItem({ ...editingItem as WeekInfo, startDate: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Semester:</label>
                          <select value={(editingItem as WeekInfo).semester || 1} onChange={(e) => setEditingItem({ ...editingItem as WeekInfo, semester: parseInt(e.target.value) as 1 | 2 })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            id="isVacation"
                            checked={(editingItem as WeekInfo).isVacation}
                            onChange={(e) => setEditingItem({ ...editingItem as WeekInfo, isVacation: e.target.checked })}
                            className="mr-2 leading-tight"
                          />
                          <label htmlFor="isVacation" className="text-gray-700 text-sm font-bold">Is Vakantie</label>
                        </div>
                      </>
                    )}
                    <div className="flex justify-end space-x-4">
                      <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Opslaan
                      </button>
                      <button type="button" onClick={() => setEditingItem(null)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Annuleren
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              {/* Import/Export sectie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 bg-white rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">Data Importeren (CSV)</h3>
                  <form onSubmit={handleImport} className="space-y-4">
                    <div>
                      <label htmlFor="importCollection" className="block text-gray-700 text-sm font-bold mb-2">Collectie:</label>
                      <select
                        id="importCollection"
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value as 'planningItems' | 'weeks')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="planningItems">Planning Items</option>
                        <option value="weeks">Week Info</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="fileToImport" className="block text-gray-700 text-sm font-bold mb-2">Kies CSV bestand:</label>
                      <input
                        type="file"
                        id="fileToImport"
                        onChange={(e) => setFileToImport(e.target.files ? e.target.files[0] : null)}
                        accept=".csv"
                        required
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <input type="radio" id="merge" value="merge" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} className="form-radio" />
                      <label htmlFor="merge" className="text-gray-700">Mergen (voegt toe of werkt bij)</label>
                      <input type="radio" id="overwrite" value="overwrite" checked={importMode === 'overwrite'} onChange={() => setImportMode('overwrite')} className="form-radio" />
                      <label htmlFor="overwrite" className="text-gray-700">Overschrijven (verwijdert alles, voegt toe)</label>
                    </div>
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                      Importeren
                    </button>
                  </form>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">Data Exporteren (CSV Backup)</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="exportCollection" className="block text-gray-700 text-sm font-bold mb-2">Collectie:</label>
                      <select
                        id="exportCollection"
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value as 'planningItems' | 'weeks')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="planningItems">Planning Items</option>
                        <option value="weeks">Week Info</option>
                      </select>
                    </div>
                    <button onClick={handleExport} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                      Download als CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Huidige data overzicht */}
              <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4 p-3 bg-blue-100 rounded-md shadow-sm">Huidige {selectedCollection === 'planningItems' ? 'Planning Items' : 'Week Info'}</h3>
              <button
                onClick={() => {
                  if (selectedCollection === 'planningItems') {
                    setEditingItem({ title: '', description: '', link: null, startDate: '', endDate: '', startTime: null, endTime: null, deadline: null, subjects: { waarderen: false, juniorstage: false, ipl: false, bvp: false, pzw: false, minor: false, getuigschriften: false, inschrijven: false, overig: false }, phases: { p: false, h1: false, h2h3: false } });
                  } else {
                    setEditingItem({ weekCode: '', weekLabel: '', startDate: '', semester: 1, isVacation: false });
                  }
                  setIsNewItem(true);
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
              >
                Nieuw {selectedCollection === 'planningItems' ? 'Planning Item' : 'Week Info'} Toevoegen
              </button>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-gray-200 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 text-left">Titel/Week Code</th>
                      <th className="py-3 px-4 text-left">Beschrijving/Label</th>
                      <th className="py-3 px-4 text-left">Startdatum</th>
                      {selectedCollection === 'planningItems' && <th className="py-3 px-4 text-left">Einddatum</th>}
                      {selectedCollection === 'weeks' && <th className="py-3 px-4 text-left">Semester</th>}
                      <th className="py-3 px-4 text-left">Acties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentData.length > 0 ? (
                      currentData.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">{'title' in item ? item.title : item.weekCode}</td>
                          <td className="py-3 px-4">{'description' in item ? item.description : item.weekLabel}</td>
                          <td className="py-3 px-4">{item.startDate}</td>
                          {selectedCollection === 'planningItems' && <td className="py-3 px-4">{(item as PlanningItem).endDate}</td>}
                          {selectedCollection === 'weeks' && <td className="py-3 px-4">{(item as WeekInfo).semester}</td>}
                          <td className="py-3 px-4 flex space-x-2">
                            <button onClick={() => { setEditingItem(item); setIsNewItem(false); }} className="bg-yellow-500 hover:bg-yellow-700 text-white text-xs font-bold py-1 px-2 rounded">Bewerken</button>
                            <button onClick={() => item.id && handleDeleteItem(item.id)} className="bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">Verwijderen</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={selectedCollection === 'planningItems' ? 6 : 5} className="py-3 px-4 text-center text-gray-500">Geen items gevonden.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 