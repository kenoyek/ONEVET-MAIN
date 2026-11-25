import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

const profileIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const joinedDate = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeZone: 'Africa/Lagos' });

export default function AdminUserDetails() {
  const { profileId = '' } = useParams();
  const { user } = useAuth();
  const validId = profileIdPattern.test(profileId);
  const details = useQuery({
    queryKey: ['admin-user-details', user?.id, profileId],
    enabled: Boolean(user && validId),
    retry: false,
    queryFn: async () => {
      const profile = await supabase.from('profiles')
        .select('user_id,first_name,last_name,email,phone,location,created_at,is_active,email_verified,vendor_type,customer_type')
        .eq('id', profileId).maybeSingle();
      if (profile.error) throw profile.error;
      if (!profile.data) return null;

      const roles = await supabase.from('user_roles').select('role').eq('user_id', profile.data.user_id).order('role');
      if (roles.error) throw roles.error;
      return { profile: profile.data, roles: roles.data.map(({ role }) => role.replaceAll('_', ' ')) };
    },
  });
  const account = details.data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide max-w-3xl space-y-6 pb-20 pt-28">
        <Link to="/admin/users" className="text-sm text-primary underline">Back to users</Link>
        <PageHeading size="workspace" title="User details" />
        {!validId || (details.isSuccess && !account) ? (
          <p role="status">User profile not found.</p>
        ) : details.isPending ? (
          <p role="status">Loading user details…</p>
        ) : details.isError ? (
          <div className="space-y-3">
            <p role="alert">Could not load this user’s details.</p>
            <Button type="button" variant="outline" onClick={() => void details.refetch()}>Retry</Button>
          </div>
        ) : account && (
          <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby="user-profile-name">
            <h2 id="user-profile-name" className="break-words text-xl font-semibold">
              {[account.profile.first_name, account.profile.last_name].filter(Boolean).join(' ') || 'Unnamed user'}
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Email', account.profile.email || 'Not provided'],
                ['Phone', account.profile.phone || 'Not provided'],
                ['Location', account.profile.location || 'Not provided'],
                ['Roles', account.roles.join(', ') || 'No role assigned'],
                ['Account type', (account.profile.vendor_type || account.profile.customer_type)?.replaceAll('_', ' ') || 'Not specified'],
                ['Account status', account.profile.is_active ? 'Active' : 'Suspended'],
                ['Email verified', account.profile.email_verified ? 'Yes' : 'No'],
                ['Joined', joinedDate.format(new Date(account.profile.created_at))],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="break-words font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </main>
    </div>
  );
}
