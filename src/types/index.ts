import { Timestamp } from 'firebase/firestore'; // Importeer Timestamp

export interface PlanningItem {
  id?: string;
  title: string;
  description: string;
  link?: string;
  startDate: Timestamp | string;
  endDate: Timestamp | string;
  startTime?: string;
  endTime?: string;
  deadline?: Timestamp | string;
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
  id?: string;
  weekCode: string;
  weekLabel: string;
  startDate: Timestamp | string;
  semester: 1 | 2;
  isVacation: boolean;
}

export type SubjectFilter = keyof PlanningItem['subjects'] | 'all';
export type PhaseFilter = 'p' | 'h1' | 'h2h3' | 'all';