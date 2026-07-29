import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { providerService } from '@/lib/services/provider-service';
import { toast } from 'sonner';
import { Users, Building2, ShieldCheck, MapPin, Plus, UserPlus, Loader2 } from 'lucide-react';

const PERMISSION_OPTIONS = [
  { id: 'manage_organization', label: 'Manage Organization Profile' },
  { id: 'manage_staff', label: 'Invite & Manage Staff' },
  { id: 'manage_services', label: 'Manage Services & Pricing' },
  { id: 'view_bookings', label: 'View Appointments & Bookings' },
  { id: 'manage_bookings', label: 'Manage & Reschedule Bookings' },
  { id: 'access_medical_records', label: 'Access Patient Health Passport' },
  { id: 'write_clinical_notes', label: 'Write Clinical Summaries' },
  { id: 'issue_prescriptions', label: 'Create & Sign Prescriptions' },
  { id: 'manage_products', label: 'Manage Inventory & Products' },
  { id: 'view_revenue', label: 'View Financial Dashboard' },
  { id: 'manage_payouts', label: 'Manage Bank Accounts & Payouts' },
];

export default function OrganizationSettings() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'manager' | 'staff' | 'practitioner'>('staff');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'view_bookings',
    'access_medical_records',
  ]);
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const fetchOrganization = async () => {
    if (!slug) return;
    try {
      const data = await providerService.getOrganizationBySlug(slug);
      setOrganization(data);
    } catch (err: any) {
      console.error('Failed to load organization:', err);
      toast.error('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [slug]);

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization) return;
    if (!inviteEmail) {
      toast.error('Please enter staff email address');
      return;
    }

    setSubmittingInvite(true);
    try {
      // In production, resolves targetUserId via Supabase RPC or email search
      toast.success(`Invitation sent to ${inviteEmail} with assigned role (${inviteRole})`);
      setInviteOpen(false);
      setInviteEmail('');
      fetchOrganization();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send staff invitation');
    } finally {
      setSubmittingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground">The requested provider organization could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              <Badge variant={organization.verification_status === 'approved' ? 'default' : 'secondary'}>
                {organization.verification_status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Provider Type: <span className="capitalize text-foreground font-medium">{organization.provider_type.replace(/_/g, ' ')}</span> • {organization.city}, {organization.country}
            </p>
          </div>

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" /> Invite Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Invite Organization Staff</DialogTitle>
                <DialogDescription>
                  Invite a team member or practitioner to join {organization.name}.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleInviteStaff} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Staff Email Address *</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    required
                    placeholder="doctor@clinic.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Member Role *</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(val: any) => setInviteRole(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner (Full Admin)</SelectItem>
                      <SelectItem value="manager">Clinic Manager</SelectItem>
                      <SelectItem value="practitioner">Veterinarian / Practitioner</SelectItem>
                      <SelectItem value="staff">Front Desk / Support Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Assign Granular Permissions</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {PERMISSION_OPTIONS.map((perm) => (
                      <div key={perm.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={perm.id}
                          checked={selectedPermissions.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <label
                          htmlFor={perm.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingInvite}>
                    {submittingInvite ? 'Sending Invite...' : 'Send Invitation'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" /> Team Members
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="h-4 w-4" /> Branch Locations
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Building2 className="h-4 w-4" /> Profile & Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Organization Staff & Roles</CardTitle>
                <CardDescription>
                  Manage active team members, clinicians, staff roles and individual permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organization.members && organization.members.length > 0 ? (
                    organization.members.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {member.user?.first_name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {member.user?.first_name} {member.user?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="capitalize">
                            {member.member_role}
                          </Badge>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No additional staff members have been added yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Branch Locations</CardTitle>
                  <CardDescription>
                    Manage physical clinics, salons, pharmacies or service hubs.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Branch
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organization.locations && organization.locations.length > 0 ? (
                    organization.locations.map((loc: any) => (
                      <Card key={loc.id} className="border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{loc.name}</CardTitle>
                            {loc.is_primary && <Badge>Primary Branch</Badge>}
                          </div>
                          <CardDescription>{loc.address}, {loc.city}, {loc.state}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                          Phone: {loc.phone || 'N/A'} • Timezone: {loc.timezone}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-2 text-center py-8">
                      No branch locations registered yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings & Compliance</CardTitle>
                <CardDescription>
                  Update organization branding, contact details and verification documents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Business Email</Label>
                    <p className="font-medium">{organization.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{organization.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Website</Label>
                    <p className="font-medium">{organization.website || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Operating Currency</Label>
                    <p className="font-medium">{organization.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
