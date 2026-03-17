export function durationToSeconds(duration: string): number | null {
    switch (duration) {
      case "oneday":   return 60 * 60 * 24;
      case "oneweek":  return 60 * 60 * 24 * 7;
      case "onemonth": return 60 * 60 * 24 * 30;
      case "oneyear":  return 60 * 60 * 24 * 365;
      case "other": return null; 
      default:         return null;
    }
  }

