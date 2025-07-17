import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../hooks/useAdminData';
import { useData } from '../hooks/useData'; // Using this hook for orphaned items
import { CsvUploader } from '../components/CsvUploader';
import { fetchAndExportAsCsv, deleteItem, saveItem } from '../services/firestoreService';
import { PlanningItem, WeekInfo } from '../types';
import { useState, useMemo } from 'react';
import { EditItemModal } from '../components/EditItemModal';
import { useWeekData } from '../hooks/useWeekData';
import { EditWeekModal } from '../components/EditWeekModal';
import { Accordion } from '../components/Accordion';
import { LogOut, Upload, Download, Edit, Trash2, CheckCircle2, AlertTriangle, PlusCircle } from 'lucide-react';

const monthMap: { [key: string]: number } = {
  'jan': 1, 'feb': 2, 'mrt': 3, 'apr': 4, 'mei': 5, 'jun': 6,
  'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12
};

const getMonthNumberFromString = (monthStr: string): number => {
    if (!monthStr) return 0;
    const lowerMonth = monthStr.toLowerCase().substring(0, 3);
    return monthMap[lowerMonth] || 0;
};

// Custom parser for Week CSV, different from the one in useData
const parseWeekCsvForUpload = (results: any): WeekInfo[] => {
  let currentSemester: 1 | 2 = 1;
  const weeks: WeekInfo[] = [];

  results.data.forEach((row: any) => {
    const label = row['Weergave voor in app.'] || '';
    const dateStr = row[''] || ''; // Second column is often unnamed

    if (label.includes('Semester 1')) {
      currentSemester = 1;
      return;
    }
    if (label.includes('Semester 2')) {
      currentSemester = 2;
      return;
    }
    
    if (label && dateStr && label.trim() !== '') {
        const isVacation = label.toLowerCase().includes('vakantie') || label.toLowerCase().includes('afsluiting');
        
        let year;
        if (row['jaar'] && !isNaN(parseInt(row['jaar']))) {
          year = parseInt(row['jaar']);
        } else {
          // Fallback to old logic if 'jaar' column is missing
          const month = getMonthNumberFromString(dateStr.split('-')[1]);
          year = (month >= 8 && month <= 12) ? 2025 : 2026;
        }

        const fullDate = `${dateStr}-${year}`;

        weeks.push({
          weekCode: label.includes('.') ? label.split(' ')[0] : label,
          weekLabel: label,
          startDate: fullDate, // Correctly use the full date with year
          year: year,
          semester: currentSemester,
          isVacation,
        });
      }
  });
  return weeks;
}


