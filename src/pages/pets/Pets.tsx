import {useAuth} from '@/lib/auth-context';
import {discoverPets,petSpeciesOptions} from '@/lib/pet-discovery';
import { PageHeading } from '@/components/layout/PageHeading';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, PawPrint, Search } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PetCard } from '@/components/pets/PetCard';

const Pets = () => {
  const {user}=useAuth();
  return <PetWorkspace key={user?.id||'guest'}/>;
};
const PetWorkspace=()=>{
  const { pets, isLoading, isError, refetch } = usePets();
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');

  const [sort,setSort]=useState('recent');
  const filteredPets=discoverPets(pets,searchQuery,speciesFilter,sort);
  const filtered=!!searchQuery||speciesFilter!=='all'||sort!=='recent';
  function clearFilters(){setSearchQuery('');setSpeciesFilter('all');setSort('recent');}

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container-wide pt-28 md:pt-36 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <PageHeading size="workspace" className="" title={<> My Pets </>}/>
              <p className="text-muted-foreground mt-1">
                Keep their details and owner-reported care history together. Open a profile to view its journal.
              </p>
            </div>
            <Link to="/pets/new">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Pet
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search pets by name or breed" maxLength={120} type="search"
                placeholder="Search by name or breed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger aria-label="Filter by species" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by species" />
              </SelectTrigger>
              <SelectContent>
                {petSpeciesOptions.map(([value,label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="sr-only" htmlFor="pet-sort">Sort pet profiles</label><select id="pet-sort" aria-label="Sort pet profiles" className="w-full sm:w-44 rounded-xl border bg-background p-3 text-sm" value={sort} onChange={event=>setSort(event.target.value)}><option value="recent">Recently added</option><option value="name">Name · A–Z</option></select>
          </div>
          {!isLoading&&!isError&&<div className="mb-6 flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted-foreground">Showing {filteredPets.length} of {pets.length} animal profiles</p>{filtered&&<Button variant="ghost" onClick={clearFilters}>Clear profile filters</Button>}</div>}
          {/* Pet Grid */}
          {isError ? <section role="alert" className="care-path"><h2 className="text-xl mb-3">We couldn’t load your pets.</h2><p className="text-muted-foreground mb-4">Check your connection and try again.</p><Button onClick={()=>refetch()}>Try again</Button></section> : isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filteredPets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          ) : pets.length > 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No profiles match these filters</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <PawPrint className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pets yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start with a name and species. You can add more details later and request veterinary care separately.
              </p>
              <Link to="/pets/new">
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add Your First Pet
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Pets;
