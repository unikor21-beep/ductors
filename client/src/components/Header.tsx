import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import DuctorsLogo from "@/components/DuctorsLogo";
import { Link, useLocation } from "wouter";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ROLE_LABELS, ROLE_BADGE_STYLE } from "@shared/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { label: "견적의뢰", href: "/quote-request" },
  { label: "파트너찾기", href: "/find-partner" },
  { label: "환기설계", href: "/ventilation" },
  { label: "파트너스", href: "/partners-info" },
];

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border/60 shadow-sm">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center no-underline">
          <DuctorsLogo size={24} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isRestricted = user?.role === "partner" && ["/quote-request", "/find-partner"].includes(item.href);
            return isRestricted ? (
              <button
                key={item.href}
                onClick={() => toast.error("파트너 계정으로는 이용할 수 없는 메뉴입니다")}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground/40 cursor-not-allowed relative group"
              >
                {item.label}
                <span className="absolute -top-1 -right-1 text-[9px] bg-muted text-muted-foreground px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">파트너 불가</span>
              </button>
            ) : (
              <Link key={item.href} href={item.href}>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded `}
                    style={{ backgroundColor: ROLE_BADGE_STYLE[user?.role || "user"]?.bg, color: ROLE_BADGE_STYLE[user?.role || "user"]?.color }}>
                    {ROLE_LABELS[user?.role || "user"] || "고객"}
                  </span>
                  <span className="text-sm">{user?.name || "사용자"}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="no-underline w-full">관리자</Link>
                  </DropdownMenuItem>
                )}
                {user?.role === "partner" && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="no-underline w-full">대시보드</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/mypage" className="no-underline w-full">마이페이지</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-sm rounded-lg">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-accent"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border/50 py-4">
          <nav className="container flex flex-col gap-1">
            {NAV_ITEMS.filter(item => true).map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <span
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
            <div className="border-t border-border/50 mt-2 pt-2 px-4">
              {isAuthenticated ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 py-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded `}
                      style={{ backgroundColor: ROLE_BADGE_STYLE[user?.role || "user"]?.bg, color: ROLE_BADGE_STYLE[user?.role || "user"]?.color }}>
                      {ROLE_LABELS[user?.role || "user"] || "고객"}
                    </span>
                    <span className="text-sm font-medium">{user?.name || "사용자"}</span>
                  </div>
                  {user?.role === "admin" && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)}>
                      <span className="block py-2 text-sm">관리자</span>
                    </Link>
                  )}
                  {user?.role === "partner" && (
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      <span className="block py-2 text-sm">대시보드</span>
                    </Link>
                  )}
                  <Link href="/mypage" onClick={() => setMobileOpen(false)}>
                    <span className="block py-2 text-sm">마이페이지</span>
                  </Link>
                  <button onClick={handleLogout} className="text-left py-2 text-sm text-destructive">
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <span className="block py-2 text-sm text-foreground font-medium">로그인</span>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <span className="block py-2 text-sm text-primary font-medium">회원가입</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
