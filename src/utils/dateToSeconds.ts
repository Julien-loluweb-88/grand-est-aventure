export function dateToSeconds(endDateStr: string): number | null {
    const end = new Date(endDateStr);
    if (Number.isNaN(end.getTime())) return null;
    const now = new Date();
    const diff = Math.floor((end.getTime() - now.getTime()) / 1000);
    return diff > 0 ? diff : null;
  }