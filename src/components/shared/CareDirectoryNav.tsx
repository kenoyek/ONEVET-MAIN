import { Link } from 'react-router-dom';
import { careLocationParams } from '@/lib/care-search';

const directories = [
  { path: '/find-a-vet', label: 'Find a vet' },
  { path: '/provider-marketplace', label: 'Care services' },
  { path: '/boarding', label: 'Pet boarding' },
];

interface Props {
  currentPath: string;
  city: string;
  state: string;
}

export function CareDirectoryNav({ currentPath, city, state }: Props) {
  const search = careLocationParams(city, state).toString();

  return (
    <nav aria-label="Care directories" className="flex flex-wrap items-center gap-2">
      {directories.map(({ path, label }) => (
        currentPath === path ? (
          <span key={path} aria-current="page" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            {label}
          </span>
        ) : (
          <Link key={path} to={{ pathname: path, search }}
            className="rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            {label}
          </Link>
        )
      ))}
    </nav>
  );
}
