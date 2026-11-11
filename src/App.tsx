import { PlannedModuleGate } from '@/components/shared/PlannedModuleGate';
import { Suspense } from "react";
import {lazyRoute} from "@/lib/lazy-route";
import AuthCallback from "./pages/AuthCallback";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PageLoader } from "@/components/shared/PageLoader";
import {RouteErrorBoundary} from "./components/shared/RouteErrorBoundary";
import { LiveChatWidget } from "./components/chat/LiveChatWidget";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";

// Route-level splitting with bounded recovery for failed page downloads.
const CareGuide = lazyRoute(() => import("./pages/CareGuide"));
const Index = lazyRoute(() => import("./pages/Index"));
const Auth = lazyRoute(() => import("./pages/Auth"));
const Farms = lazyRoute(() => import("./pages/farms/Farms"));
const FarmDetail = lazyRoute(() => import("./pages/farms/FarmDetail"));
const Dashboard = lazyRoute(() => import("./pages/Dashboard"));
const VetDashboard = lazyRoute(() => import("./pages/VetDashboard"));
const AdminDashboard = lazyRoute(() => import("./pages/AdminDashboard"));
const AdminAnalytics = lazyRoute(() => import("./pages/admin/Analytics"));
const AdminUsers = lazyRoute(() => import("./pages/admin/Users"));
const ProviderVerificationQueue = lazyRoute(() => import("./pages/admin/ProviderVerificationQueue"));
const Consultations = lazyRoute(() => import("./pages/Consultations"));
const ConsultationNew = lazyRoute(() => import("./pages/ConsultationNew"));
const ConsultationChat = lazyRoute(() => import("./pages/ConsultationChat"));
const Profile = lazyRoute(() => import("./pages/Profile"));
const Pets = lazyRoute(() => import("./pages/pets/Pets"));
const PetNew = lazyRoute(() => import("./pages/pets/PetNew"));
const PetDetail = lazyRoute(() => import("./pages/pets/PetDetail"));
const AdminSubscriptions = lazyRoute(() => import("./pages/admin/Subscriptions"));
const AdminConversations = lazyRoute(() => import("./pages/admin/Conversations"));
const ShopCatalogue = lazyRoute(() => import("./pages/admin/ShopCatalogue"));
const AdminArticles = lazyRoute(() => import("./pages/admin/Articles"));
const ArticleEditor = lazyRoute(() => import("./pages/admin/ArticleEditor"));
const Articles = lazyRoute(() => import("./pages/Articles"));
const ArticleDetail = lazyRoute(() => import("./pages/ArticleDetail"));
const Groomers = lazyRoute(() => import("./pages/services/Groomers"));
const PetSitting = lazyRoute(() => import("./pages/services/PetSitting"));
const VetClinics = lazyRoute(() => import("./pages/services/VetClinics"));
const Marketplace = lazyRoute(() => import("./pages/Marketplace"));
const ProductDetail = lazyRoute(() => import("./pages/ProductDetail"));
const Cart = lazyRoute(() => import("./pages/Cart"));
const Checkout = lazyRoute(() => import("./pages/Checkout"));
const About = lazyRoute(() => import("./pages/About"));
const Contact = lazyRoute(() => import("./pages/Contact"));
const Pricing = lazyRoute(() => import("./pages/Pricing"));
const TeamInvitations = lazyRoute(() => import("./pages/provider/TeamInvitations"));
const ProviderOnboarding = lazyRoute(() => import("./pages/provider/ProviderOnboarding"));
const ProviderDraftWorkspace = lazyRoute(() => import("./pages/provider/ProviderDraftWorkspace"));
const ProviderMarketplace = lazyRoute(() => import("./pages/marketplace/ProviderMarketplace"));
const PublicProviderProfile = lazyRoute(() => import("./pages/provider/PublicProviderProfile"));
const Notifications = lazyRoute(() => import("./pages/Notifications"));
const AppointmentDetails = lazyRoute(() => import("./pages/booking/AppointmentDetails"));
const MyBookings = lazyRoute(() => import("./pages/booking/MyBookings"));
const NewBooking = lazyRoute(() => import("./pages/booking/NewBooking"));
const NotFound = lazyRoute(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <a href="#main-content" onClick={(event) => { const main = document.querySelector('main'); if (main) { event.preventDefault(); main.tabIndex = -1; main.focus(); main.scrollIntoView({ block: 'start' }); } }} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-card focus:p-4 focus:rounded-lg">Skip to main content</a>
              <RouteErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public & Informational Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/subscription" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/articles" element={<Articles />} />
                    <Route path="/education" element={<Articles />} />
                    <Route path="/articles/:slug" element={<ArticleDetail />} />
                    <Route path="/services" element={<CareGuide />} />
                    <Route path="/pet-care" element={<CareGuide />} />
                    <Route path="/farm-care" element={<CareGuide />} />
                    <Route path="/urgent-care" element={<CareGuide />} />
                    <Route path="/find-a-vet" element={<ProviderMarketplace />} />

                    {/* Core Portals & Dashboards */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider']}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/vet-dashboard" element={
                      <ProtectedRoute allowedRoles={['veterinarian']}>
                        <VetDashboard />
                      </ProtectedRoute>
                    } />

                    {/* Administration Routes */}
                    <Route path="/admin" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/analytics" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminAnalytics />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminUsers />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/verifications" element={
                      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <ProviderVerificationQueue />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/subscriptions" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminSubscriptions />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/conversations" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminConversations />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/shop" element={<ProtectedRoute allowedRoles={['admin']}><ShopCatalogue /></ProtectedRoute>} />
                    <Route path="/admin/articles" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminArticles />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/articles/new" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <ArticleEditor />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/articles/:id/edit" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <ArticleEditor />
                      </ProtectedRoute>
                    } />

                    {/* Teleconsultations */}
                    <Route path="/consultations" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'veterinarian', 'service_provider', 'admin']}>
                        <Consultations />
                      </ProtectedRoute>
                    } />
                    <Route path="/consultations/new" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider']}>
                        <ConsultationNew />
                      </ProtectedRoute>
                    } />
                    <Route path="/consultations/:id" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'veterinarian', 'service_provider', 'admin']}>
                        <ConsultationChat />
                      </ProtectedRoute>
                    } />

                    <Route path="/farms" element={<ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider']}><Farms /></ProtectedRoute>} />
                    <Route path="/farms/:farmId" element={<ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider']}><FarmDetail /></ProtectedRoute>} />
                    {/* User Profile & Pet Management */}
                    <Route path="/profile" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'veterinarian', 'service_provider', 'admin']}>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/pets" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider']}>
                        <Pets />
                      </ProtectedRoute>
                    } />
                    <Route path="/pets/new" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider']}>
                        <PetNew />
                      </ProtectedRoute>
                    } />
                    <Route path="/pets/:id" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider']}>
                        <PetDetail />
                      </ProtectedRoute>
                    } />

                    {/* Specialist Care Services */}
                    <Route path="/services/groomers" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'admin']}>
                        <Groomers />
                      </ProtectedRoute>
                    } />
                    <Route path="/services/pet-sitting" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'admin']}>
                        <PetSitting />
                      </ProtectedRoute>
                    } />
                    <Route path="/services/vet-clinics" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'admin']}>
                        <VetClinics />
                      </ProtectedRoute>
                    } />

                    {/* E-Commerce Marketplace */}
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/marketplace/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'admin', 'veterinarian']}>
                        <Checkout />
                      </ProtectedRoute>
                    } />

                    {/* Provider Portal & Bookings */}
                    <Route path="/provider/register" element={
                      <ProtectedRoute allowedRoles={['service_provider', 'veterinarian', 'pet_owner', 'admin', 'clinic_admin', 'groomer', 'laboratory', 'pharmacy', 'vendor', 'trainer']}>
                        <ProviderOnboarding />
                      </ProtectedRoute>
                    } />
                    <Route path="/provider/organization/:slug" element={
                      <ProtectedRoute allowedRoles={['service_provider', 'veterinarian', 'pet_owner', 'admin', 'clinic_admin', 'groomer', 'laboratory', 'pharmacy', 'vendor', 'trainer']}>
                        <ProviderDraftWorkspace />
                      </ProtectedRoute>
                    } />
                    <Route path="/provider-marketplace" element={<ProviderMarketplace />} />
                    <Route path="/provider/public/:slug" element={<PublicProviderProfile />} />
                    <Route path="/booking/new" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'veterinarian', 'admin']}>
                        <NewBooking />
                      </ProtectedRoute>
                    } />

                    <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['pet_owner','client','service_provider','veterinarian','admin']}><MyBookings /></ProtectedRoute>} />

                    <Route path="/appointments/:id" element={<ProtectedRoute allowedRoles={['pet_owner','client','service_provider','veterinarian','admin']}><AppointmentDetails /></ProtectedRoute>} />

                    <Route path="/notifications" element={<ProtectedRoute allowedRoles={['pet_owner','client','service_provider','veterinarian','admin']}><Notifications /></ProtectedRoute>} />

                    <Route path="/provider/invitations" element={<ProtectedRoute allowedRoles={['pet_owner','client','service_provider','veterinarian','admin']}><TeamInvitations /></ProtectedRoute>} />

                    {/* Catch-all 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </RouteErrorBoundary>
              <LiveChatWidget />
              <MobileBottomNav />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
