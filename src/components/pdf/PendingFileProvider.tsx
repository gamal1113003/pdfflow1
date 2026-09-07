"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type PendingFileContextValue = {
  pendingFile: File | null;
  setPendingFile: (file: File | null) => void;
  /** Returns the queued file once, then clears it. */
  takePendingFile: () => File | null;
};

const PendingFileContext = createContext<PendingFileContextValue | null>(null);

/**
 * Lets someone drop a file on the homepage, pick a tool, and land on the tool
 * page with that file already loaded. The provider lives in the root layout so
 * the file survives client-side navigation.
 */
export function PendingFileProvider({ children }: { children: React.ReactNode }) {
  const [pendingFile, setFile] = useState<File | null>(null);
  const ref = useRef<File | null>(null);

  const setPendingFile = useCallback((file: File | null) => {
    ref.current = file;
    setFile(file);
  }, []);

  const takePendingFile = useCallback(() => {
    const file = ref.current;
    ref.current = null;
    setFile(null);
    return file;
  }, []);

  return (
    <PendingFileContext.Provider value={{ pendingFile, setPendingFile, takePendingFile }}>
      {children}
    </PendingFileContext.Provider>
  );
}

export function usePendingFile(): PendingFileContextValue {
  const context = useContext(PendingFileContext);
  if (!context) {
    return { pendingFile: null, setPendingFile: () => {}, takePendingFile: () => null };
  }
  return context;
}
