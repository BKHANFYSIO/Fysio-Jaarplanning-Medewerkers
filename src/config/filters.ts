export type FilterOption = {
  value: string;
  label: string;
  color: string;
};

export type FilterConfig = {
  id: string;
  label: string;
  type: 'pills' | 'dropdown';
  options: FilterOption[];
  dataKey: 'phases' | 'subjects' | 'semester';
};

export const filterConfig: FilterConfig[] = [
  {
    id: 'semester',
    label: 'Semester',
    type: 'pills',
    dataKey: 'semester',
    options: [
      { value: '1', label: 'Semester 1', color: 'blue' },
      { value: '2', label: 'Semester 2', color: 'red' },
    ],
  },
  {
    id: 'phase',
    label: 'Studiefase',
    type: 'pills',
    dataKey: 'phases',
    options: [
      { value: 'p', label: 'P', color: 'green' },
      { value: 'h1', label: 'H1', color: 'orange' },
      { value: 'h2h3', label: 'H2/3', color: 'purple' },
      { value: 'algemeen', label: 'Algemeen', color: 'gray' },
    ],
  },
  {
    id: 'subject',
    label: 'Onderwerp',
    type: 'pills',
    dataKey: 'subjects',
    options: [
        { value: 'bvp', label: 'BVP', color: 'orange' },
        { value: 'pzw', label: 'PZW', color: 'pink' },
        { value: 'minor', label: 'Minor', color: 'indigo' },
        { value: 'ipl', label: 'IPL', color: 'blue' },
        { value: 'juniorstage', label: 'Juniorstage', color: 'green' },
        { value: 'waarderen', label: 'Waarderen', color: 'yellow' },
        { value: 'getuigschriften', label: 'Getuigschriften', color: 'gray' },
        { value: 'inschrijven', label: 'Inschrijven', color: 'teal' },
        { value: 'overig', label: 'Overig', color: 'slate' },
    ],
  },
];
