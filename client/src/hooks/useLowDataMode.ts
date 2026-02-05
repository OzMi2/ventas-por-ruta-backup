import { useState, useEffect, useCallback } from "react";

const LOW_DATA_KEY = "vr_low_data_mode";

interface NetworkInfo {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  saveData?: boolean;
}

export function useLowDataMode() {
  const [isLowData, setIsLowData] = useState(() => {
    const saved = localStorage.getItem(LOW_DATA_KEY);
    if (saved !== null) return saved === "true";
    return false;
  });

  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    const connection = (navigator as any).connection as NetworkInfo | undefined;
    
    if (connection) {
      const checkConnection = () => {
        const slowConnection = 
          connection.effectiveType === "slow-2g" || 
          connection.effectiveType === "2g" ||
          connection.saveData === true ||
          (connection.downlink !== undefined && connection.downlink < 1);
        
        if (slowConnection && localStorage.getItem(LOW_DATA_KEY) === null) {
          setIsLowData(true);
          setAutoDetected(true);
        }
      };

      checkConnection();
      (connection as any).addEventListener?.("change", checkConnection);
      
      return () => {
        (connection as any).removeEventListener?.("change", checkConnection);
      };
    }
  }, []);

  const setLowDataMode = useCallback((enabled: boolean) => {
    setIsLowData(enabled);
    setAutoDetected(false);
    localStorage.setItem(LOW_DATA_KEY, enabled ? "true" : "false");
  }, []);

  return {
    isLowData,
    autoDetected,
    setLowDataMode,
  };
}

export function getLowDataMode(): boolean {
  const saved = localStorage.getItem(LOW_DATA_KEY);
  if (saved !== null) return saved === "true";
  
  const connection = (navigator as any).connection as NetworkInfo | undefined;
  if (connection) {
    return connection.effectiveType === "slow-2g" || 
           connection.effectiveType === "2g" ||
           connection.saveData === true;
  }
  
  return false;
}
