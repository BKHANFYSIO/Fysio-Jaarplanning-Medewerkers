import React, { useState, useEffect } from 'react';
import { PlanningItem } from '../types';
import { filterConfig } from '../config/filters';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PlanningItem) => void;
  item: PlanningItem | null;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, onSave, item }) => {
  const [formData, setFormData] = useState<PlanningItem | null>(null);

  useEffect(() => {
    setFormData(item);
  }, [item]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Special handling for links textarea
    if (name === 'links') {
      setFormData(prev => prev ? { ...prev, links: value.split('\n') } : null);
    } else {
      setFormData(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleCheckboxChange = (group: 'phases' | 'subjects', key: string) => {
    setFormData(prev => {
      if (!prev) return null;
      
      const currentGroup = prev[group];
      // Type guard to ensure we're working with a valid object
      if (typeof currentGroup === 'object' && currentGroup !== null) {
        const newGroupState = { ...currentGroup, [key]: !currentGroup[key] };
        return { ...prev, [group]: newGroupState };
      }
      return prev; // Return previous state if group is not a valid object
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-2xl font-bold">Item Bewerken</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium">Titel</label>
            <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">Beschrijving</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded"></textarea>
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium">Instructies</label>
            <input type="text" name="instructions" value={formData.instructions || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" placeholder="https://... of korte tekst"/>
          </div>

          <div>
            <label htmlFor="links" className="block text-sm font-medium">Links (één per regel)</label>
            <textarea name="links" value={formData.links?.join('\n') || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" placeholder="Titel: https://...&#10;Andere Titel: https://..."></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium">Startdatum</label>
              <input type="text" name="startDate" value={formData.startDate || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" placeholder="dd-mm-jjjj"/>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium">Einddatum</label>
              <input type="text" name="endDate" value={formData.endDate || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" placeholder="dd-mm-jjjj"/>
            </div>
            <div>
              <label htmlFor="tijd_startdatum" className="block text-sm font-medium">Tijd Startdatum</label>
              <input type="text" name="tijd_startdatum" value={formData.tijd_startdatum || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" placeholder="HH:MM"/>
            </div>
            <div>
              <label htmlFor="tijd_einddatum" className="block text-sm font-medium">Tijd Einddatum</label>
              <input type="text" name="tijd_einddatum" value={formData.tijd_einddatum || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" placeholder="HH:MM"/>
            </div>
          </div>

          {filterConfig.filter(c => c.id !== 'semester').map(config => (
            <div key={config.id}>
              <h4 className="font-semibold">{config.label}</h4>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {config.options.map(option => (
                  <label key={option.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!((formData[config.dataKey as 'phases' | 'subjects'] as Record<string, boolean> | undefined)?.[option.value])}
                      onChange={() => handleCheckboxChange(config.dataKey as 'phases' | 'subjects', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4 space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300">Annuleren</button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Opslaan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
