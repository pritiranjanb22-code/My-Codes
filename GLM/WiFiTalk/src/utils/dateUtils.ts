export const formatDistanceToNow = (date: Date | number, options?: { addSuffix?: boolean }): string => {
  const now = Date.now();
  const then = date instanceof Date ? date.getTime() : date;
  const diff = now - then;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let result: string;
  
  if (seconds < 60) {
    result = 'just now';
  } else if (minutes < 60) {
    result = `${minutes}m`;
  } else if (hours < 24) {
    result = `${hours}h`;
  } else if (days < 7) {
    result = `${days}d`;
  } else if (weeks < 4) {
    result = `${weeks}w`;
  } else if (months < 12) {
    result = `${months}mo`;
  } else {
    result = `${years}y`;
  }

  if (options?.addSuffix) {
    return `${result} ago`;
  }
  
  return result;
};

export const format = (date: Date | number, formatString: string): string => {
  const d = date instanceof Date ? date : new Date(date);
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  return formatString
    .replace('yyyy', d.getFullYear().toString())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()))
    .replace('SSS', d.getMilliseconds().toString().padStart(3, '0'));
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
  }
  return `${minutes}:${pad(seconds % 60)}`;
};

const pad = (num: number) => num.toString().padStart(2, '0');