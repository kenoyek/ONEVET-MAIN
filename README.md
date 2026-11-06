# 🐾 1Vet — Professional Veterinary Platform

1Vet is an enterprise-grade, role-based veterinary platform designed to provide **24/7 access to licensed veterinarians**, pet health management, and a comprehensive marketplace for veterinary supplies.

---

## 🏗️ Architecture

This project is fully independent and hosted on **Vercel** with a **Supabase** backend. It has been migrated away from the Lovable platform to ensure complete control, scalability, and production readiness.

- **Frontend**: React (Vite), Tailwind CSS, Radix UI, Shadcn/UI
- **State & Data**: React Query, Supabase SDK
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Paystack Integration (Secure Server-Side Verification)
- **Infrastructure**: Vercel (Frontend), Supabase (Backend/API)

---

## 🛠️ Setup & Installation

### 1️⃣ Supabase Configuration (Backend)
1. Create a brand-new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your new project.
3. Copy the contents of `supabase/migrations/20260401000000_independent_architecture_master.sql` and run it. This will set up all tables, roles, RLS policies, and core functions.
4. **Auth Configuration**:
   - In `Auth -> Configuration -> URL Configuration`, add your production domain and `http://localhost:8080`.
   - Set the "Site URL" to your production domain.
5. **Storage**: Ensure the `licenses` and `pet-avatars` buckets were created (they should be created by the SQL script, but verify in the dashboard).

### 2️⃣ Edge Functions
Deploy the server-side payment verification and contact form functions:
```bash
supabase functions deploy verify-payment
supabase functions deploy contact-form
```
**Set Secrets**:
```bash
supabase secrets set PAYSTACK_SECRET_KEY=your_secret_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3️⃣ Frontend Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://fxvctkfhitpgfyaztqor.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_faCoot0rMDedxYC163rpFQ_lRRJesg5
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

### 4️⃣ Install & Run
```bash
npm install
npm run dev
```

---

## 🚀 Deployment to Vercel

1. Push your code to a **GitHub** repository.
2. Connect your repository to **Vercel**.
3. Add the environment variables from your `.env` file to the Vercel project settings.
4. Vercel will automatically detect the Vite configuration and deploy your application.

---

## 🔒 Security & Performance
- **RBAC**: Enforced via Supabase Row Level Security (RLS).
- **Payment Security**: Transactions are verified server-side via Supabase Edge Functions using the Paystack secret key.
- **Data Privacy**: Sensitive user PII is restricted; a public-safe view (`public_profiles`) is used for directory listings.
- **Optimized**: Database indexes applied for high-performance analytics and search.

---

## 👨🏽‍💻 Maintainers
1Vet Engineering Team
Nigeria

## Customer farm workspace rollout

The customer dashboard includes care preferences and account-scoped carts. Farm/group/observation records require the reviewed ownership migration before enabling `VITE_FEATURE_CUSTOMER_FARMS_ENABLED=true` and rebuilding. The flag defaults to false; do not enable it against the old permissive policies.

See [customer portal release and rollout](docs/1vet-customer-portal-release.md). Run `npm test -- --maxWorkers=2` for application regression tests and `bash scripts/test-farm-rls.sh` for isolated PostgreSQL authorization tests (Docker required). The latter never connects to a remote database.
