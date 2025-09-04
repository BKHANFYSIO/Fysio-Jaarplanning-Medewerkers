import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ExternalLink, Folder, FolderOpen } from 'lucide-react';
import { useSnelkoppelingen, Snelkoppeling, SnelkoppelingenGroep } from '../hooks/useSnelkoppelingen';

export const SnelkoppelingenAdmin = () => {
  const { 
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
  } = useSnelkoppelingen();
  
  const [activeTab, setActiveTab] = useState<'groepen' | 'snelkoppelingen'>('groepen');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titel: '',
    url: '',
    beschrijving: '',
    actief: true,
    volgorde: 0,
    groepId: ''
  });
  const [groepFormData, setGroepFormData] = useState({
    naam: '',
    beschrijving: '',
    actief: true,
    volgorde: 0
  });

  const resetForm = () => {
    setFormData({
      titel: '',
      url: '',
      beschrijving: '',
      actief: true,
      volgorde: snelkoppelingen.length,
      groepId: groepen.length > 0 ? groepen[0].id : ''
    });
  };

  const resetGroepForm = () => {
    setGroepFormData({
      naam: '',
      beschrijving: '',
      actief: true,
      volgorde: groepen.length
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAdding(true);
    setEditingId(null);
  };

  const handleAddGroep = () => {
    resetGroepForm();
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (snelkoppeling: Snelkoppeling) => {
    setFormData({
      titel: snelkoppeling.titel,
      url: snelkoppeling.url,
      beschrijving: snelkoppeling.beschrijving || '',
      actief: snelkoppeling.actief,
      volgorde: snelkoppeling.volgorde,
      groepId: snelkoppeling.groepId
    });
    setEditingId(snelkoppeling.id);
    setIsAdding(false);
  };

  const handleEditGroep = (groep: SnelkoppelingenGroep) => {
    setGroepFormData({
      naam: groep.naam,
      beschrijving: groep.beschrijving || '',
      actief: groep.actief,
      volgorde: groep.volgorde
    });
    setEditingId(groep.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
    resetGroepForm();
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'groepen') {
        if (editingId) {
          await updateGroep(editingId, groepFormData);
        } else {
          await addGroep(groepFormData);
        }
      } else {
        if (editingId) {
          await updateSnelkoppeling(editingId, formData);
        } else {
          await addSnelkoppeling(formData);
        }
      }
      handleCancel();
    } catch (err) {
      console.error('Error saving:', err);
      alert(`Fout bij het opslaan van de ${activeTab === 'groepen' ? 'groep' : 'snelkoppeling'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je deze snelkoppeling wilt verwijderen?')) {
      try {
        await deleteSnelkoppeling(id);
      } catch (err) {
        console.error('Error deleting snelkoppeling:', err);
        alert('Fout bij het verwijderen van de snelkoppeling');
      }
    }
  };

  const handleDeleteGroep = async (id: string) => {
    if (confirm('Weet je zeker dat je deze groep wilt verwijderen? Alle snelkoppelingen in deze groep worden ook verwijderd.')) {
      try {
        await deleteGroep(id);
      } catch (err) {
        console.error('Error deleting groep:', err);
        alert('Fout bij het verwijderen van de groep');
      }
    }
  };

  const handleToggleActief = async (id: string, actief: boolean) => {
    try {
      if (activeTab === 'groepen') {
        await updateGroep(id, { actief: !actief });
      } else {
        await updateSnelkoppeling(id, { actief: !actief });
      }
    } catch (err) {
      console.error('Error toggling:', err);
      alert('Fout bij het wijzigen van de status');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
          Snelkoppelingen Beheer
        </h2>
        <button
          onClick={activeTab === 'groepen' ? handleAddGroep : handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nieuwe {activeTab === 'groepen' ? 'groep' : 'snelkoppeling'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('groepen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'groepen'
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
          }`}
        >
          <Folder size={16} />
          Groepen
        </button>
        <button
          onClick={() => setActiveTab('snelkoppelingen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'snelkoppelingen'
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
          }`}
        >
          <ExternalLink size={16} />
          Snelkoppelingen
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">
            {editingId ? `${activeTab === 'groepen' ? 'Groep' : 'Snelkoppeling'} bewerken` : `Nieuwe ${activeTab === 'groepen' ? 'groep' : 'snelkoppeling'}`}
          </h3>
          
          {activeTab === 'groepen' ? (
            // Groep form
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Naam *
                </label>
                <input
                  type="text"
                  value={groepFormData.naam}
                  onChange={(e) => setGroepFormData(prev => ({ ...prev, naam: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Bijv. Docenten Tools"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Volgorde
                </label>
                <input
                  type="number"
                  value={groepFormData.volgorde}
                  onChange={(e) => setGroepFormData(prev => ({ ...prev, volgorde: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Beschrijving
                </label>
                <input
                  type="text"
                  value={groepFormData.beschrijving}
                  onChange={(e) => setGroepFormData(prev => ({ ...prev, beschrijving: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Optionele beschrijving"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={groepFormData.actief}
                    onChange={(e) => setGroepFormData(prev => ({ ...prev, actief: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">Actief</span>
                </label>
              </div>
            </div>
          ) : (
            // Snelkoppeling form
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.titel}
                  onChange={(e) => setFormData(prev => ({ ...prev, titel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Bijv. Docenten portal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Groep *
                </label>
                <select
                  value={formData.groepId}
                  onChange={(e) => setFormData(prev => ({ ...prev, groepId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">Selecteer een groep</option>
                  {groepen.map(groep => (
                    <option key={groep.id} value={groep.id}>{groep.naam}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Volgorde
                </label>
                <input
                  type="number"
                  value={formData.volgorde}
                  onChange={(e) => setFormData(prev => ({ ...prev, volgorde: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Beschrijving
                </label>
                <input
                  type="text"
                  value={formData.beschrijving}
                  onChange={(e) => setFormData(prev => ({ ...prev, beschrijving: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Optionele beschrijving"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.actief}
                    onChange={(e) => setFormData(prev => ({ ...prev, actief: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">Actief</span>
                </label>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={
                activeTab === 'groepen' 
                  ? !groepFormData.naam 
                  : !formData.titel || !formData.url || !formData.groepId
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              Opslaan
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X size={16} />
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="space-y-3">
        {activeTab === 'groepen' ? (
          // Groepen lijst
          groepen.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              <Folder size={48} className="mx-auto mb-2 opacity-50" />
              <p>Geen groepen gevonden. Voeg er een toe om te beginnen.</p>
            </div>
          ) : (
            groepen.map((groep) => {
              const snelkoppelingenInGroep = snelkoppelingen.filter(s => s.groepId === groep.id);
              return (
                <div
                  key={groep.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    groep.actief 
                      ? 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800' 
                      : 'border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${groep.actief ? 'text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'}`}>
                          {groep.naam}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300">
                          #{groep.volgorde}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          {snelkoppelingenInGroep.length} links
                        </span>
                        {!groep.actief && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            Inactief
                          </span>
                        )}
                      </div>
                      {groep.beschrijving && (
                        <p className={`text-sm mb-2 ${groep.actief ? 'text-gray-600 dark:text-slate-400' : 'text-gray-500 dark:text-slate-500'}`}>
                          {groep.beschrijving}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActief(groep.id, groep.actief)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          groep.actief
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                        }`}
                      >
                        {groep.actief ? 'Actief' : 'Inactief'}
                      </button>
                      <button
                        onClick={() => handleEditGroep(groep)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Bewerken"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteGroep(groep.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          // Snelkoppelingen lijst
          snelkoppelingen.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              <ExternalLink size={48} className="mx-auto mb-2 opacity-50" />
              <p>Geen snelkoppelingen gevonden. Voeg er een toe om te beginnen.</p>
            </div>
          ) : (
            snelkoppelingen.map((snelkoppeling) => {
              const groep = groepen.find(g => g.id === snelkoppeling.groepId);
              return (
                <div
                  key={snelkoppeling.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    snelkoppeling.actief 
                      ? 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800' 
                      : 'border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${snelkoppeling.actief ? 'text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'}`}>
                          {snelkoppeling.titel}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300">
                          #{snelkoppeling.volgorde}
                        </span>
                        {groep && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            {groep.naam}
                          </span>
                        )}
                        {!snelkoppeling.actief && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            Inactief
                          </span>
                        )}
                      </div>
                      {snelkoppeling.beschrijving && (
                        <p className={`text-sm mb-2 ${snelkoppeling.actief ? 'text-gray-600 dark:text-slate-400' : 'text-gray-500 dark:text-slate-500'}`}>
                          {snelkoppeling.beschrijving}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-slate-500 font-mono">
                        {snelkoppeling.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActief(snelkoppeling.id, snelkoppeling.actief)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          snelkoppeling.actief
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                        }`}
                      >
                        {snelkoppeling.actief ? 'Actief' : 'Inactief'}
                      </button>
                      <button
                        onClick={() => handleEdit(snelkoppeling)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Bewerken"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(snelkoppeling.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
