import { Dayjs } from 'dayjs';
import { createContext } from 'react';

export type DashboardDateContextType = {
  completeDate: Dayjs;
  setCompleteDate: (completeDate: Dayjs) => void;
};

export const DashboardDateContext = createContext<DashboardDateContextType | undefined>(undefined);
