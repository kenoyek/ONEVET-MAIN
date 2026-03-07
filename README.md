# 🐾 1vet — One-Stop Veterinary Platform (MVP)

1vet is a role-based veterinary web platform designed to provide **24/7 access to licensed veterinarians**, pet health management, and educational resources.

This MVP focuses on:

* Secure user authentication
* Real-time text-based vet consultations
* Pet profile management
* Admin moderation
* Subscription-based access control

Target Market: **Nigeria** (scalable globally)

---

# 🚀 Core Features (MVP Scope)

## 1️⃣ Authentication & Role-Based Access

* Email/password signup & login
* Password reset
* Role selection during signup:

  * `client` (Pet Owner / Farmer)
  * `provider` (Veterinarian)
  * `admin`
* Role-based dashboard redirects
* Protected routes via RBAC middleware

---

## 2️⃣ 24/7 Vet Chat

* Real-time text chat (WebSocket-based)
* Consultation request → vet acceptance workflow
* Online/offline presence indicator
* Conversation history
* Subscription-gated access

---

## 3️⃣ Pet Management

Clients can:

* Create multiple pet profiles
* Store:

  * Name
  * Species
  * Breed
  * Age / DOB
  * Weight
  * Notes
  * Vaccination records
  * Photo upload

---

## 4️⃣ Admin Dashboard

Admins can:

* Approve/reject veterinarians
* View conversations (moderation)
* Manage subscriptions
* Publish educational articles
* View platform metrics:

  * Total users
  * Active subscribers
  * Consultations

---

## 5️⃣ Education CMS

* Admin-managed articles
* Categories & search
* Public article listing
* Rich-text editor support

---

## 6️⃣ Subscription System (MVP)

* Monthly & yearly plans
* Subscription status tracking
* Chat restricted to active subscribers
* Manual activation via admin (no payment gateway in MVP)

---

# 🏗️ Tech Stack

### Frontend

* React / Next.js
* Tailwind CSS
* Role-based UI rendering

### Backend

* Node.js (Express or NestJS)
* REST APIs
* WebSocket (Socket.IO)

### Database

* PostgreSQL
* Prisma / TypeORM (ORM)

### Storage

* Local storage (dev)
* S3-compatible storage (production)

### Authentication

* JWT or secure session cookies

---

# 📂 Project Structure

```
/client          → Frontend (Next.js)
/server          → Backend API
/database        → Migrations & schema
/public          → Static assets
/uploads         → File storage (dev)
```

---

# 🔐 Environment Variables

Create a `.env` file in `/server`:

```
DATABASE_URL=
JWT_SECRET=
APP_BASE_URL=

EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=

STORAGE_PROVIDER=local
S3_BUCKET=
S3_KEY=
S3_SECRET=
S3_REGION=

NODE_ENV=development
```

---

# 🛠️ Local Development Setup

## 1️⃣ Clone Repository

```
git clone https://github.com/your-org/1vet.git
cd 1vet
```

## 2️⃣ Install Dependencies

Frontend:

```
cd client
npm install
```

Backend:

```
cd server
npm install
```

---

## 3️⃣ Setup Database

Run migrations:

```
npx prisma migrate dev
```

Seed sample data:

```
npm run seed
```

---

## 4️⃣ Run Development Servers

Backend:

```
npm run dev
```

Frontend:

```
npm run dev
```

App runs at:

```
http://localhost:3000
```

---

# 🔒 Role-Based Routing

| Role     | Dashboard Route     |
| -------- | ------------------- |
| Client   | /dashboard/client   |
| Provider | /dashboard/provider |
| Admin    | /dashboard/admin    |

Middleware ensures:

* Clients cannot access provider routes
* Providers cannot access client routes
* Chat is subscription-gated

---

# 📦 Production Deployment

## Recommended Hosting

* Vercel (Frontend)
* Railway / Render / DigitalOcean (Backend)
* AWS RDS (Database)
* S3 (File storage)

---

## Build Commands

Frontend:

```
npm run build
```

Backend:

```
npm run build
```

---

# 📊 Database Models (MVP)

* `User`
* `VetProfile`
* `Pet`
* `Conversation`
* `Message`
* `Article`
* `SubscriptionPlan`
* `Subscription`
* `AuditLog`

---

# 🔎 Access Control Summary

* Unauthenticated users cannot access dashboards
* Only active subscribers can start vet chats
* Providers require admin approval before appearing as active vets
* Admin has full moderation rights

---

# ⚠️ Out of Scope (MVP)

* Video consultations
* Payment gateway integration
* Marketplace (grooming/boarding)
* Mobile app

---

# 📈 Future Roadmap

* Video consultations (WebRTC)
* Integrated payments (Paystack/Flutterwave)
* Vendor marketplace
* Insurance integration
* Flutter mobile app
* AI symptom checker

---

# 🧪 Testing Checklist

* [ ] Signup role selection works
* [ ] Dashboard redirects based on role
* [ ] Vet approval flow works
* [ ] Subscription restricts chat
* [ ] Real-time messaging functional
* [ ] Articles publish correctly

---

# 👨🏽‍💻 Maintainers

1vet Development Team
Health-tech MVP — Nigeria
