import {getAccountHome} from '@/lib/auth-navigation';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, User, LogOut, LayoutDashboard, ShoppingCart, MessageCircle,
  Menu, ChevronDown, Calendar, Package, Settings, Sun, Moon, Laptop, HelpCircle, PhoneCall
} from 'lucide-react';
import { useTheme } from 'next-themes';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const navLinks = [
  { href: '/find-a-vet', label: 'Find a vet' },
  { href: '/pet-care', label: 'Pet care' },
  { href: '/farm-care', label: 'Farm & livestock' },
  { href: '/services', label: 'Services' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/articles', label: 'Resources' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, role, roles, signOut, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
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

  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 glass-strong h-16 md:h-20 flex items-center transition-all duration-300">
      <div className="container-wide w-full">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground transition-all duration-300  ">
              <Stethoscope className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="font-display text-xl md:text-2xl font-extrabold tracking-tighter text-foreground">
              1<span className="text-primary group-hover:text-secondary transition-colors duration-300">vet</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-background hover:shadow-soft"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild><Button size="icon" variant="ghost" className="xl:hidden" aria-label="Open navigation"><Menu size={22} /></Button></SheetTrigger>
              <SheetContent className="overflow-y-auto"><SheetHeader><SheetTitle>Explore 1Vet</SheetTitle></SheetHeader><div className="flex flex-col gap-1 mt-6">{[{href:'/',label:'Home'}, ...navLinks, {href:'/pricing',label:'Pricing'}, {href:'/about',label:'About 1Vet'}, {href:user?'/provider/register':'/auth?mode=signup&role=veterinarian',label:user?'Register your practice':'Join as a veterinarian'}, {href:'/urgent-care',label:'Urgent care guidance'}, {href:'/contact',label:'Contact & support'}].map(link=><Link key={link.href} to={link.href} onClick={()=>setMenuOpen(false)} className="py-3 px-3 rounded-lg hover:bg-muted font-medium">{link.label}</Link>)}</div></SheetContent>
            </Sheet>
            {/* Cart Link (Desktop) */}
            <Link to="/cart" aria-label="Shopping cart" className="relative p-2.5 text-muted-foreground hover:text-primary transition-colors group hidden md:flex">
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-secondary text-secondary-foreground border-2 border-background animate-scale-in" variant="default">
                  {totalItems}
                </Badge>
              )}
            </Link>

            {user && <NotificationPopover />}
            <ThemeToggle />

            <Separator orientation="vertical" className="h-6 hidden md:block mx-1" />

            {loading ? (
              <div className="flex items-center gap-1.5 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted border border-border/50" />
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Account menu" variant="ghost" className="relative flex items-center gap-1.5 p-1 h-auto rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name || 'User'} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mr-1.5 group-hover:text-primary transition-colors" />
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
                  
                  <DropdownMenuSeparator className="bg-border/40" />
                  
                  <DropdownMenuItem asChild><Link to="/provider/invitations">Team invitations & workspaces</Link></DropdownMenuItem>

                  {/* Account Section */}
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/75">
                    Account
                  </div>
                  
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Link to="/profile">
                      <User className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Link to={getAccountHome(role,roles)}>
                      <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Link to="/consultations">
                      <Calendar className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Appointments</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Link to="/cart">
                      <Package className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Link to="/profile#settings">
                      <Settings className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/40" />

                  {/* Theme Section */}
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/75">
                    Theme
                  </div>
                  
                  <DropdownMenuItem onClick={() => setTheme('light')} className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Sun className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Light</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Moon className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Dark</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setTheme('system')} className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Laptop className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">System</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/40" />

                  {/* Support Section */}
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/75">
                    Support
                  </div>
                  
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Link to="/about">
                      <HelpCircle className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Help Center</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary/10 cursor-pointer py-2">
                    <Link to="/contact">
                      <PhoneCall className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Contact Support</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/40" />

                  {/* Danger Zone Section */}
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
                <Button variant="default" asChild className="font-semibold px-4">
                  <Link to="/find-a-vet">Talk to a vet</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
