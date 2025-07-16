export interface PlanningItem {
  title: string;
  description: string;
  link?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  deadline?: string;
  subjects: {
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