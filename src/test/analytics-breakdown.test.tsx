import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import {AnalyticsBreakdown} from '@/components/admin/AnalyticsBreakdown';
afterEach(cleanup);
const rows = Array.from({length: 12}, (_, i) => ({label: `City ${String(i).padStart(2, '0')}`, views: 12 - i, visitors: i + 1}));
it('paginates, searches case-insensitively and clears without losing rows', () => {
 render(<AnalyticsBreakdown title="Cities" rows={rows}/>);
 expect(screen.queryByText('City 11')).not.toBeInTheDocument();
 fireEvent.click(screen.getByLabelText('Next Cities rows'));
 expect(screen.getByText('City 11')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Search Cities'), {target:{value:' CITY 00 '}});
 expect(screen.getByText('City 00')).toBeInTheDocument();
 expect(screen.queryByText('City 11')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Search Cities'), {target:{value:'absent'}});
 expect(screen.getByRole('status')).toHaveTextContent('No matching rows.');
 fireEvent.click(screen.getByRole('button', {name:'Clear search'}));
 expect(screen.getByRole('status')).toHaveTextContent('1–10 of 12');
});
it('sorts by browsers and clamps pagination when refreshed data shrinks', () => {
 const {rerender} = render(<AnalyticsBreakdown title="Cities" rows={rows}/>);
 fireEvent.change(screen.getByLabelText('Sort Cities'), {target:{value:'visitors'}});
 expect(within(screen.getByRole('table')).getAllByRole('row')[1]).toHaveTextContent('City 11');
 fireEvent.click(screen.getByLabelText('Next Cities rows'));
 rerender(<AnalyticsBreakdown title="Cities" rows={rows.slice(0, 1)}/>);
 expect(screen.getByText('City 00')).toBeInTheDocument();
 expect(screen.getByRole('status')).toHaveTextContent('1–1 of 1');
});
it('distinguishes missing measurements from an empty search', () => {
 render(<AnalyticsBreakdown title="Cities" rows={[]}/>);
 expect(screen.getByText('No measured data in this period.')).toBeInTheDocument();
 expect(screen.queryByLabelText('Search Cities')).not.toBeInTheDocument();
});
