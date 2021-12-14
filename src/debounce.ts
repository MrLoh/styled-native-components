const debounce = (fn: (...args: any[]) => void, duration: number) => {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: Parameters<typeof fn>) => {
    const invoke = () => {
      timeout = undefined;
      return fn(...args);
    };
    timeout && clearTimeout(timeout);
    timeout = setTimeout(invoke, duration);
  };
};

export default debounce;
