import React, { useState, useEffect } from 'react';
import { WeekInfo } from '../types';

interface EditWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (week: WeekInfo) => void;
  week: WeekInfo | null;
}

export const EditWeekModal: React.FC<EditWeekModalProps> = ({ isOpen, onClose, onSave, week }) => {
  const [formData, setFormData] = useState<WeekInfo | null>(null);

  useEffect(() => {
    setFormData(week);
  }, [week]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-2xl font-bold">Week Bewerken</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="weekLabel" className="block text-sm font-medium">Week Label</label>
            <input type="text" name="weekLabel" value={formData.weekLabel} onChange={handleChange} className="w-full p-2 mt-1 border rounded" />
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium">Startdatum</label>
            <input type="text" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full p-2 mt-1 border rounded" placeholder="dd-mmm"/>
          </div>

          <div className="flex items-center">
            <input type="checkbox" name="isVacation" checked={!!formData.isVacation} onChange={handleChange} className="w-4 h-4 mr-2"/>
            <label htmlFor="isVacation" className="block text-sm font-medium">Is Vakantie?</label>
          </div>

          <div className="flex justify-end pt-4 space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300">Annuleren</button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Opslaan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
