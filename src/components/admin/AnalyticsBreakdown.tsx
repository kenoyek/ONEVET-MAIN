import {useId, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import type {AnalyticsRow} from '@/lib/services/site-analytics-service';

const pageSize = 10;
export function AnalyticsBreakdown({title, description, rows, entries = false}: {
  title: string; description?: string; rows: AnalyticsRow[]; entries?: boolean;
}) {
  const id = useId();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('views');
  const [page, setPage] = useState(0);
  const filtered = rows.filter(row => row.label.toLowerCase().includes(search.trim().toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'label') return a.label.localeCompare(b.label);
    return (sort === 'visitors' ? b.visitors - a.visitors : b.views - a.views) || a.label.localeCompare(b.label);
  });
  const lastPage = Math.max(0, Math.ceil(sorted.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const visible = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  return <section aria-labelledby={id} className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
    <h2 id={id} className="text-xl font-semibold">{title}</h2>
    {description && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>}
    {!rows.length ? <p className="mt-5 text-sm text-muted-foreground">No measured data in this period.</p> : <>
      <div className="mt-5 flex flex-wrap gap-3">
        <label className="min-w-0 flex-1 text-xs">Search returned rows
          <Input className="mt-2" aria-label={`Search ${title}`} value={search} onChange={event => {setSearch(event.target.value); setPage(0);}} />
        </label>
        <label className="text-xs">Sort by
          <select aria-label={`Sort ${title}`} className="mt-2 block rounded-xl border bg-background p-3 text-sm" value={sort} onChange={event => {setSort(event.target.value); setPage(0);}}>
            <option value="views">{entries ? 'Sessions' : 'Views'} · highest first</option>
            <option value="visitors">Browsers · highest first</option><option value="label">Detail · A–Z</option>
          </select>
        </label>
      </div>
      <p role="status" className="mt-3 text-xs text-muted-foreground">{sorted.length ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, sorted.length)} of ${sorted.length}` : 'No matching rows.'} · {rows.length} returned for this report</p>
      {!!visible.length && <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">{title}</caption><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-3 pr-3 font-medium">Detail</th><th className="pb-3 px-2 text-right font-medium">{entries ? 'Sessions' : 'Views'}</th><th className="pb-3 pl-2 text-right font-medium">Browsers</th></tr></thead><tbody>{visible.map(row => <tr key={row.label} className="border-b last:border-0"><td className="py-3 pr-3 max-w-[16rem] break-words">{row.label}</td><td className="py-3 px-2 text-right tabular-nums">{row.views.toLocaleString()}</td><td className="py-3 pl-2 text-right tabular-nums">{row.visitors.toLocaleString()}</td></tr>)}</tbody></table></div>}
      {lastPage > 0 && <div className="mt-4 flex flex-wrap items-center gap-3"><Button variant="outline" disabled={!currentPage} onClick={() => setPage(currentPage - 1)} aria-label={`Previous ${title} rows`}>Previous</Button><span className="text-xs">Page {currentPage + 1} of {lastPage + 1}</span><Button variant="outline" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)} aria-label={`Next ${title} rows`}>Next</Button></div>}
      {!!search && <Button className="mt-3" variant="ghost" onClick={() => {setSearch(''); setPage(0);}}>Clear search</Button>}
    </>}
  </section>;
}
