import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center app-noise app-grid p-6">
      <Card className="w-full max-w-md mx-4 shadow-md" data-testid="card-not-found">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404</h1>
          </div>

          <p className="mt-2 text-sm text-muted-foreground" data-testid="text-not-found">
            Ruta no encontrada.\n          </p>
          <div className="mt-4">
            <Link href="/login" data-testid="link-go-login" className="text-sm font-medium text-primary underline">
              Ir a Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
