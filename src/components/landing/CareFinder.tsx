import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowUpRight, MapPin} from 'lucide-react';
import {careSearchCategories,careSearchLink} from '@/lib/care-search';

export function CareFinder(){
 const navigate=useNavigate();const [category,setCategory]=useState('veterinary');const [city,setCity]=useState('');
 return <section className="container-wide welcome-finder" aria-labelledby="care-finder-heading">
  <div className="welcome-finder-card"><div><p className="welcome-kicker">Your next step starts here</p><h2 id="care-finder-heading">What care are you looking for?</h2><p>Browse providers before creating an account.</p></div>
   <form onSubmit={event=>{event.preventDefault();navigate(careSearchLink(category,city));}}>
    <label><span>Type of care</span><select value={category} onChange={event=>setCategory(event.target.value)}>{careSearchCategories.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
    <label><span>City <small>(optional)</small></span><div className="welcome-finder-city"><MapPin size={16} aria-hidden="true"/><input value={city} maxLength={80} autoComplete="address-level2" placeholder="e.g. Lagos or Ibadan" onChange={event=>setCity(event.target.value)}/></div></label>
    <button className="welcome-button welcome-button-primary" type="submit">Find care <span><ArrowUpRight size={19} aria-hidden="true"/></span></button>
   </form>
   <p className="welcome-finder-note">Availability and fees depend on the provider. For immediate distress, seek in-person veterinary care.</p>
  </div>
 </section>;
}
