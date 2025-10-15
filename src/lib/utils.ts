import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<Func extends (...args: any[]) => any>(
  func: Func,
  wait: number,
): (...args: Parameters<Func>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<Func>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export type ValueOf<T> = T[keyof T];
