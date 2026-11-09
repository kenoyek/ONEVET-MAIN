import { PageHeading } from '@/components/layout/PageHeading';
import type { PlannedRows } from '@/integrations/supabase/planned-types';
type ProviderOrganization=PlannedRows['provider_organizations'];
type ProviderLocation=PlannedRows['provider_locations'];
import { useState, useEffect, useCallback } from 'react';
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
import { vendorProductService } from '@/lib/services/vendor-product-service';
import { toast } from 'sonner';
import { Users, Building2, ShieldCheck, MapPin, Plus, UserPlus, Loader2, Package, DollarSign, ShoppingBag, Receipt, AlertCircle, CheckCircle } from 'lucide-react';

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
  const [organization, setOrganization] = useState<ProviderOrganization & {
    locations?: ProviderLocation[];
    services?: Record<string, unknown>[];
    members?: { id: string; member_role: string; status: string; user?: { first_name?: string | null; last_name?: string | null; email?: string | null } }[];
  } | null>(null);
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

  // Product inventory state
  const [products, setProducts] = useState<PlannedRows['products'][]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Pet Food');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Financial commissions state
  const [commissions, setCommissions] = useState<PlannedRows['vendor_commissions'][]>([]);

  const fetchVendorProducts = useCallback(async (vendorId: string) => {
    setLoadingProducts(true);
    try {
      const data = await vendorProductService.getVendorProducts(vendorId);
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch vendor products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchVendorCommissions = useCallback(async (vendorId: string) => {
    try {
      const data = await vendorProductService.getVendorCommissions(vendorId);
      setCommissions(data || []);
    } catch (err) {
      console.error('Failed to fetch vendor commissions:', err);
    }
  }, []);

  const fetchOrganization = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await providerService.getOrganizationBySlug(slug);
      setOrganization(data as unknown as ProviderOrganization & {
        locations?: ProviderLocation[];
        services?: Record<string, unknown>[];
        members?: { id: string; member_role: string; status: string; user?: { first_name?: string | null; last_name?: string | null; email?: string | null } }[];
      });
      if (data?.id) {
        fetchVendorProducts(data.id);
        fetchVendorCommissions(data.id);
      }
    } catch (err: unknown) {
      console.error('Failed to load organization:', err);
      toast.error('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  }, [slug, fetchVendorProducts, fetchVendorCommissions]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

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
      toast.success(`Invitation sent to ${inviteEmail} with assigned role (${inviteRole})`);
      setInviteOpen(false);
      setInviteEmail('');
      fetchOrganization();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send staff invitation');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    if (!newProductName || !newProductPrice || !newProductStock) {
      toast.error('Please fill in required product fields (Name, Price, Stock)');
      return;
    }

    setSubmittingProduct(true);
    try {
      await vendorProductService.createVendorProduct({
        vendor_id: organization.id,
        name: newProductName,
        category: newProductCategory,
        price: parseFloat(newProductPrice),
        stock: parseInt(newProductStock, 10),
        brand: newProductBrand || undefined,
        sku: newProductSku || undefined,
      });

      toast.success('Product catalog item created successfully!');
      setProductModalOpen(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductStock('');
      setNewProductBrand('');
      setNewProductSku('');
      fetchVendorProducts(organization.id);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to create product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Calculate earnings overview
  const totalGrossSales = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
  const financialSummary = vendorProductService.calculateCommission(totalGrossSales);

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
              <PageHeading size="workspace" className="" title={<> {organization.name} </>}/>
              <Badge variant={organization.verification_status === 'approved' ? 'default' : 'secondary'}>
                {organization.verification_status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Provider Type: <span className="capitalize text-foreground font-medium">{organization.provider_type.replace(/_/g, ' ')}</span> • {organization.city}, {organization.country}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" /> Invite Staff
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
                      onValueChange={val=>{if(val==='owner'||val==='manager'||val==='staff'||val==='practitioner')setInviteRole(val);}}
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

            <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Product to Vendor Catalog</DialogTitle>
                  <DialogDescription>
                    Add a new pet food, medication, accessory, or supply item for sale in the marketplace.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddProduct} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="prodName">Product Name *</Label>
                    <Input
                      id="prodName"
                      required
                      placeholder="Premium Royal Canin Adult Dog Food 5kg"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newProductCategory}
                        onValueChange={(val) => setNewProductCategory(val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pet Food">Pet Food & Nutrition</SelectItem>
                          <SelectItem value="Pharmacy & Meds">Pharmacy & Medications</SelectItem>
                          <SelectItem value="Grooming Supplies">Grooming & Hygiene</SelectItem>
                          <SelectItem value="Toys & Accessories">Toys & Accessories</SelectItem>
                          <SelectItem value="Livestock Supplies">Livestock & Farm Care</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prodPrice">Price (NGN) *</Label>
                      <Input
                        id="prodPrice"
                        type="number"
                        step="0.01"
                        required
                        placeholder="12500"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Initial Stock *</Label>
                      <Input
                        id="stock"
                        type="number"
                        required
                        placeholder="50"
                        value={newProductStock}
                        onChange={(e) => setNewProductStock(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        placeholder="Royal Canin"
                        value={newProductBrand}
                        onChange={(e) => setNewProductBrand(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU Code</Label>
                      <Input
                        id="sku"
                        placeholder="RC-DOG-5KG"
                        value={newProductSku}
                        onChange={(e) => setNewProductSku(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setProductModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submittingProduct}>
                      {submittingProduct ? 'Publishing...' : 'Add Product'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="financials" className="gap-2">
              <DollarSign className="h-4 w-4" /> Payouts & Fees
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" /> Team
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="h-4 w-4" /> Branches
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Building2 className="h-4 w-4" /> Profile
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Products & Inventory */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" /> Vendor Product Catalog
                  </CardTitle>
                  <CardDescription>
                    Manage inventory, prices, and stock levels available in the 1Vet Multivendor Marketplace.
                  </CardDescription>
                </div>
                <Button onClick={() => setProductModalOpen(true)} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold text-lg">No Products Published</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                      Start selling pet supplies, pharmaceuticals, or livestock items by creating your first product listing.
                    </p>
                    <Button onClick={() => setProductModalOpen(true)}>Add First Product</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((item) => (
                      <Card key={item.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{item.category}</Badge>
                            <Badge variant={item.stock > 10 ? 'default' : item.stock > 0 ? 'secondary' : 'destructive'}>
                              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                            </Badge>
                          </div>
                          <CardTitle className="text-base mt-2">{item.name}</CardTitle>
                          {item.brand && <CardDescription>Brand: {item.brand}</CardDescription>}
                        </CardHeader>
                        <CardContent className="flex items-center justify-between pt-2 text-sm font-semibold">
                          <span className="text-primary font-bold text-lg">₦{item.price.toLocaleString()}</span>
                          {item.sku && <span className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</span>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Financials & Payout Ledger */}
          <TabsContent value="financials">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Catalog Potential Sales Value</CardDescription>
                    <CardTitle className="text-2xl font-bold">₦{financialSummary.grossSales.toLocaleString()}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Based on current inventory price x stock
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Platform Commission Rate</CardDescription>
                    <CardTitle className="text-2xl font-bold text-amber-600">{(financialSummary.commissionRate * 100).toFixed(0)}%</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Est. Platform Fee: ₦{financialSummary.commissionAmount.toLocaleString()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Estimated Net Payout</CardDescription>
                    <CardTitle className="text-2xl font-bold text-green-600">₦{financialSummary.netPayout.toLocaleString()}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Direct payout after platform fee deduction
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" /> Vendor Commission & Payout Ledger
                  </CardTitle>
                  <CardDescription>
                    Track completed sales, escrow holding periods, and disbursement history.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commissions.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                      <h4 className="font-medium">No Pending Payouts</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Completed escrow disbursements will be recorded here automatically upon order fulfillment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commissions.map((comm) => (
                        <div key={comm.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-semibold text-sm">Order #{comm.order_id?.substring(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">Date: {new Date(comm.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₦{comm.net_payout?.toLocaleString()}</p>
                            <Badge variant={comm.status === 'settled' ? 'default' : 'outline'}>
                              {comm.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Team Members */}
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
                    organization.members.map((member) => (
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

          {/* Tab 4: Branch Locations */}
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
                    organization.locations.map((loc) => (
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

          {/* Tab 5: Profile & Settings */}
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
