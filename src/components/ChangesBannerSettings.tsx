import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { Save, Bell } from 'lucide-react';
import { useSettings, BannerSettings, ChangeItem } from '../hooks/useSettings';
import { toast } from 'react-hot-toast';

export const ChangesBannerSettings: React.FC = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<BannerSettings | null>(null);
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [draftItem, setDraftItem] = useState<ChangeItem | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalConfig(settings.changesBanner);
    }
  }, [settings]);

  const handleSave = async () => {
    if (localConfig) {
      try {
        const sanitizedItems: ChangeItem[] = ensureItemsArray(localConfig).map((it) => {
          const item: any = {
            id: it.id || generateId(),
            title: it.title || '',
            content: it.content || '',
            visibleUntil: it.visibleUntil || new Date().toISOString(),
          };
          if (it.visibleFrom) item.visibleFrom = it.visibleFrom;
          return item as ChangeItem;
        });

        const payload = {
          changesBanner: {
            enabled: Boolean(localConfig.enabled),
            title: localConfig.title || '',
            description: localConfig.description || '',
            autoHideDelay: Number.isFinite(localConfig.autoHideDelay) ? localConfig.autoHideDelay : 0,
            items: sanitizedItems,
          },
        } as const;

        await updateSettings(payload);
        toast.success('Instellingen voor wijzigingenbanner opgeslagen!');
        setIsEditing(false);
      } catch (error) {
        toast.error('Fout bij opslaan van instellingen.');
        console.error(error);
      }
    }
  };

  const handleCancel = () => {
    if (settings) {
      setLocalConfig(settings.changesBanner);
    }
    setIsEditing(false);
  };

  const handleToggleBanner = () => {
    setLocalConfig(prev => prev ? { ...prev, enabled: !prev.enabled } : null);
  };

  const handleTextChange = (field: 'title' | 'description', value: string) => {
    setLocalConfig(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleDelayChange = (value: string) => {
    setLocalConfig(prev => prev ? { ...prev, autoHideDelay: parseInt(value, 10) || 0 } : null);
  }

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }],
      ['link'],
      ['clean'],
    ],
  } as const;

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'color',
    'link',
  ];

  const ensureItemsArray = (cfg: BannerSettings | null): ChangeItem[] => {
    return cfg?.items ? [...cfg.items] : [];
  };

  const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const isoToLocalInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const localInputToIso = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    return d.toISOString();
  };

  const openNewItem = () => {
    setEditingItemIndex(null);
    setDraftItem({ id: generateId(), title: '', content: '', visibleUntil: '', visibleFrom: '' });
    setIsItemEditorOpen(true);
  };

  const openEditItem = (index: number) => {
    const items = ensureItemsArray(localConfig);
    const it = items[index];
    if (!it) return;
    setEditingItemIndex(index);
    setDraftItem({ ...it });
    setIsItemEditorOpen(true);
  };

  const deleteItemAt = async (index: number) => {
    setLocalConfig(prev => {
      if (!prev) return prev;
      const items = ensureItemsArray(prev);
      items.splice(index, 1);
      return { ...prev, items };
    });
    const cfg = localConfig || settings?.changesBanner;
    if (cfg) {
      const items = ensureItemsArray(cfg);
      items.splice(index, 1);
      await updateSettings({
        changesBanner: {
          enabled: Boolean(cfg.enabled),
          title: cfg.title || '',
          description: cfg.description || '',
          autoHideDelay: Number.isFinite(cfg.autoHideDelay) ? cfg.autoHideDelay : 0,
          items,
        },
      });
      toast.success('Item verwijderd en opgeslagen');
    }
  };

  const saveDraftItem = async () => {
    if (!draftItem || !draftItem.title || !draftItem.visibleUntil) {
      toast.error('Titel en einddatum zijn verplicht.');
      return;
    }
    // Normaliseer draft naar veilige velden (zonder undefined)
    const makeSafeItem = (it: ChangeItem): ChangeItem => {
      const untilIso = localInputToIso(isoToLocalInput(it.visibleUntil) ? isoToLocalInput(it.visibleUntil) : it.visibleUntil) || it.visibleUntil;
      const safe: any = {
        id: it.id || generateId(),
        title: it.title || '',
        content: it.content || '',
        visibleUntil: untilIso,
      };
      if (it.visibleFrom) {
        const fromIso = localInputToIso(isoToLocalInput(it.visibleFrom) ? isoToLocalInput(it.visibleFrom) : it.visibleFrom);
        if (fromIso) safe.visibleFrom = fromIso;
      }
      return safe as ChangeItem;
    };
    const normalized = makeSafeItem(draftItem);
    // Bereken nieuwe items en sla direct op in Firestore (items-only autosave)
    const baseCfg = localConfig || settings?.changesBanner;
    if (baseCfg) {
      const items = ensureItemsArray(baseCfg);
      if (editingItemIndex === null) {
        items.push(normalized);
      } else {
        items[editingItemIndex] = normalized;
      }
      // Sanitize hele lijst voor Firestore (geen undefined binnen objecten)
      const sanitizedItems = items.map(makeSafeItem);
      setLocalConfig({ ...baseCfg, items: sanitizedItems });
      try {
        await updateSettings({
          changesBanner: {
            enabled: Boolean(baseCfg.enabled),
            title: baseCfg.title || '',
            description: baseCfg.description || '',
            autoHideDelay: Number.isFinite(baseCfg.autoHideDelay) ? baseCfg.autoHideDelay : 0,
            items: sanitizedItems,
          },
        });
        toast.success('Item opgeslagen');
      } catch (e) {
        console.error(e);
        toast.error('Opslaan mislukt');
        return; // editor niet sluiten bij fout
      }
    }
    setIsItemEditorOpen(false);
    setDraftItem(null);
    setEditingItemIndex(null);
  };

  const cancelDraft = () => {
    setIsItemEditorOpen(false);
    setDraftItem(null);
    setEditingItemIndex(null);
  };

  if (loading) {
    return <div>Instellingen laden...</div>;
  }

  if (!settings || !localConfig) {
    return <div>Kon instellingen niet laden.</div>;
  }

  const config = settings.changesBanner;

  return (
    <div className="space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="font-medium">Wijzigingenbeheer</span>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            Bewerken
          </button>
        )}
      </div>

      {/* Uitleg weergave */}
      <div className="p-3 rounded-lg border bg-gray-50">
        <div className="text-sm font-medium text-gray-700">Weergave: automatisch, alleen als er actieve items zijn</div>
        <p className="text-xs text-gray-500 mt-1">Een item is actief als de huidige tijd tussen “Zichtbaar vanaf” (optioneel) en “Zichtbaar t/m” ligt.</p>
      </div>

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
          {/* Items beheer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Losse wijzigingsitems</label>
              <button onClick={openNewItem} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700">Nieuw item</button>
            </div>
            <p className="text-xs text-gray-500">Items worden getoond tot en met hun einddatum. Vergeet niet op Opslaan te klikken om wijzigingen permanent op te slaan.</p>
            <div className="space-y-2">
              {ensureItemsArray(localConfig).length === 0 && (
                <div className="text-xs text-gray-500">Nog geen items toegevoegd.</div>
              )}
              {ensureItemsArray(localConfig).map((it, idx) => (
                <div key={it.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{it.title}</div>
                    <div className="text-xs text-gray-600">Zichtbaar t/m: {isoToLocalInput(it.visibleUntil).replace('T',' ')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditItem(idx)} className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200">Bewerken</button>
                    <button onClick={() => deleteItemAt(idx)} className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200">Verwijderen</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isItemEditorOpen && draftItem && (
            <div className="p-3 border rounded bg-white space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Titel</label>
                <input
                  type="text"
                  value={draftItem.title}
                  onChange={(e) => setDraftItem(prev => prev ? { ...prev, title: e.target.value } : prev)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Korte titel van de wijziging"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Inhoud</label>
                <div className="border border-gray-300 rounded-md">
                  <ReactQuill
                    theme="snow"
                    value={draftItem.content}
                    onChange={(value) => setDraftItem(prev => prev ? { ...prev, content: value } : prev)}
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Zichtbaar vanaf (optioneel)</label>
                  <input
                    type="datetime-local"
                    value={isoToLocalInput(draftItem.visibleFrom)}
                    onChange={(e) => setDraftItem(prev => prev ? { ...prev, visibleFrom: e.target.value ? localInputToIso(e.target.value) : '' } : prev)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Zichtbaar t/m (verplicht)</label>
                  <input
                    type="datetime-local"
                    value={isoToLocalInput(draftItem.visibleUntil)}
                    onChange={(e) => setDraftItem(prev => prev ? { ...prev, visibleUntil: e.target.value ? localInputToIso(e.target.value) : '' } : prev)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={cancelDraft} className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Annuleren</button>
                <button onClick={saveDraftItem} className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Opslaan</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Auto-hide Tijd (seconden)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="300"
                value={localConfig.autoHideDelay}
                onChange={(e) => handleDelayChange(e.target.value)}
                className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15"
              />
              <span className="text-sm text-gray-600">
                seconden (0 = geen auto-hide)
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Tijd voordat de banner automatisch verdwijnt. Zet op 0 om auto-hide uit te schakelen.
            </p>
          </div>

          <div className="flex items-center justify-end pt-2">
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {true && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Banner Voorvertoning:</h4>
          <div className="text-blue-800">
            {(() => {
              const now = new Date();
              const items = ensureItemsArray(config).filter(it => {
                try {
                  const until = new Date(it.visibleUntil);
                  const from = it.visibleFrom ? new Date(it.visibleFrom) : null;
                  const afterFrom = from ? now >= from : true;
                  return afterFrom && now <= until;
                } catch {
                  return false;
                }
              });
              return items.length > 0 ? (
                <ul className="mt-1 text-xs space-y-1 list-disc pl-5">
                  {items.map(it => (
                    <li key={it.id} className="[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_em]:italic [&_a]:underline [&_a]:text-blue-700">
                      <span className="font-medium">{it.title}: </span>
                      <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(it.content, { USE_PROFILES: { html: true }, ALLOWED_ATTR: ['href','target','rel','style'] }) }} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-gray-600">Geen actieve items op dit moment.</div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
