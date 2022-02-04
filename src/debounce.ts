const debounce = (fn: (...args: any[]) => void, duration: number) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<typeof fn>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = undefined;
      return fn(...args);
    }, duration);
  };
};

export default debounce;
