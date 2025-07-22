export const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  ms: number
) => {
  let id: NodeJS.Timeout;
  return (...a: Parameters<T>) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...a), ms);
  };
};