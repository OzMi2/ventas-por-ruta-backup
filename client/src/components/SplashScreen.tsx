import * as React from "react";
import { Loader2Icon } from "lucide-react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = React.useState(0);
  const [fadeOut, setFadeOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setFadeOut(true);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary/90 to-primary transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl animate-pulse">
          <span className="text-4xl font-black text-white">G</span>
        </div>
        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-lg">
          <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
      
      <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
        Garlo's Ventas
      </h1>
      <p className="text-white/70 text-sm mb-8">Sistema de Ventas por Ruta</p>
      
      <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-white/60 text-xs mt-3">Cargando...</p>
    </div>
  );
}