const AdminPage = () => {
  const navigate = useNavigate();
  const { items: planningItems, loading: planningLoading, error: planningError } = useAdminData();
  const { weeks, loading: weeksLoading, error: weeksError } = useWeekData();
  const { orphanedItems, loading: orphanedLoading } = useData(); // Get orphaned items
  const [sortConfig, setSortConfig] = useState<{ key: keyof PlanningItem; direction: 'ascending' | 'descending' } | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<PlanningItem | null>(null);
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<WeekInfo | null>(null);

  const handleEditClick = (item: PlanningItem) => {
    setCurrentItem(item);
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async (itemToSave: PlanningItem) => {
    // Determine which collection to save to based on semester.
    // This is a simplified logic. You might need a more robust way.
    const collectionName = itemToSave.semester === 2 ? 'planning-items-sem2' : 'planning-items-sem1';

    try {
      const { id, collection, ...dataToSave } = itemToSave;
      await saveItem(collectionName, dataToSave, id);
      handleCloseItemModal();
    } catch (err) {
      console.error("Fout bij opslaan:", err);
      alert("Er is een fout opgetreden bij het opslaan van de wijzigingen.");
    }
  };

  const handleWeekEditClick = (week: WeekInfo) => {
    setCurrentWeek(week);
    setIsWeekModalOpen(true);
  };

  const handleCloseWeekModal = () => {
    setIsWeekModalOpen(false);
    setCurrentWeek(null);
  };

  const handleSaveWeek = async (weekToSave: WeekInfo) => {
    if (!weekToSave.id) return;
    const { id, ...dataToSave } = weekToSave;
    await saveItem('week-planning', dataToSave, id);
    handleCloseWeekModal();
  };

  const handleWeekDelete = async (id: string, label: string) => {
    if (window.confirm(`Weet je zeker dat je week "${label}" wilt verwijderen?`)) {
      await deleteItem('week-planning', id);
    }
  };

  const handleAddNewItem = () => {
    setCurrentItem({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      phases: {},
      subjects: {}
    } as PlanningItem); 
    setIsItemModalOpen(true);
  };

  const sortedItems = useMemo(() => {
    let sortableItems = [...planningItems];
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
  }, [planningItems, sortConfig]);

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
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700"
          >
            <LogOut size={18} />
            Uitloggen
          </button>
        </div>

        {/* Instructions Section */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow">
          <h2 className="p-3 mb-4 -mx-6 -mt-6 text-xl font-semibold text-white bg-gray-700 rounded-t-lg">Uitleg & Instructies</h2>
          <Accordion title={<p><strong>Instructies voor CSV Upload</strong> (voor grote wijzigingen of een nieuw studiejaar)</p>}>
            <div className="space-y-4 text-sm">
              <p>Gebruik de CSV-upload om in één keer een volledige planning voor een semester of een complete weekplanning voor een nieuw jaar te importeren. Deze actie <strong>overschrijft alle bestaande data</strong> in de betreffende categorie.</p>
              <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
                <h4 className="font-bold">Workflow (volg deze stappen altijd):</h4>
                <ol className="ml-5 list-decimal">
                  <li><strong>Download altijd eerst een backup!</strong> Voordat je een nieuw bestand uploadt, klik op de "Download Backup" knop. Sla dit bestand veilig op. Mocht er iets misgaan, dan kun je deze backup gebruiken om de oude staat te herstellen.</li>
                  <li><strong>Bereid je CSV-bestand voor.</strong> Zorg ervoor dat je bestand de juiste kolommen heeft. De kolomkoppen moeten exact overeenkomen.
                    <ul className="ml-5 list-disc">
                      <li><strong>Voor Planning-items:</strong> <code>Titel (of wat)</code>, <code>Extra regel</code>, <code>link</code>, <code>Startdatum</code>, <code>Einddatum</code>, en de kolommen voor onderwerpen (<code>BVP</code>, <code>PZW</code>, etc.) en fases (<code>P</code>, <code>H1</code>, etc.).</li>
                      <li><strong>Voor Weekplanning:</strong> <code>Weergave voor in app.</code>, een <strong>lege kolom</strong> voor de datum (dd-mmm), en <code>jaar</code>.</li>
                    </ul>
                  </li>
                  <li><strong>Upload het nieuwe bestand.</strong> Gebruik de juiste upload-knop. Je krijgt een waarschuwing die je moet bevestigen voordat de oude data wordt gewist.</li>
                </ol>
              </div>
            </div>
          </Accordion>
          <Accordion title={<p><strong>Instructies voor Direct Bewerken</strong> (voor kleine aanpassingen)</p>}>
             <div className="space-y-4 text-sm">
                <p>Gebruik de "Bewerken" en "Verwijderen" knoppen in de tabellen hieronder voor snelle, individuele aanpassingen. Dit is de veiligste en snelste manier om een typefout te herstellen, een datum aan te passen, of een enkele activiteit/week te verwijderen.</p>
                <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                  <h4 className="font-bold">Belangrijk: Synchroniseer met het "Moederbestand"</h4>
                  <p>Als je organisatie een centraal Excel- of "moederbestand" gebruikt voor de planning, zorg er dan voor dat je de wijzigingen die je hier doorvoert, ook daar verwerkt. Dit voorkomt dat de data uit elkaar gaat lopen bij een volgende grote CSV-upload.</p>
                </div>
              </div>
          </Accordion>
        </div>
        
        {/* Status Section */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow">
          <h2 className="p-3 mb-4 -mx-6 -mt-6 text-xl font-semibold text-white bg-indigo-700 rounded-t-lg">Data Integriteit Status</h2>
          {!orphanedLoading && (
              <div className={`p-4 border-l-4 rounded-md ${orphanedItems.length > 0 ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-green-100 border-green-500 text-green-800'}`}>
                  {orphanedItems.length > 0 ? (
                      <>
                          <h3 className="flex items-center font-bold"><AlertTriangle size={20} className="mr-2"/>Waarschuwing: {orphanedItems.length} Wees-Activiteit(en) Gevonden</h3>
                          <p className="mt-2 text-sm">De volgende activiteiten konden niet aan een week in de planning worden gekoppeld. Controleer de datums.</p>
                          <ul className="mt-2 ml-5 text-sm list-disc">
                              {orphanedItems.map(item => <li key={item.id}>{item.title} (Start: {item.startDate}, Eind: {item.endDate})</li>)}
                          </ul>
                      </>
                  ) : (
                      <h3 className="flex items-center font-bold"><CheckCircle2 size={20} className="mr-2"/>Alle activiteiten zijn succesvol gekoppeld aan de weekplanning.</h3>
                  )}
              </div>
          )}
        </div>
        
        {/* Management Sections in a grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            
            {/* Planning Items Management */}
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="p-3 mb-4 -mx-6 -mt-6 text-2xl font-semibold text-white bg-blue-700 rounded-t-lg">Planning Items</h2>
                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                    <CsvUploader label="Upload Semester 1 CSV" collectionName="planning-items-sem1" />
                    <CsvUploader label="Upload Semester 2 CSV" collectionName="planning-items-sem2" />
                    <button onClick={() => fetchAndExportAsCsv('planning-items-sem1', `backup-sem1-${new Date().toISOString()}.csv`)} className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"> <Download size={18} /> Backup Sem 1</button>
                    <button onClick={() => fetchAndExportAsCsv('planning-items-sem2', `backup-sem2-${new Date().toISOString()}.csv`)} className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"> <Download size={18} /> Backup Sem 2</button>
                </div>
                
                 {/* Table for Planning Items */}
                <div className="flex justify-end mb-4">
                     <button onClick={handleAddNewItem} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        <PlusCircle size={18} />
                        Nieuw Item
                    </button>
                </div>
                 {planningLoading && <p>Items laden...</p>}
                 {planningError && <p className="text-red-500">{planningError}</p>}
                 {!planningLoading && !planningError && (
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

            {/* Week Management */}
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="p-3 mb-4 -mx-6 -mt-6 text-2xl font-semibold text-white bg-teal-700 rounded-t-lg">Weekbeheer</h2>
                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                    <CsvUploader label="Upload Weekplanning CSV" collectionName="week-planning" customParser={parseWeekCsvForUpload}/>
                    <button onClick={() => fetchAndExportAsCsv('week-planning', `backup-weken-${new Date().toISOString()}.csv`)} className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"> <Download size={18} /> Backup Weken</button>
                </div>
                 {/* Table for Weeks */}
                 {weeksLoading && <p>Weken laden...</p>}
                 {weeksError && <p className="text-red-500">{weeksError}</p>}
                 {!weeksLoading && !weeksError && (
                    <table className="min-w-full text-sm text-left text-gray-700">
                      <thead className="text-xs text-gray-800 uppercase bg-gray-100">
                        <tr>
                          <th scope="col" className="px-6 py-3">Week Label</th>
                          <th scope="col" className="px-6 py-3">Startdatum</th>
                          <th scope="col" className="px-6 py-3">Semester</th>
                          <th scope="col" className="px-6 py-3">Is Vakantie?</th>
                          <th scope="col" className="px-6 py-3 text-right">Acties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeks.map((week) => (
                          <tr key={week.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{week.weekLabel}</td>
                            <td className="px-6 py-4">{week.startDate}</td>
                            <td className="px-6 py-4">{week.semester}</td>
                            <td className="px-6 py-4">{week.isVacation ? 'Ja' : 'Nee'}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleWeekEditClick(week)} className="mr-2 font-medium text-blue-600 hover:underline">Bewerken</button>
                              <button onClick={() => week.id && handleWeekDelete(week.id, week.weekLabel)} className="font-medium text-red-600 hover:underline">Verwijderen</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 )}
            </div>
        </div>
        {/* ... Modals ... */}
      </div>
      <EditItemModal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        onSave={handleSaveItem}
        item={currentItem}
      />
      <EditWeekModal
        isOpen={isWeekModalOpen}
        onClose={handleCloseWeekModal}
        onSave={handleSaveWeek}
        week={currentWeek}
      />
    </div>
  );
};

export default AdminPage;
