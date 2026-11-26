import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, MapPin } from 'lucide-react';
import { NigeriaStatePicker } from '@/components/shared/NigeriaStatePicker';
import { careSearchCategories, careSearchLink } from '@/lib/care-search';

const finderCategories = [...careSearchCategories, ['boarding', 'Pet boarding']] as const;

export function CareFinder() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('veterinary');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  return (
    <section className="container-wide welcome-finder" aria-labelledby="care-finder-heading">
      <div className="welcome-finder-card">
        <h2 id="care-finder-heading">Find care near you</h2>
        <p className="welcome-finder-intro">Browse without an account. Providers confirm availability and fees.</p>
        <form onSubmit={event => {
          event.preventDefault();
          navigate(careSearchLink(category, city, state));
        }}>
          <div className="welcome-finder-field">
            <label htmlFor="care-finder-type">Type of care</label>
            <div className="welcome-finder-control">
              <select id="care-finder-type" value={category} onChange={event => setCategory(event.target.value)}>
                {finderCategories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
              <ChevronDown className="welcome-finder-chevron" size={17} aria-hidden="true" />
            </div>
          </div>
          <div className="welcome-finder-field">
            <label htmlFor="care-finder-city">City <small>(optional)</small></label>
            <div className="welcome-finder-control">
              <MapPin className="welcome-finder-pin" size={17} aria-hidden="true" />
              <input id="care-finder-city" value={city} maxLength={80} autoComplete="address-level2"
                placeholder="e.g. Lagos or Ibadan" onChange={event => setCity(event.target.value)} />
            </div>
          </div>
          <div className="welcome-finder-field">
            <label htmlFor="care-finder-state">State or FCT <small>(optional)</small></label>
            <div className="welcome-finder-control">
              <NigeriaStatePicker id="care-finder-state" value={state} onChange={event => setState(event.target.value)} />
              <ChevronDown className="welcome-finder-chevron" size={17} aria-hidden="true" />
            </div>
          </div>
          <button className="welcome-button welcome-button-primary" type="submit">
            Find care <span><ArrowUpRight size={19} aria-hidden="true" /></span>
          </button>
        </form>
      </div>
    </section>
  );
}
