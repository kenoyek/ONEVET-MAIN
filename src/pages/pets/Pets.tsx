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

const SPECIES_FILTER_OPTIONS = [
  { value: 'all', label: 'All Species' },
  { value: 'dog', label: 'Dogs' },
  { value: 'cat', label: 'Cats' },
  { value: 'bird', label: 'Birds' },
  { value: 'rabbit', label: 'Rabbits' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'other', label: 'Other' },
];

const Pets = () => {
  const { pets, isLoading } = usePets();
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');

  const filteredPets = pets.filter((pet) => {
    const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesSpecies = true;
    if (speciesFilter !== 'all') {
      if (speciesFilter === 'livestock') {
        matchesSpecies = ['cattle', 'goat', 'sheep', 'poultry', 'pig', 'horse'].includes(pet.species);
      } else if (speciesFilter === 'other') {
        matchesSpecies = !['dog', 'cat', 'bird', 'rabbit', 'cattle', 'goat', 'sheep', 'poultry', 'pig', 'horse'].includes(pet.species);
      } else {
        matchesSpecies = pet.species === speciesFilter;
      }
    }
    
    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold">My Pets</h1>
              <p className="text-muted-foreground mt-1">
                Manage your pet profiles and health records
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
                placeholder="Search by name or breed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by species" />
              </SelectTrigger>
              <SelectContent>
                {SPECIES_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pet Grid */}
          {isLoading ? (
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
              <h3 className="text-lg font-medium mb-2">No pets found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <PawPrint className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pets yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your first pet to start managing their health records and get access to veterinary consultations.
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
