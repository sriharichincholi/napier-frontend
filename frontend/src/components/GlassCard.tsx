import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** animated cyan/purple gradient border for the active panel */
  glow?: boolean;
}

export default function GlassCard({ children, className = "", glow = false }: Props) {
  return <section className={`glass ${glow ? "glow" : ""} ${className}`}>{children}</section>;
}
