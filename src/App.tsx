import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import VetDashboard from "./pages/VetDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminUsers from "./pages/admin/Users";
import Consultations from "./pages/Consultations";
import ConsultationNew from "./pages/ConsultationNew";
import ConsultationChat from "./pages/ConsultationChat";
import Profile from "./pages/Profile";
import Pets from "./pages/pets/Pets";
import PetNew from "./pages/pets/PetNew";
import PetDetail from "./pages/pets/PetDetail";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminConversations from "./pages/admin/Conversations";
import AdminArticles from "./pages/admin/Articles";
import ArticleEditor from "./pages/admin/ArticleEditor";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import Services from "./pages/Services";
import Groomers from "./pages/services/Groomers";
import PetSitting from "./pages/services/PetSitting";
import VetClinics from "./pages/services/VetClinics";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import { LiveChatWidget } from "./components/chat/LiveChatWidget";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import ErrorBoundary from "./components/shared/ErrorBoundary";
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
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/vet-dashboard" element={
                  <ProtectedRoute allowedRoles={['veterinarian']}>
                    <VetDashboard />
                  </ProtectedRoute>
                } />
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
                <Route path="/consultations" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'veterinarian', 'service_provider', 'admin']}>
                    <Consultations />
                  </ProtectedRoute>
                } />
                <Route path="/consultations/new" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider']}>
                    <ConsultationNew />
                  </ProtectedRoute>
                } />
                <Route path="/consultations/:id" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'veterinarian', 'service_provider', 'admin']}>
                    <ConsultationChat />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'veterinarian', 'service_provider', 'admin']}>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/pets" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider']}>
                    <Pets />
                  </ProtectedRoute>
                } />
                <Route path="/pets/new" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider']}>
                    <PetNew />
                  </ProtectedRoute>
                } />
                <Route path="/pets/:id" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider']}>
                    <PetDetail />
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
                <Route path="/services" element={<Services />} />
                <Route path="/services/groomers" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider', 'admin']}>
                    <Groomers />
                  </ProtectedRoute>
                } />
                <Route path="/services/pet-sitting" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider', 'admin']}>
                    <PetSitting />
                  </ProtectedRoute>
                } />
                <Route path="/services/vet-clinics" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider', 'admin']}>
                    <VetClinics />
                  </ProtectedRoute>
                } />
                <Route path="/marketplace" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider', 'admin', 'veterinarian']}>
                    <Marketplace />
                  </ProtectedRoute>
                } />
                <Route path="/marketplace/:id" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider', 'admin', 'veterinarian']}>
                    <ProductDetail />
                  </ProtectedRoute>
                } />
                <Route path="/cart" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider', 'admin', 'veterinarian']}>
                    <Cart />
                  </ProtectedRoute>
                } />
                <Route path="/checkout" element={
                  <ProtectedRoute allowedRoles={['pet_owner', 'service_provider', 'admin', 'veterinarian']}>
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/subscription" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/education" element={<Articles />} />
                <Route path="/articles/:slug" element={<ArticleDetail />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
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
