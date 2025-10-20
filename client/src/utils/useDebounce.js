// client/src/utils/useDebounce.js
import { useState, useEffect } from 'react';

// This custom hook delays updating a value until the user stops typing.
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear the timer if the value or delay changes before the timer runs out
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;