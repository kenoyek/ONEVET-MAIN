import { lazy, Suspense } from "react";
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
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { LiveChatWidget } from "./components/chat/LiveChatWidget";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";

// Route-level code splitting using React.lazy()
const CareGuide = lazy(() => import("./pages/CareGuide"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Farms = lazy(() => import("./pages/farms/Farms"));
const FarmDetail = lazy(() => import("./pages/farms/FarmDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const VetDashboard = lazy(() => import("./pages/VetDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const ProviderVerificationQueue = lazy(() => import("./pages/admin/ProviderVerificationQueue"));
const Consultations = lazy(() => import("./pages/Consultations"));
const ConsultationNew = lazy(() => import("./pages/ConsultationNew"));
const ConsultationChat = lazy(() => import("./pages/ConsultationChat"));
const Profile = lazy(() => import("./pages/Profile"));
const Pets = lazy(() => import("./pages/pets/Pets"));
const PetNew = lazy(() => import("./pages/pets/PetNew"));
const PetDetail = lazy(() => import("./pages/pets/PetDetail"));
const AdminSubscriptions = lazy(() => import("./pages/admin/Subscriptions"));
const AdminConversations = lazy(() => import("./pages/admin/Conversations"));
const AdminArticles = lazy(() => import("./pages/admin/Articles"));
const ArticleEditor = lazy(() => import("./pages/admin/ArticleEditor"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Groomers = lazy(() => import("./pages/services/Groomers"));
const PetSitting = lazy(() => import("./pages/services/PetSitting"));
const VetClinics = lazy(() => import("./pages/services/VetClinics"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ProviderOnboarding = lazy(() => import("./pages/provider/ProviderOnboarding"));
const OrganizationSettings = lazy(() => import("./pages/provider/OrganizationSettings"));
const ProviderMarketplace = lazy(() => import("./pages/marketplace/ProviderMarketplace"));
const PublicProviderProfile = lazy(() => import("./pages/provider/PublicProviderProfile"));
const NewBooking = lazy(() => import("./pages/booking/NewBooking"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
              <ErrorBoundary>
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
                    <Route path="/marketplace" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'admin', 'veterinarian']}>
                        <Marketplace />
                      </ProtectedRoute>
                    } />
                    <Route path="/marketplace/:id" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'admin', 'veterinarian']}>
                        <ProductDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/cart" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'admin', 'veterinarian']}>
                        <Cart />
                      </ProtectedRoute>
                    } />
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
                        <OrganizationSettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/provider-marketplace" element={<ProviderMarketplace />} />
                    <Route path="/provider/public/:slug" element={<PublicProviderProfile />} />
                    <Route path="/booking/new" element={
                      <ProtectedRoute allowedRoles={['pet_owner', 'client', 'service_provider', 'admin']}>
                        <NewBooking />
                      </ProtectedRoute>
                    } />

                    {/* Catch-all 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
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
