import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, ShoppingBag, Tag, MoreHorizontal, GraduationCap, Info, Phone, LayoutDashboard, User, MessageCircle, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { NotificationBadge } from '@/components/shared/NotificationBadge';

const primaryTabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Services', icon: Briefcase },
  { href: '/marketplace', label: 'Market', icon: ShoppingBag },
  { href: '/pricing', label: 'Pricing', icon: Tag },
];

const moreLinks = [
  { href: '/education', label: 'Education', icon: GraduationCap },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Phone },
];

export function MobileBottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const isMoreActive = moreLinks.some((l) => isActive(l.href));

  const handleSignOut = async () => {
    setSheetOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {primaryTabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setSheetOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isMoreActive || sheetOpen ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left text-base">More</SheetTitle>
          </SheetHeader>

          <div className="space-y-1">
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSheetOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="space-y-1">
            {user ? (
              <>
                <Link
                  to={role === 'veterinarian' ? '/vet-dashboard' : role === 'admin' ? '/admin' : '/dashboard'}
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link
                  to="/consultations"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <NotificationBadge iconClassName="w-5 h-5" />
                  Consultations
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <User className="w-5 h-5" />
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-muted transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
