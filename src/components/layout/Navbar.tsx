import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, User, LogOut, LayoutDashboard, ShoppingCart, MessageCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/hooks/use-cart';
import { NotificationBadge } from '@/components/shared/NotificationBadge';
import { NotificationPopover } from '@/components/shared/NotificationPopover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/marketplace', label: 'Shop' },
  { href: '/services', label: 'Services' },
  { href: '/education', label: 'Education' },
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
];

export function Navbar() {
  const { user, profile, role, signOut, loading } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong h-16 md:h-20 flex items-center transition-all duration-300">
      <div className="container-wide w-full">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-glow">
              <Stethoscope className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="font-display text-xl md:text-2xl font-extrabold tracking-tighter text-foreground">
              1<span className="text-primary group-hover:text-secondary transition-colors duration-300">vet</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/40">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-background hover:shadow-soft"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Cart Link (Desktop) */}
            <Link to="/cart" className="relative p-2.5 text-muted-foreground hover:text-primary transition-colors group hidden md:flex">
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-secondary text-secondary-foreground border-2 border-background animate-scale-in" variant="default">
                  {totalItems}
                </Badge>
              )}
            </Link>

            <NotificationPopover />
            <ThemeToggle />

            <Separator orientation="vertical" className="h-6 hidden md:block mx-1" />

            {loading ? (
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-border/50 hover:border-primary/50 transition-colors">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name || 'User'} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2 glass-card p-2" align="end">
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-primary/5">
                    <Avatar className="h-10 w-10 border border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 overflow-hidden">
                      <p className="font-bold text-sm truncate">{profile?.first_name} {profile?.last_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-bold">{role?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2.5">
                    <Link to={role === 'veterinarian' ? '/vet-dashboard' : role === 'admin' ? '/admin' : '/dashboard'}>
                      <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2.5">
                    <Link to="/consultations">
                      <MessageCircle className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Consultations</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2.5">
                    <Link to="/profile">
                      <User className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-md focus:bg-destructive/10 cursor-pointer py-2.5 text-destructive">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-bold">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hidden sm:flex font-semibold hover:bg-primary/5">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="default" asChild className="font-bold shadow-soft px-6 rounded-full hover:scale-105 transition-transform">
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
