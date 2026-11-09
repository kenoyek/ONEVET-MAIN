import { PageHeading } from '@/components/layout/PageHeading';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, CreditCard, Search, Filter, Loader2, 
  CheckCircle, XCircle, Clock, AlertCircle, Edit, Save
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  user?: {
    email: string;
  };
  profile?: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
  plan?: {
    name: string;
    price: number;
  } | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  trial: { label: 'Trial', variant: 'secondary' },
  expired: { label: 'Expired', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Edit dialog state
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    plan_id: '',
    expires_at: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch subscriptions with user and plan info
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(name, price)
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch profiles for the subscriptions
      const userIds = subsData?.map(s => s.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      // Merge profile data
      const enrichedSubs = subsData?.map(sub => ({
        ...sub,
        profile: profilesData?.find(p => p.user_id === sub.user_id),
      })) || [];

      setSubscriptions(enrichedSubs);

      // Fetch plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, name, price')
        .eq('is_active', true);

      setPlans(plansData || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setEditForm({
      status: subscription.status,
      plan_id: subscription.plan_id || '',
      expires_at: subscription.expires_at ? subscription.expires_at.slice(0,10) : '',
    });
  };

  const handleSaveSubscription = async () => {
    if (!editingSubscription) return;

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        status: editForm.status,
        plan_id: editForm.plan_id || null,
        expires_at: editForm.expires_at ? new Date(editForm.expires_at).toISOString() : null,
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', editingSubscription.id);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        action: 'subscription_updated',
        entity_type: 'subscription',
        entity_id: editingSubscription.id,
        details: {
          old_status: editingSubscription.status,
          new_status: editForm.status,
          user_id: editingSubscription.user_id,
        },
      });

      toast.success('Subscription updated successfully!');
      setEditingSubscription(null);
      fetchData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = searchQuery === '' || 
      sub.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container-wide py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <PageHeading size="workspace" className="" title={<> Subscription Management </>}/>
              <p className="text-muted-foreground mt-1">
                View and manage user subscriptions
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscriptions ({filteredSubscriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No subscriptions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => {
                        const status = statusConfig[sub.status] || {label:'Unknown',variant:'outline' as const};
                        return (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {sub.profile?.first_name} {sub.profile?.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {sub.profile?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {sub.plan?.name || 'No Plan'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(sub.starts_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {sub.expires_at 
                                ? format(new Date(sub.expires_at), 'MMM d, yyyy')
                                : 'No Expiry'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(sub)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription status and expiry for{' '}
              {editingSubscription?.profile?.first_name} {editingSubscription?.profile?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={editForm.status} 
                onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plan</Label>
              <Select 
                value={editForm.plan_id} 
                onValueChange={(v) => setEditForm(prev => ({ ...prev, plan_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} (₦{plan.price.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={editForm.expires_at}
                onChange={(e) => setEditForm(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubscription(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubscription} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
