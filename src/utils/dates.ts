export const dateUtils = {
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },

  formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  },

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
};