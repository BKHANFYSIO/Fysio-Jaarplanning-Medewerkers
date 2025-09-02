export interface FilterOption {
  value: string;
  label: string;
  color: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'pills' | 'dropdown';
  dataKey: 'phases' | 'subjects' | 'semester' | 'role';
  options: FilterOption[];
}
