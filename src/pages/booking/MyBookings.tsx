import { PageHeading } from '@/components/layout/PageHeading';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { BookingRequestList } from '@/components/provider/BookingRequestList';
export default function MyBookings(){return <div className="min-h-screen bg-background"><Navbar/><main id="main-content" tabIndex={-1} className="container-wide max-w-4xl pt-32 pb-20"><PageHeading size="workspace" className="mb-4" title={<> Your appointments </>}/><p className="text-muted-foreground mb-6">Requests need provider confirmation. No online payment is collected. You can cancel a pending or confirmed request with an explanation.</p><Link className="text-primary underline block mb-6" to="/provider-marketplace">Browse care services</Link><BookingRequestList/></main></div>;}
