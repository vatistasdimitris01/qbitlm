import { useState, useEffect } from 'react';
import { Notebook } from '../types';

// A custom hook to synchronize state with localStorage
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = (): T => {
    // Prevent build error "window is not defined" but keep working
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    // Prevent build error "window is not defined" but keep working
    if (typeof window === 'undefined') {
      console.warn(
        `Tried setting localStorage key “${key}” even though environment is not a client`,
      );
    }

    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      let valueToSave = valueToStore;

      // Special handling for notebooks array to avoid storing large media files
      if (key === 'notebooks' && Array.isArray(valueToStore)) {
        valueToSave = valueToStore.map((notebook: Notebook) => ({
          ...notebook,
          sources: notebook.sources.map(source => {
            if (source.origin.type === 'image' || source.origin.type === 'video') {
              // Strip content to avoid localStorage quota issues
              return { ...source, content: '' }; 
            }
            return source;
          })
        })) as T;
      }
      
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToSave));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [storedValue, setValue];
}
