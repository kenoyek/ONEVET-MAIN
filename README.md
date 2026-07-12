# 🐾 1Vet — Production-Ready Veterinary Platform

1Vet is an enterprise-grade, role-based veterinary platform designed to provide **24/7 access to licensed veterinarians**, pet health management, and a comprehensive marketplace for veterinary supplies.

## 🚀 Key Features

### 1️⃣ Advanced Analytics & Admin Control
- **Real-time KPI Dashboard**: Monitor user growth, active subscriptions, and platform activity.
- **Geographic Insights**: Track platform performance across different regions.
- **Vendor Management**: Robust approval workflow (Pending, Approved, Suspended, Rejected) for veterinarians and service providers.
- **User Management**: Complete control over user accounts and roles.

### 2️⃣ E-Commerce & Marketplace
- **Verified Listings**: Quality veterinary supplies from approved sellers.
- **Paystack Integration**: Secure, real-time payments for products and services.
- **Order Tracking**: Comprehensive order history and status management.

### 3️⃣ Real-Time Consultations
- **Live Text Chat**: Real-time communication between pet owners and veterinarians.
- **Automated Routing**: Intelligent consultation request distribution to available vets.
- **Case Management**: Digital records for diagnoses, prescriptions, and follow-ups.

### 4️⃣ Subscription System
- **Tiered Access**: Flexible monthly and yearly plans.
- **Instant Activation**: Automated subscription management via Paystack.
- **Subscription Gates**: Seamless access control to premium features.

### 5️⃣ Notifications & Engagement
- **In-App Notification Center**: Real-time alerts for bookings, payments, and system updates.
- **Browser Push Notifications**: Stay updated even when away from the platform.

---

## 🏗️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Radix UI, Shadcn/UI
- **State & Data**: React Query, Supabase SDK
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Paystack
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 🛠️ Development Setup

### 1️⃣ Environment Variables
Create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

### 2️⃣ Install & Run
```bash
npm install
npm run dev
```

### 3️⃣ Database Migrations
Apply migrations in `supabase/migrations/` to your Supabase project via the dashboard or CLI.

---

## 🔒 Security & Performance
- **RBAC (Role-Based Access Control)**: Enforced via Supabase RLS (Row Level Security).
- **SEO Optimized**: Dynamic meta tags and OpenGraph support for all public pages.
- **Error Handling**: Global Error Boundaries and specialized error pages (404, 500).
- **Performance**: Optimized asset loading, code splitting, and database indexing.

---

## 👨🏽‍💻 Maintainers
1Vet Engineering Team
Health-tech Solutions — Nigeria
