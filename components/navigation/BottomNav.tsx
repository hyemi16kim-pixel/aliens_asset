"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Wallet, Plus, BarChart3, Target } from "lucide-react";
import { theme } from "@/components/lib/theme";

export default function BottomNav() {
  const pathname = usePathname();

  const Item = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: any;
    label: string;
  }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          height: "100%",
          color: active ? theme.colors.primary : "#B0A8C8",
          textDecoration: "none",
          position: "relative",
        }}
      >
        {active && (
          <span
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 28,
              height: 3,
              borderRadius: "0 0 4px 4px",
              background: theme.colors.primary,
            }}
          />
        )}
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        <span
          style={{
            fontSize: 10,
            fontWeight: active ? 800 : 600,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav style={navStyle}>
      <Item href="/" icon={House} label="홈" />
      <Item href="/transactions" icon={Wallet} label="거래" />

      {/* 중앙 + 버튼 */}
      <Link href="/add" style={addButtonStyle}>
        <Plus size={26} strokeWidth={2.5} color="white" />
      </Link>

      <Item href="/analysis" icon={BarChart3} label="분석" />
      <Item href="/goals" icon={Target} label="목표" />
    </nav>
  );
}

const navStyle = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-around",
  height: "calc(60px + env(safe-area-inset-bottom))",
  paddingBottom: "env(safe-area-inset-bottom)",
  background: "rgba(255,255,255,0.97)",
  borderTop: "1.5px solid #EDE6F9",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
} as const;

const addButtonStyle = {
  width: 50,
  height: 50,
  borderRadius: "50%",
  background: theme.gradient.primary,
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
  boxShadow: "0 4px 16px rgba(124,92,255,0.35)",
  flexShrink: 0,
  marginBottom: 8,
} as const;
