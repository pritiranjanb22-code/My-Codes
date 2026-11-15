'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { School } from '@/types';

interface SchoolContextType {
  currentSchool: School | null;
  schools: School[];
  setCurrentSchool: (school: School) => void;
  setSchools: (schools: School[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  const setCurrentSchoolWrapper = useCallback((school: School) => {
    setCurrentSchool(school);
    if (typeof window !== 'undefined') {
      localStorage.setItem('school_current_school', JSON.stringify(school));
    }
  }, []);

  return (
    <SchoolContext.Provider value={{ currentSchool, schools, setCurrentSchool: setCurrentSchoolWrapper, setSchools, loading, setLoading }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}