export interface PlanningItem {
  [key: string]: any; // Allow dynamic property access
  id?: string;
  collection?: string;
  semester?: number; // Add semester
  weekCode?: string; // Add weekCode
  title: string;
  description: string;
  link?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  deadline?: string;
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
  };
  phases: {
    [key: string]: boolean; // Add index signature
    p: boolean;
    h1: boolean;
    h2h3: boolean;
  };
}

export interface WeekInfo {
  weekCode: string;
  weekLabel: string;
  startDate: string;
  semester: 1 | 2;
  isVacation: boolean;
}

export type SubjectFilter = keyof PlanningItem['subjects'] | 'all';
export type PhaseFilter = 'p' | 'h1' | 'h2h3' | 'all';