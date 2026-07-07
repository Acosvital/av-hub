import { DashboardDateContext } from '@/contexts/DashboardDateContext';
import dayjs, { Dayjs } from 'dayjs';
import { ReactNode, useState } from 'react';

export function DashboardDateProvider({ children }: { children: ReactNode }) {
  const [completeDate, setCompleteDate] = useState<Dayjs>(dayjs());

  return (
    <DashboardDateContext.Provider value={{ completeDate, setCompleteDate }}>
      {children}
    </DashboardDateContext.Provider>
  );
}
