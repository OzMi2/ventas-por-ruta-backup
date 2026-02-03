import * as React from "react";
import { Redirect } from "wouter";
import { useAppStore } from "@/store/store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAppStore();
  if (!state.session) return <Redirect to="/login" />;
  return <>{children}</>;
}
