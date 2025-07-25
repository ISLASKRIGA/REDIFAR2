// Hospital color system - assigns unique colors to each hospital
export const hospitalColors = [
  {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    hover: 'hover:bg-blue-700',
    light: 'bg-blue-100',
    dark: 'bg-blue-800'
  },
  {
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
    hover: 'hover:bg-emerald-700',
    light: 'bg-emerald-100',
    dark: 'bg-emerald-800'
  },
  {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    hover: 'hover:bg-purple-700',
    light: 'bg-purple-100',
    dark: 'bg-purple-800'
  },
  {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-500',
    gradient: 'from-orange-500 to-orange-600',
    hover: 'hover:bg-orange-700',
    light: 'bg-orange-100',
    dark: 'bg-orange-800'
  },
  {
    primary: 'bg-teal-600',
    secondary: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-500',
    gradient: 'from-teal-500 to-teal-600',
    hover: 'hover:bg-teal-700',
    light: 'bg-teal-100',
    dark: 'bg-teal-800'
  },
  {
    primary: 'bg-rose-600',
    secondary: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-500',
    gradient: 'from-rose-500 to-rose-600',
    hover: 'hover:bg-rose-700',
    light: 'bg-rose-100',
    dark: 'bg-rose-800'
  },
  {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-500',
    gradient: 'from-indigo-500 to-indigo-600',
    hover: 'hover:bg-indigo-700',
    light: 'bg-indigo-100',
    dark: 'bg-indigo-800'
  },
  {
    primary: 'bg-cyan-600',
    secondary: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-500',
    gradient: 'from-cyan-500 to-cyan-600',
    hover: 'hover:bg-cyan-700',
    light: 'bg-cyan-100',
    dark: 'bg-cyan-800'
  },
  {
    primary: 'bg-amber-600',
    secondary: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-500',
    gradient: 'from-amber-500 to-amber-600',
    hover: 'hover:bg-amber-700',
    light: 'bg-amber-100',
    dark: 'bg-amber-800'
  },
  {
    primary: 'bg-pink-600',
    secondary: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-500',
    gradient: 'from-pink-500 to-pink-600',
    hover: 'hover:bg-pink-700',
    light: 'bg-pink-100',
    dark: 'bg-pink-800'
  }
];

export const getHospitalColor = (hospitalId: string) => {
  // Create a simple hash from hospital ID to ensure consistent color assignment
  let hash = 0;
  for (let i = 0; i < hospitalId.length; i++) {
    const char = hospitalId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % hospitalColors.length;
  return hospitalColors[index];
};

export const getHospitalColorByIndex = (index: number) => {
  return hospitalColors[index % hospitalColors.length];
};