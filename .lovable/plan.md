

## Add Role Selection Step to Signup Flow

### Overview
Add an intermediate role selection screen that appears when users click "Sign Up" -- they must choose between "Client" or "Service Provider" before seeing the registration form. This replaces the current URL-parameter-based approach with an explicit, in-page selection step.

### Current State
- Client signup shows immediately at `/auth?mode=signup`
- Provider signup requires navigating to `/auth?mode=signup&role=provider`
- No explicit role selection step exists -- role is determined by URL params

### What Changes

**1. Role Selection Screen in Auth Page** (`src/pages/Auth.tsx`)
- When user switches to the "Sign Up" tab, show a role selection screen first instead of immediately showing a form
- Two selectable cards:
  - **Pet Owner / Farmer** -- "Book services, talk to vets, manage pets." (icon: PawPrint)
  - **Service Provider** -- "Vet / Groomer / Boarding / Vendor -- Offer services and manage bookings." (icon: Briefcase)
- After selecting a role, the appropriate form slides in (SignUpForm for client, ProviderSignUpForm for provider)
- Back button to return to role selection
- URL param `role=provider` still works as a shortcut (skips selection screen)

**2. Auth Page State Management** (`src/pages/Auth.tsx`)
- Add a `selectedRole` state: `null | 'client' | 'provider'`
- When `selectedRole` is null and mode is signup, show role selection cards
- When `selectedRole` is set, show the corresponding form
- "Back" link above the form to reset `selectedRole` to null

**3. No Changes Needed to**:
- `SignUpForm.tsx` -- already defaults to `pet_owner` role
- `ProviderSignUpForm.tsx` -- already handles provider roles with business fields
- `validation.ts` -- schemas already exist for both flows
- Database -- roles already stored in `user_roles` table, RBAC already enforced
- Route protection -- already implemented in `ProtectedRoute` component
- Dashboard redirects -- already handled in Auth.tsx useEffect

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add role selection step with two cards before showing signup form; manage `selectedRole` state |

### Role Selection Card Design

```text
+---------------------------+    +---------------------------+
|   [PawPrint Icon]         |    |   [Briefcase Icon]        |
|                           |    |                           |
|   Pet Owner / Farmer      |    |   Service Provider        |
|                           |    |                           |
|   Book services, talk to  |    |   Offer services and      |
|   vets, manage pets.      |    |   manage bookings.        |
+---------------------------+    +---------------------------+
```

### User Flow

1. User clicks "Sign Up" tab
2. Sees "How would you like to join 1vet?" with two cards
3. Clicks a card
4. Sees the appropriate registration form with a "Back" link to change selection
5. Completes registration
6. Redirected to role-appropriate dashboard (already implemented)

### Technical Notes
- Single file change (`Auth.tsx`) since all signup forms and validation already exist
- The `role=provider` URL param continues to work as a direct link (used in footer)
- No database changes needed -- the `user_roles` table and `handle_new_user()` trigger already handle role assignment correctly

