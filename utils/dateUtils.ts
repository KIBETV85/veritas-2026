export const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const formatDateFull = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const generateCalendarGrid = (year: number, month: number, selectedDate: Date): Date[] => {
  const firstDayIndex = getFirstDayOfMonth(year, month); // 0 = Sunday
  const daysInMonth = getDaysInMonth(year, month);
  
  const days: Date[] = [];
  
  // Previous month filler
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  // Next month filler to complete the grid (usually 35 or 42 cells)
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
};