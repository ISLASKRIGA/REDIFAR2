import { useMemo } from 'react';
import { getHospitalColor } from '../utils/hospitalColors';

export const useHospitalColor = (hospitalId?: string) => {
  return useMemo(() => {
    if (!hospitalId) {
      // Default color scheme if no hospital ID
      return {
        primary: 'bg-gray-600',
        secondary: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-500',
        gradient: 'from-gray-500 to-gray-600',
        hover: 'hover:bg-gray-700',
        light: 'bg-gray-100',
        dark: 'bg-gray-800'
      };
    }
    
    return getHospitalColor(hospitalId);
  }, [hospitalId]);
};