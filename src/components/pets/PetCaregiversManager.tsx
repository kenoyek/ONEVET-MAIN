import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, UserPlus } from 'lucide-react';

interface Caregiver {
  id: string;
  user_id: string;
  relationship: string | null;
  permission_level: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface PetCaregiversManagerProps {
  petId: string;
  ownerId: string;
  currentUserId: string;
  caregivers: Caregiver[];
  onRefresh: () => void;
}

export const PetCaregiversManager: React.FC<PetCaregiversManagerProps> = ({
  caregivers,
  onRefresh,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'view_only' | 'manage_bookings' | 'manage_health_records' | 'full_owner_access'>('view_only');
  const [submitting, setSubmitting] = useState(false);

  const handleAddCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter caregiver email');
      return;
    }

    setSubmitting(true);
    try {
      // In production, resolves user ID by email via RPC
      toast.error('Caregiver invitations are not deployed yet. No invitation was sent.');
      setDialogOpen(false);
      setInviteEmail('');
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to invite caregiver');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Shared Caregivers & Family Access
          </CardTitle>
          <CardDescription>
            Grant co-owners, family members or pet sitters access to this pet passport.
          </CardDescription>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Add Caregiver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Shared Pet Caregiver</DialogTitle>
              <DialogDescription>
                Select permission level to grant shared access to this pet's medical passport.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddCaregiver} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="caregiverEmail">Caregiver Email Address *</Label>
                <Input
                  id="caregiverEmail"
                  type="email"
                  required
                  placeholder="family@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permLevel">Permission Level *</Label>
                <Select
                  value={permissionLevel}
                  onValueChange={(val) => setPermissionLevel(val as 'view_only' | 'manage_bookings' | 'manage_health_records' | 'full_owner_access')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select permission level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view_only">View Only (Read Health Passport)</SelectItem>
                    <SelectItem value="manage_bookings">Manage Bookings (Book Appointments)</SelectItem>
                    <SelectItem value="manage_health_records">Manage Health Records (Upload & Add Records)</SelectItem>
                    <SelectItem value="full_owner_access">Full Co-Owner Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Access Invite'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {caregivers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No additional caregivers have been granted access to this pet yet.
          </p>
        ) : (
          <div className="space-y-3">
            {caregivers.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs">
                    {c.user?.first_name?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {c.user?.first_name} {c.user?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.user?.email}</p>
                  </div>
                </div>

                <Badge variant="outline" className="capitalize text-xs">
                  {c.permission_level.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
