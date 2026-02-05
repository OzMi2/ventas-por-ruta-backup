import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SplashScreen } from "./components/SplashScreen";
import "./index.css";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado:', registration.scope);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
                  newWorker.postMessage('skipWaiting');
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('SW error:', error);
      });
  });
}

function AppWithSplash() {
  const [showSplash, setShowSplash] = React.useState(() => {
    const lastSplash = sessionStorage.getItem('vr_splash_shown');
    return !lastSplash;
  });

  const handleSplashComplete = React.useCallback(() => {
    sessionStorage.setItem('vr_splash_shown', 'true');
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <App />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<AppWithSplash />);
