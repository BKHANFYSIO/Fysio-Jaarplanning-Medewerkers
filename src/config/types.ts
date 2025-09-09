export interface FilterOption {
  value: string;
  label: string;
  color: string;
  isOther?: boolean; // markeer 'overig' voor speciale positionering/styling
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'pills' | 'dropdown';
  dataKey: 'phases' | 'subjects' | 'semester' | 'role' | 'processes';
  options: FilterOption[];
}
