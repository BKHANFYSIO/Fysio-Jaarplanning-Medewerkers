import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../hooks/useAdminData';
import { useData } from '../hooks/useData'; // Using this hook for orphaned items
import { FileUploader } from '../components/FileUploader';
import { fetchAndExportAsCsv, fetchAndExportAsExcel, deleteItem, saveItem } from '../services/firestoreService';
import { PlanningItem, WeekInfo } from '../types';
import { useState, useMemo } from 'react';
import { EditItemModal } from '../components/EditItemModal';
import { useWeekData } from '../hooks/useWeekData';
import { EditWeekModal } from '../components/EditWeekModal';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/Accordion';
import { DevelopmentBannerSettings } from '../components/DevelopmentBannerSettings';
import { ChangesBannerSettings } from '../components/ChangesBannerSettings';
import { LogOut, Download, CheckCircle2, AlertTriangle, PlusCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

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
  const [openSections, setOpenSections] = useState<string[]>(['instructions']);
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

  // Placeholder voor toekomstige instellingenverwerking (momenteel niet gebruikt)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container p-4 mx-auto md:p-8">
        <Toaster position="bottom-right" />
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
        {/* Accordion controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setOpenSections(['instructions','status','activities','week-planning'])}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Alles uitklappen
          </button>
          <button
            onClick={() => setOpenSections([])}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Alles inklappen
          </button>
        </div>
        
        <Accordion type="multiple" value={openSections} onValueChange={(v:any)=>setOpenSections(v)} className="w-full space-y-4">
          <AccordionItem value="instructions" className="p-6 mb-8 bg-white rounded-lg shadow">
            <AccordionTrigger>
              <h2 className="text-xl font-semibold text-gray-700">Uitleg & Instructies</h2>
            </AccordionTrigger>
            <AccordionContent>
              {/* This is a nested accordion for the instructions */}
              <Accordion type="single" collapsible className="w-full mt-4 space-y-2">
                <AccordionItem value="csv-upload">
                   <AccordionTrigger className="font-semibold text-gray-600">Instructies voor bestand upload (semester-activiteiten)</AccordionTrigger>
                   <AccordionContent>
                      <div className="space-y-4 text-sm mt-2">
                        <p>Gebruik de bestand upload om in één keer een volledige planning voor een semester te importeren. Deze actie <strong>overschrijft alle bestaande activiteiten</strong> voor het gekozen semester.</p>
                        <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                          <h4 className="font-bold">Voorbereiden Excel (semester-activiteiten)</h4>
                          <ol className="ml-5 list-decimal">
                            <li>Open het moederbestand en filter op <strong>studentactiviteiten</strong> (bijv. via kleurselectie).</li>
                            <li>Selecteer en kopieer de relevante kolommen: <code>Titel</code>, <code>Extra regel</code>, <code>Instructies</code>, <code>Links</code>, <code>Startdatum</code>, <code>Einddatum</code>, onderwerpen en fases.</li>
                            <li>Plak deze kolommen in een <strong>nieuw</strong> Excel-bestand.</li>
                            <li>Sla dit bestand op als <strong>CSV</strong> of <strong>Excel (.xlsx)</strong>.</li>
                            <li>Let op kolom "Instructies":
                              <ul className="ml-5 list-disc">
                                <li>Staat er een <strong>URL</strong> (https://…), dan opent de kaart een nieuw tabblad.</li>
                                <li>Staat er <strong>korte tekst</strong>, dan opent de kaart een tekstvenster (popup) met deze instructie.</li>
                              </ul>
                            </li>
                            <li>Kolom "Links": gebruik het formaat <code>Titel: URL</code>. URL's moeten met <code>http</code> of <code>https</code> beginnen. Je kunt meerdere links achter elkaar plaatsen, gescheiden door een spatie of leesteken (bijv. komma, puntkomma, pipe of streepje). Begin bij elke volgende link <strong>opnieuw met een titel</strong> (dus <code>Titel: URL</code>), deze titel verschijnt als <strong>tooltip</strong> wanneer studenten met de muis over de link bewegen.</li>
                          </ol>
                          <div className="mt-3">
                            <a
                              href="/data/Aktiviteiten-voorbeeld.xlsx"
                              download
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                            >
                              <Download size={16} /> Voorbeeldbestand (activiteiten)
                            </a>
                          </div>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="links-as-text">
                            <AccordionTrigger className="font-semibold text-gray-600">Links als tekst plakken in Excel (klik hier om uit te klappen)</AccordionTrigger>
                            <AccordionContent>
                              <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 shadow-sm">
                                    <img
                                      src="/images/Links-als-tekst-toevoegen.jpg"
                                      alt="Links als tekst toevoegen in Excel"
                                      className="rounded w-full h-auto"
                                    />
                                  </div>
                                  <div>
                                    <ol className="ml-5 list-decimal text-sm space-y-1">
                                      <li>Ga in Excel naar <strong>Start</strong> &gt; klik op het pijltje onder <strong>Plakken</strong> &gt; kies <strong>Plakken speciaal</strong> &gt; selecteer <strong>Alleen tekst</strong> (of <strong>Tekst/Values</strong>). De geplakte link wordt dan als tekst ingevoegd, niet als klikbare hyperlink.</li>
                                      <li>Of plak de link in de <strong>formulebalk</strong>. Excel zet deze dan ook als tekst in de cel.</li>
                                      <li>Als extra optie kun je eerst een <strong>apostrof (')</strong> typen en daarna de link plakken om tekst te forceren.</li>
                                    </ol>
                                    <p className="mt-2 text-xs text-blue-900">Gebruik bij voorkeur het formaat <code>Titel: URL</code>. Voor meerdere links zet je items achter elkaar, gescheiden door een spatie of leesteken. Controleer dat elke URL met <code>http(s)</code> begint.</p>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
                          <h4 className="font-bold">Workflow (volg deze stappen altijd):</h4>
                          <ol className="ml-5 list-decimal">
                            <li><strong>Download altijd eerst een backup!</strong> Voordat je een nieuw bestand uploadt, klik op de "Download Backup" knop. Sla dit bestand veilig op. Mocht er iets misgaan, dan kun je deze backup gebruiken om de oude staat te herstellen.</li>
                            <li><strong>Bereid je bestand voor.</strong> Zorg ervoor dat je bestand de juiste kolommen heeft. De kolomkoppen moeten exact overeenkomen.
                              <ul className="ml-5 list-disc">
                                <li><strong>Voor Semester-activiteiten:</strong> <code>Titel (of wat)</code>, <code>Extra regel</code>, <code>Instructies</code>, <code>Links</code>, <code>Startdatum</code>, <code>Einddatum</code>, en de kolommen voor onderwerpen (<code>BVP</code>, <code>PZW</code>, etc.) en fases (<code>P</code>, <code>H1</code>, etc.).</li>
                                <li><strong>Links kolom formaat:</strong> Gebruik "Titel: URL" formaat, gescheiden door komma's. Bijv: "Inschrijflijst stage: https://example.com, KNGF site: https://defysiotherapeut.com/"</li>
                                <li><strong>Bestandsformaten:</strong> CSV (.csv) en Excel (.xlsx, .xls) worden ondersteund.</li>
                              </ul>
                            </li>
                            <li><strong>Upload het nieuwe bestand.</strong> Gebruik de upload-knop voor het juiste semester. Je krijgt een waarschuwing die je moet bevestigen voordat de oude data wordt gewist.</li>
                          </ol>
                        </div>
                      </div>
                   </AccordionContent>
                </AccordionItem>
                <AccordionItem value="week-upload">
                   <AccordionTrigger className="font-semibold text-gray-600">Instructies voor bestand upload (lesweekplanning)</AccordionTrigger>
                   <AccordionContent>
                      <div className="space-y-4 text-sm mt-2">
                        <p>Gebruik de bestand upload om de lesweekplanning te importeren. Deze actie <strong>overschrijft de volledige weekstructuur</strong> met de inhoud van het bestand.</p>
                        <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                          <h4 className="font-bold">Voorbereiden Excel (lesweekplanning)</h4>
                          <ol className="ml-5 list-decimal">
                            <li>Open het moederbestand en ga naar de lesweekplanning-tab.</li>
                            <li>Zorg dat de kolommen aanwezig zijn: <code>Weergave voor in app.</code>, een <strong>lege kolom</strong> voor datum (dd-mmm), en <code>jaar</code>.</li>
                            <li>Kopieer de rijen en plak deze in een <strong>nieuw</strong> Excel-bestand.</li>
                            <li>Sla op als <strong>CSV</strong> of <strong>Excel (.xlsx)</strong>.</li>
                            <li>Upload via "Upload Lesweekplanning" hieronder.</li>
                          </ol>
                          <div className="mt-3">
                            <a
                              href="/data/Lesweekplanning-voorbeeld.xlsx"
                              download
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                            >
                              <Download size={16} /> Voorbeeldbestand (lesweekplanning)
                            </a>
                          </div>
                        </div>
                      </div>
                   </AccordionContent>
                </AccordionItem>
                <AccordionItem value="direct-edit">
                   <AccordionTrigger className="font-semibold text-gray-600">Instructies voor Direct Bewerken</AccordionTrigger>
                   <AccordionContent>
                       <div className="space-y-4 text-sm mt-2">
                          <p>Gebruik de "Bewerken" en "Verwijderen" knoppen in de tabellen hieronder voor snelle, individuele aanpassingen. Dit is de veiligste en snelste manier om een typefout te herstellen, een datum aan te passen, of een enkele activiteit/week te verwijderen.</p>
                          <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                            <h4 className="font-bold">Belangrijk: Synchroniseer met het "Moederbestand"</h4>
                            <p>Als je organisatie een centraal Excel- of "moederbestand" gebruikt voor de planning, zorg er dan voor dat je de wijzigingen die je hier doorvoert, ook daar verwerkt. Dit voorkomt dat de data uit elkaar gaat lopen bij een volgende upload.</p>
                          </div>
                        </div>
                   </AccordionContent>
                </AccordionItem>
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="status" className="p-6 mb-8 bg-white rounded-lg shadow">
             <AccordionTrigger>
                <h2 className="text-xl font-semibold text-gray-700">Status & Instellingen</h2>
             </AccordionTrigger>
             <AccordionContent>
                <div className="grid grid-cols-1 gap-8 mt-4 lg:grid-cols-2">
                    {/* Data Integriteit Status */}
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-bold text-lg mb-2 text-indigo-800">Data Integriteit Status</h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Deze sectie controleert of alle activiteiten correct aan een week in de lesweekplanning gekoppeld kunnen worden.
                      </p>
                      {!orphanedLoading && (
                          <div className={`p-4 border-l-4 rounded-md ${orphanedItems.length > 0 ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-green-100 border-green-500 text-green-800'}`}>
                              {orphanedItems.length > 0 ? (
                                  <>
                                      <h4 className="flex items-center font-bold"><AlertTriangle size={20} className="mr-2"/>{orphanedItems.length} Wees-Activiteit(en)</h4>
                                      <ul className="mt-2 ml-5 text-sm list-disc">
                                          {orphanedItems.map(item => <li key={item.id}>{item.title} (Start: {item.startDate}, Eind: {item.endDate})</li>)}
                                      </ul>
                                  </>
                              ) : (
                                  <h4 className="flex items-center font-bold"><CheckCircle2 size={20} className="mr-2"/>Alle activiteiten zijn gekoppeld.</h4>
                              )}
                          </div>
                      )}
                    </div>

                    {/* Algemene Instellingen */}
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-bold text-lg mb-2 text-amber-800">Algemene Instellingen</h3>
                      <DevelopmentBannerSettings />
                      <hr className="my-4" />
                      <ChangesBannerSettings />
                    </div>
                </div>
             </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="activities" className="p-6 bg-white rounded-lg shadow">
              <AccordionTrigger>
                <h2 className="text-xl font-semibold text-gray-700">Activiteitenbeheer</h2>
              </AccordionTrigger>
              <AccordionContent>
                  <div className="space-y-6 mt-4">
                       <div>
                          <h3 className="font-bold">Stap 1: Maak een backup (Aanbevolen)</h3>
                          <p className="text-sm text-gray-600">Download de huidige planning als CSV of Excel bestand voordat je een nieuw bestand uploadt.</p>
                          <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                              <div className="space-y-2">
                                  <button onClick={() => fetchAndExportAsCsv('planning-items-sem1', `backup-sem1-${new Date().toISOString()}`)} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"> <Download size={16} /> CSV Sem 1</button>
                                  <button onClick={() => fetchAndExportAsExcel('planning-items-sem1', `backup-sem1-${new Date().toISOString()}`)} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"> <Download size={16} /> Excel Sem 1</button>
                              </div>
                              <div className="space-y-2">
                                  <button onClick={() => fetchAndExportAsCsv('planning-items-sem2', `backup-sem2-${new Date().toISOString()}`)} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"> <Download size={16} /> CSV Sem 2</button>
                                  <button onClick={() => fetchAndExportAsExcel('planning-items-sem2', `backup-sem2-${new Date().toISOString()}`)} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"> <Download size={16} /> Excel Sem 2</button>
                              </div>
                          </div>
                      </div>
                       <div>
                          <h3 className="font-bold">Stap 2: Importeer een volledige planning</h3>
                          <p className="text-sm text-gray-600">Deze actie overschrijft alle bestaande activiteiten voor het gekozen semester. Ondersteunde formaten: CSV, Excel (.xlsx, .xls).</p>
                          <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                             <FileUploader label="Upload Semester 1" collectionName="planning-items-sem1" />
                             <FileUploader label="Upload Semester 2" collectionName="planning-items-sem2" />
                          </div>
                      </div>
                       <div>
                          <h3 className="font-bold">Stap 3: Maak kleine aanpassingen</h3>
                          <p className="text-sm text-gray-600">Voeg een enkele activiteit toe of gebruik de "Bewerken/Verwijderen" knoppen in de tabel hieronder.</p>
                          <div className="mt-2">
                              <button onClick={handleAddNewItem} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"> <PlusCircle size={18} /> Nieuw Item Toevoegen </button>
                          </div>
                      </div>
                  </div>
                  <hr className="my-6"/>
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
              </AccordionContent>
          </AccordionItem>

          <AccordionItem value="week-planning" className="p-6 bg-white rounded-lg shadow">
            <AccordionTrigger>
              <h2 className="text-xl font-semibold text-gray-700">Lesweekplanning Beheer</h2>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-6 mt-4">
                     <div>
                        <h3 className="font-bold">Stap 1: Maak een backup (Aanbevolen)</h3>
                        <p className="text-sm text-gray-600">Download de huidige lesweekplanning als CSV of Excel bestand.</p>
                         <div className="mt-2 space-y-2">
                             <button onClick={() => fetchAndExportAsCsv('week-planning', `backup-weken-${new Date().toISOString()}`)} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"> <Download size={16} /> CSV Backup Weken</button>
                             <button onClick={() => fetchAndExportAsExcel('week-planning', `backup-weken-${new Date().toISOString()}`)} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"> <Download size={16} /> Excel Backup Weken</button>
                         </div>
                    </div>
                     <div>
                        <h3 className="font-bold">Stap 2: Importeer een volledige lesweekplanning</h3>
                        <p className="text-sm text-gray-600">Overschrijf de volledige planning. Tip: combineer studiejaren (bijv. semester 2 van dit jaar en het volledige komende jaar) in één bestand voor een soepele overgang. Ondersteunde formaten: CSV, Excel (.xlsx, .xls).</p>
                         <div className="mt-2">
                            <FileUploader label="Upload Lesweekplanning" collectionName="week-planning" customParser={parseWeekCsvForUpload}/>
                         </div>
                    </div>
                     <div>
                        <h3 className="font-bold">Stap 3: Maak kleine aanpassingen</h3>
                        <p className="text-sm text-gray-600">Gebruik de "Bewerken/Verwijderen" knoppen in de tabel hieronder voor snelle, individuele wijzigingen.</p>
                    </div>
                </div>
                 <hr className="my-6"/>
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
