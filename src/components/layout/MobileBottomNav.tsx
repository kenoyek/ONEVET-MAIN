import {getAccountHome} from '@/lib/auth-navigation';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, Home, Briefcase, ShoppingBag, Tag, MoreHorizontal, GraduationCap, Info, Phone,
  LayoutDashboard, User, MessageCircle, LogOut, LogIn, UserPlus,
  Calendar, Package, Settings, HelpCircle, PhoneCall
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBadge } from '@/components/shared/NotificationBadge';

const primaryTabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Services', icon: Briefcase },
  { href: '/find-a-vet', label: 'Find a vet', icon: Stethoscope },
  { href: '/marketplace', label: 'Shop', icon: ShoppingBag },
];

const moreLinks = [
  { href: '/pricing', label: 'Pricing', icon: Tag },
  { href: '/education', label: 'Education', icon: GraduationCap },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Phone },
];

export function MobileBottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, roles, signOut } = useAuth();

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

  const getInitials = () => {
    if (profile?.first_name || profile?.last_name) {
      const f = profile.first_name?.[0] || '';
      const l = profile.last_name?.[0] || '';
      return `${f}${l}`.toUpperCase() || 'U';
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  if(location.pathname==='/auth'||location.pathname.startsWith('/auth/'))return null;
  return (
    <>
      <nav aria-label="Quick navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border pb-[env(safe-area-inset-bottom)]">
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
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-[env(safe-area-inset-bottom)] max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left text-base">Menu</SheetTitle>
          </SheetHeader>

          {user && (
            <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-primary/5 border border-primary/10">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 overflow-hidden">
                <p className="font-bold text-sm truncate">
                  {profile?.first_name || profile?.last_name 
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                    : 'User Account'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-bold">
                  {role?.replace('_', ' ') || 'Pet Owner'}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/75">
                  Account
                </div>
                <Link
                  to="/profile"
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/profile') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <User className="w-5 h-5 text-primary" />
                  My Profile
                </Link>
                <Link
                  to={getAccountHome(role,roles)}
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard') || isActive('/vet-dashboard') || isActive('/admin') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  Dashboard
                </Link>
                <Link
                  to="/consultations"
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/consultations') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-primary" />
                  Appointments
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/cart') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Package className="w-5 h-5 text-primary" />
                  Orders
                </Link>
                <Link
                  to="/profile#settings"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="w-5 h-5 text-primary" />
                  Settings
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <Link
                  to="/auth"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-soft hover:scale-[1.02] transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            )}

            <Separator className="bg-border/40" />

            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/75">
                Explore & Support
              </div>
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <link.icon className="w-5 h-5 text-primary" />
                  {link.label}
                </Link>
              ))}
              <Link
                to="/about"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-primary" />
                Help Center
              </Link>
              <Link
                to="/contact"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <PhoneCall className="w-5 h-5 text-primary" />
                Contact Support
              </Link>
            </div>

            {user && (
              <>
                <Separator className="bg-border/40" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
