import React, { useState, useEffect } from 'react';
// import styles from './AdminPage.module.css'; // Importeer de CSS module

interface FileVersion {
  filename: string;
  uploaded_at: string;
}

interface FileTypeVersions {
  active: string | null;
  versions: FileVersion[];
}

interface DataVersions {
  planning_sem1: FileTypeVersions;
  planning_sem2: FileTypeVersions;
  week_planning: FileTypeVersions;
}

const AdminPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [dataVersions, setDataVersions] = useState<DataVersions | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<keyof DataVersions>('planning_sem1');

  const API_BASE_URL = 'http://localhost:3000';

  const fetchFileVersions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/files`);
      if (!response.ok) {
        throw new Error('Kon bestandsversies niet ophalen.');
      }
      const data: DataVersions = await response.json();
      setDataVersions(data);
    } catch (error) {
      console.error('Fout bij het ophalen van bestandsversies:', error);
      setMessage('Fout bij het laden van bestandsversies.');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchFileVersions();
    }
  }, [isLoggedIn]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(''); // Reset message

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsLoggedIn(true);
        setMessage(data.message);
        // Hier zou je het token opslaan in localStorage of context
      } else {
        setMessage(data.message || 'Login mislukt');
      }
    } catch (error) {
      console.error('Fout bij inloggen:', error);
      setMessage('Netwerkfout of server is niet bereikbaar.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMessage('');
    setUsername('');
    setPassword('');
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fileToUpload) {
      setMessage('Selecteer een bestand om te uploaden.');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('filetype', selectedFileType);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setMessage(data.message);
      if (response.ok) {
        setFileToUpload(null); // Reset file input
        fetchFileVersions(); // Refresh file list
      }
    } catch (error) {
      console.error('Fout bij uploaden:', error);
      setMessage('Netwerkfout of server is niet bereikbaar tijdens upload.');
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`${API_BASE_URL}/download/${filename}`, '_blank');
  };

  const handleActivateVersion = async (filetype: keyof DataVersions, filename: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/activate-version`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filetype, filename }),
      });

      const data = await response.json();
      setMessage(data.message);
      if (response.ok) {
        fetchFileVersions(); // Refresh file list
      }
    } catch (error) {
      console.error('Fout bij activeren van versie:', error);
      setMessage('Netwerkfout of server is niet bereikbaar.');
    }
  };

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

          {!isLoggedIn ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <h2 className="text-2xl font-semibold text-center text-gray-700">Login</h2>
              <div>
                <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                  Gebruikersnaam:
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Uitloggen
                </button>
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">Bestandsbeheer</h2>

              {/* Upload sectie */}
              <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4 p-3 bg-blue-100 rounded-md shadow-sm">Bestand uploaden</h3>
              <form onSubmit={handleUpload} className="space-y-4 mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                <div>
                  <label htmlFor="filetype" className="block text-gray-700 text-sm font-bold mb-2">
                    Bestandstype:
                  </label>
                  <select
                    id="filetype"
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value as keyof DataVersions)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="planning_sem1">Semester 1 Planning</option>
                    <option value="planning_sem2">Semester 2 Planning</option>
                    <option value="week_planning">Weekplanning</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="file" className="block text-gray-700 text-sm font-bold mb-2">
                    Kies bestand:
                  </label>
                  <input
                    type="file"
                    id="file"
                    onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Upload
                </button>
              </form>

              {/* Bestandsversies sectie */}
              <h3 className="text-2xl font-bold text-gray-800 mb-4 p-3 bg-blue-100 rounded-md shadow-sm">Huidige bestandsversies</h3>
              {dataVersions ? (
                <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6">
                  {Object.entries(dataVersions).map(([type, data]) => (
                    <div key={type} className={`bg-white p-6 rounded-lg shadow ${type === 'planning_sem1' || type === 'planning_sem2' ? 'lg:col-span-2' : ''}`}>
                      <h4 className="text-lg font-bold text-gray-800 mb-3">{type.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p className="text-gray-600 mb-2">Actief: <span className="font-medium text-gray-800">{data.active || 'Geen actief bestand'}</span></p>
                      {data.versions.length > 0 ? (
                        <ul className="space-y-3">
                          {data.versions.map((version: FileVersion) => (
                            <li key={version.filename} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-3 rounded-md shadow-sm">
                              <p className="text-gray-700 text-sm mb-2 sm:mb-0 flex-grow">
                                <span className="font-medium">{version.filename}</span> (geüpload op: {new Date(version.uploaded_at).toLocaleString()})
                              </p>
                              <div className="flex flex-wrap gap-2 sm:space-x-2 sm:ml-4">
                                <button
                                  onClick={() => handleDownload(version.filename)}
                                  className="bg-indigo-500 hover:bg-indigo-700 text-white text-xs font-bold py-1 px-3 rounded"
                                >
                                  Download
                                </button>
                                {data.active !== version.filename && (
                                  <button
                                    onClick={() => handleActivateVersion(type as keyof DataVersions, version.filename)}
                                    className="bg-purple-500 hover:bg-purple-700 text-white text-xs font-bold py-1 px-3 rounded"
                                  >
                                    Activeer
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">Geen versies beschikbaar.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center">Laden bestandsversies...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 