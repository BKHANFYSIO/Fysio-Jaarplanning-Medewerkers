import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../hooks/useAdminData';
import { CsvUploader } from '../components/CsvUploader';
import { fetchAndExportAsCsv, deleteItem, updateItem } from '../services/firestoreService';
import { PlanningItem } from '../types';
import { useState, useMemo } from 'react';
import { EditItemModal } from '../components/EditItemModal';

const AdminPage = () => {
  const navigate = useNavigate();
  const { items, loading, error } = useAdminData();
  const [sortConfig, setSortConfig] = useState<{ key: keyof PlanningItem; direction: 'ascending' | 'descending' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<PlanningItem | null>(null);

  const handleEditClick = (item: PlanningItem) => {
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSave = async (itemToSave: PlanningItem) => {
    if (!itemToSave.collection || !itemToSave.id) {
      alert("Fout: Item kan niet worden opgeslagen zonder collectie of ID.");
      return;
    }
    try {
      // Create a clean copy of the object for Firestore
      const { id, collection, ...dataToSave } = itemToSave;
      await updateItem(collection, id, dataToSave);
      handleCloseModal();
    } catch (err) {
      console.error("Fout bij opslaan:", err);
      alert("Er is een fout opgetreden bij het opslaan van de wijzigingen.");
    }
  };

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || bValue === null) return 0;

        // Handle date strings
        if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
            const dateA = new Date(aValue.split('-').reverse().join('-'));
            const dateB = new Date(bValue.split('-').reverse().join('-'));
            if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }

        // Handle generic strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            if (aValue.toLowerCase() < bValue.toLowerCase()) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue.toLowerCase() > bValue.toLowerCase()) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof PlanningItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (collection: string, id: string, title: string) => {
    if (window.confirm(`Weet je zeker dat je het item "${title}" wilt verwijderen?`)) {
      try {
        await deleteItem(collection, id);
        // The UI will update automatically thanks to the onSnapshot listener in useAdminData
      } catch (err) {
        console.error("Fout bij verwijderen:", err);
        alert("Er is een fout opgetreden bij het verwijderen van het item.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Uitloggen mislukt', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container p-4 mx-auto md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 font-bold text-white bg-red-500 rounded-md hover:bg-red-700"
          >
            Uitloggen
          </button>
        </div>

        <div className="grid gap-8 mb-8 md:grid-cols-2">
          <div className="space-y-4">
            <CsvUploader 
              label="Upload Semester 1 CSV" 
              collectionName="planning-items-sem1" 
            />
            <button 
              onClick={() => fetchAndExportAsCsv('planning-items-sem1', `backup-sem1-${new Date().toISOString()}.csv`)}
              className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Download Backup Semester 1
            </button>
          </div>
          <div className="space-y-4">
            <CsvUploader 
              label="Upload Semester 2 CSV" 
              collectionName="planning-items-sem2"
            />
             <button 
              onClick={() => fetchAndExportAsCsv('planning-items-sem2', `backup-sem2-${new Date().toISOString()}.csv`)}
              className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Download Backup Semester 2
            </button>
          </div>
        </div>

        <div className="p-6 overflow-x-auto bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Alle Planning Items (uit Database)</h2>
          {loading && <p>Items laden...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-800 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    <button onClick={() => requestSort('title')} className="flex items-center">
                      Titel {sortConfig?.key === 'title' && (sortConfig.direction === 'ascending' ? '🔼' : '🔽')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <button onClick={() => requestSort('startDate')} className="flex items-center">
                      Startdatum {sortConfig?.key === 'startDate' && (sortConfig.direction === 'ascending' ? '🔼' : '🔽')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3">
                     <button onClick={() => requestSort('endDate')} className="flex items-center">
                      Einddatum {sortConfig?.key === 'endDate' && (sortConfig.direction === 'ascending' ? '🔼' : '🔽')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item: PlanningItem) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.title}</td>
                    <td className="px-6 py-4">{item.startDate}</td>
                    <td className="px-6 py-4">{item.endDate}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEditClick(item)} className="mr-2 font-medium text-blue-600 hover:underline">Bewerken</button>
                      <button 
                        onClick={() => {
                          if (item.collection && item.id) {
                            handleDelete(item.collection, item.id, item.title)
                          }
                        }}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <EditItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        item={currentItem}
      />
    </div>
  );
};

export default AdminPage;
