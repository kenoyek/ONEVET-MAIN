import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Stethoscope, ShoppingBag, Landmark, TrendingUp,
  ArrowUpRight, ArrowDownRight, Calendar, Filter, Download,
  MapPin, CheckCircle, Clock, AlertCircle, UserPlus, Search,
  RefreshCcw
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [stats, setStats] = useState<any>({
    users: { total: 0, today: 0, week: 0, month: 0, growth: 0 },
    customers: { pet: 0, farm: 0, livestock: 0 },
    vendors: { vets: 0, groomers: 0, pharmacies: 0, stores: 0, pending: 0 },
  });

  const [registrationTrend, setRegistrationTrend] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();

      // Fetch total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (usersError) throw new Error(`Profiles: ${usersError.message}`);

      // Fetch new users today
      const { count: newToday, error: todayError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      if (todayError) throw new Error(`Today's registrations: ${todayError.message}`);

      // Fetch vendor breakdown
      const { data: vendors, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, user_id')
        .in('role', ['veterinarian', 'service_provider']);
      if (rolesError) throw new Error(`User Roles: ${rolesError.message}`);

      // Fetch customer breakdown
      const { data: customerData, error: breakdownError } = await supabase
        .from('profiles')
        .select('customer_type, vendor_type, license_verified');
      if (breakdownError) throw new Error(`Customer Breakdown: ${breakdownError.message}`);

      const vetCount = customerData?.filter(p => p.vendor_type === 'veterinarian' || p.vendor_type === 'vet').length || 0;
      const groomerCount = customerData?.filter(p => p.vendor_type === 'groomer').length || 0;
      const pendingCount = customerData?.filter(p => !p.license_verified && p.vendor_type).length || 0;

      setStats({
        users: {
          total: totalUsers || 0,
          today: newToday || 0,
          week: Math.floor((newToday || 0) * 5), // Mock for now
          month: Math.floor((newToday || 0) * 20),
          growth: 12.5
        },
        customers: {
          pet: customerData?.filter(p => p.customer_type === 'pet_owner').length || 0,
          farm: customerData?.filter(p => p.customer_type === 'farm_owner').length || 0,
          livestock: customerData?.filter(p => p.customer_type === 'livestock_owner').length || 0,
        },
        vendors: {
          vets: vetCount,
          groomers: groomerCount,
          pharmacies: customerData?.filter(p => p.vendor_type === 'pharmacy').length || 0,
          stores: customerData?.filter(p => p.vendor_type === 'store').length || 0,
          pending: pendingCount
        }
      });

      // Mock registration trend data
      const trend = Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        registrations: Math.floor(Math.random() * 20) + 5,
        vets: Math.floor(Math.random() * 5),
        customers: Math.floor(Math.random() * 15) + 5,
      }));
      setRegistrationTrend(trend);

      // Fetch recent registrations
      const { data: recent, error: recentError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, created_at, vendor_type, customer_type')
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentError) throw new Error(`Recent users: ${recentError.message}`);

      setRecentUsers(recent || []);

    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'An unexpected error occurred');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-wide py-20 flex flex-col items-center justify-center text-center">
          <TrendingUp className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h2 className="text-xl font-bold mb-2">Preparing Analytics</h2>
          <p className="text-muted-foreground max-w-xs">Aggregating platform data for your review. This may take a few seconds...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-wide py-20 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Analytics Error</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <div className="flex gap-4">
            <Button onClick={() => fetchAnalyticsData()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-wide py-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Real-time platform growth and user registration insights.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span className="text-green-500 flex items-center font-medium">
                  <ArrowUpRight className="w-3 h-3" /> +{stats.users.growth}%
                </span>
                from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Today</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.today}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.users.week} registrations this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vendors.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires admin review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vets</CardTitle>
              <Stethoscope className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vendors.vets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Verified veterinary doctors
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
          {/* Main Growth Chart */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Registration Trend</CardTitle>
              <CardDescription>Daily user signups across all roles</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrationTrend}>
                  <defs>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorReg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Role Breakdown */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Distribution of platform participants</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pet Owners', value: stats.customers.pet || 5 },
                      { name: 'Farm Owners', value: stats.customers.farm || 2 },
                      { name: 'Vets', value: stats.vendors.vets || 3 },
                      { name: 'Other Vendors', value: (stats.vendors.groomers + stats.vendors.pharmacies + stats.vendors.stores) || 4 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Funnel and Geography */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Registration Funnel</CardTitle>
              <CardDescription>User conversion through onboarding steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Started Registration', value: 100, color: 'bg-primary/20' },
                { label: 'Email Verified', value: 85, color: 'bg-primary/40' },
                { label: 'Profile Completed', value: 65, color: 'bg-primary/60' },
                { label: 'Payment Method Added', value: 40, color: 'bg-primary/80' },
                { label: 'Active Subscriber/Vendor', value: 25, color: 'bg-primary' },
              ].map((step, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{step.label}</span>
                    <span className="font-bold">{step.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} transition-all duration-1000`}
                      style={{ width: `${step.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geographic Insights</CardTitle>
              <CardDescription>Top performing regions in Nigeria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { state: 'Lagos', users: 450, growth: '+12%' },
                  { state: 'Abuja (FCT)', users: 320, growth: '+8%' },
                  { state: 'Rivers', users: 210, growth: '+15%' },
                  { state: 'Oyo', users: 180, growth: '+5%' },
                  { state: 'Kano', users: 150, growth: '+2%' },
                ].map((region, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{region.state}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold">{region.users} users</span>
                      <Badge variant="secondary" className="text-green-600 bg-green-100 border-none">
                        {region.growth}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" /> Vets
                </span>
                <span className="font-bold">{stats.vendors.vets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Pet Stores
                </span>
                <span className="font-bold">{stats.vendors.stores}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> Pharmacies
                </span>
                <span className="font-bold">{stats.vendors.pharmacies}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> Groomers
                </span>
                <span className="font-bold">{stats.vendors.groomers}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Registrations</CardTitle>
                <CardDescription>Latest users to join 1Vet</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/users">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 font-medium">User</th>
                      <th className="px-4 py-2 font-medium">Role/Type</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {user.vendor_type || user.customer_type || 'User'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">Verified</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor Approval Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Approval Queue</CardTitle>
            <CardDescription>Review new service provider applications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.vendors.pending > 0 ? (
              <div className="space-y-4">
                {/* List would go here */}
                <p className="text-sm text-muted-foreground">You have {stats.vendors.pending} pending applications to review.</p>
                <Button asChild>
                  <Link to="/admin">Go to Verification Queue</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500/20 mx-auto mb-3" />
                <p className="text-muted-foreground">Everything caught up! No pending applications.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;

export default Analytics;
