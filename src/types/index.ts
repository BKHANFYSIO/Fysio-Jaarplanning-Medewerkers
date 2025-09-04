export interface PlanningItem {
  [key: string]: any; // Allow dynamic property access for robust filtering/editing
  id?: string;
  collection?: string;
  semester?: number; // Add semester
  weekCode?: string; // Add weekCode
  role?: string; // Nieuwe optionele kolom voor rol/gebruiker
  title: string;
  description: string;
  instructions?: string; // Vervangt de oude 'link' kolom
  links?: string[]; // Nieuwe kolom voor titel:URL format
  link?: string; // Behoud voor backward compatibility
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  deadline?: string | null;
  isFirstInSeries?: boolean;
  isLastInSeries?: boolean;
  seriesLength?: number;
  // Status tracking voor Excel export/import
  status?: 'Nieuw' | 'Bewerkt' | 'Ongewijzigd';
  lastModified?: string;
  modifiedBy?: string;
  opmerkingen?: string;
  subjects: {
    [key: string]: boolean; // Add index signature
    waarderen: boolean;
    juniorstage: boolean;
    ipl: boolean;
    bvp: boolean;
    pzw: boolean;
    minor: boolean;
    getuigschriften: boolean;
    inschrijven: boolean;
    overig: boolean;
    meeloops: boolean;
  };
  phases: {
    [key: string]: boolean; // Add index signature
    p: boolean;
    h1: boolean;
    h2h3: boolean;
  };
}

export interface WeekInfo {
  id?: string;
  year?: number;
  weekCode: string;
  weekLabel: string;
  startDate: string;
  semester: 1 | 2;
  isVacation: boolean;
}

export type SubjectFilter = keyof PlanningItem['subjects'] | 'all';
export type PhaseFilter = 'p' | 'h1' | 'h2h3' | 'all';