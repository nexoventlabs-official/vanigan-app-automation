import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Store, Phone, MapPin, Tag, ChevronLeft, X, Star } from 'lucide-react';
import { getBusinesses, getDistricts } from '../api.js';
import { useNav } from '../App.jsx';

const SUB_CATEGORIES = {
  'Hospitals & Clinics': ['General Hospitals','Specialty Hospitals','Dental Clinics','Eye Hospitals','Ayurvedic Centers','Homeopathy Clinics','Multi-Specialty Hospitals','Nursing Homes','Physiotherapy Centers','Skin & Dermatology Clinics'],
  'Transport': ['Auto Rickshaw','Bus Services','Cab & Taxi','Car Rentals','Lorry & Truck Transport','Mini Van Services','Bike Taxi','Ambulance Services','School Van','Courier Bikes'],
  'Electricals & Electronics': ['Electrical Shops','Electronics Stores','LED & Lighting','CCTV & Security Systems','Solar Panel Dealers','Home Appliance Shops','Wiring & Electricians','Generator & Inverter','Mobile & Accessories','Computer & Laptop Shops'],
  'Education': ['Schools','Colleges & Universities','Coaching Centers','Online Tutors','Skill Development','Language Classes','Computer Training','Vocational Training','Driving Schools','Music & Arts Classes'],
  'Sports': ['Fitness Centers & Gyms','Yoga Studios','Cricket Academies','Football Clubs','Swimming Pools','Badminton Courts','Basketball Courts','Sports Equipment Shops','Martial Arts','Cycling Clubs'],
  'Real Estate': ['Residential Plots','Commercial Plots','Apartment Sales','Villa & Independent Houses','Land Brokers','Property Management','Interior Designers','Architect Services','Rental Properties','Real Estate Consultants'],
  'Spa & Beauty': ['Beauty Salons','Barber Shops','Spa & Wellness Centers','Nail Studios','Makeup Artists','Bridal Packages','Skin Care Clinics','Hair Transplant Clinics','Threading & Waxing','Tattoo Studios'],
  'Digital & IT Products': ['Software Solutions','Web Development','Mobile App Development','IT Hardware','Networking & WiFi Solutions','Cloud Services','Cybersecurity','Digital Printing','CCTV Installation','Data Recovery'],
  'Hire Services': ['Tent & Decor Hire','Sound System Hire','Projector & AV Hire','Vehicle Hire','Furniture Hire','Generator Hire','Event Equipment Hire','Costume Hire','Catering Equipment Hire','Photography Equipment Hire'],
  'Automobile': ['Car Showrooms','Bike Showrooms','Car Service Centers','Bike Service Centers','Spare Parts Shops','Tyre & Battery Dealers','Auto Body Works','Driving Schools','Used Vehicle Dealers','EV Charging Stations'],
  'B2B Services': ['Wholesale Suppliers','Raw Material Suppliers','Industrial Equipment','Packaging Solutions','Export & Import Services','Manufacturing Units','Quality Testing Labs','Consulting Services','HR & Staffing','Freight & Logistics'],
  'Banquets & Event Halls': ['Wedding Halls','Conference Halls','Mini Auditoriums','Rooftop Venues','Outdoor Event Spaces','Community Halls','Corporate Event Venues','Birthday Party Halls','Stage & Event Setup','Heritage Venues'],
  'Bills & Recharge': ['Mobile Recharge Shops','DTH & Cable Services','Electricity Bill Payment','Insurance Premium Collection','Aadhaar & PAN Services','Xerox & Printing Shops','Bank & Fintech Agents','Ticket Booking','Online Bill Payment Centers','Government Service Centers'],
  'Caterers': ['Wedding Caterers','Corporate Caterers','Tiffin Services','Home-Based Caterers','Mess & Canteen Services','Diet & Health Food','Vegan & Organic Food Caterers','Live Counter Catering','Mini Meals Providers','Snack & Sweets Caterers'],
  'Civil Contractors': ['Building Contractors','Road Construction','Plumbing Services','Interior Works','Floor & Tile Work','Painting Services','Waterproofing Services','Steel Fabrication','Masonry & Brick Work','Roofing Services'],
  'Daily Needs': ['Supermarkets & Grocery','Milk & Dairy','Vegetable & Fruit Shops','Bakery & Bread','Personal Care Products','Stationery & Books','Meat & Fish Shops','Pet Food & Supplies','Household Items','Local Kirana Stores'],
  'Doctors': ['General Physicians','Pediatricians','Gynecologists','Orthopedic Doctors','Cardiologists','Neurologists','ENT Specialists','Dermatologists','Psychiatrists','Ophthalmologists'],
  'Jobs': ['Job Placement Agencies','Government Job Coaching','Private Company Recruitment','IT & Software Jobs','Healthcare Recruitment','Driver & Delivery Jobs','Home-Based Work','Internship Programs','Blue-Collar Workforce','Freelance Platforms'],
  'Jewellery': ['Gold Jewellery Shops','Silver Jewellery','Diamond Jewellery','Platinum Jewellery','Imitation Jewellery','Antique Jewellery','Temple Jewellery','Bridal Jewellery','Gemstone & Rings','Custom Jewellery Makers'],
  'Labs & Diagnostics': ['Blood Test Labs','Scan Centers','X-Ray & MRI Centers','Pathology Labs','COVID Testing Centers','DNA Testing Centers','Eye Testing Centers','Dental X-Ray Labs','Home Sample Collection','Molecular Diagnostic Labs'],
  'Banking & Finance': ['Banks','Credit Cooperative Societies','Microfinance Companies','Insurance Agents','Mutual Fund Advisors','Loan Services','Chit Fund Companies','Money Transfer Services','Stock Brokers','Financial Planning Services'],
  'Packers & Movers': ['Local Shifting Services','Inter-City Movers','International Movers','Vehicle Transport','Office Relocation','Home Relocation','Warehouse & Storage','Fragile Item Packing','Bike & Car Transport','Loading & Unloading Services'],
  'Wedding Services': ['Wedding Planners','Bridal Makeup Artists','Wedding Photographers','Videographers','Wedding DJs','Flower Decorators','Mehendi Artists','Catering for Weddings','Invitation Card Makers','Wedding Car Rentals'],
  'Hotels & Restaurants': ['Budget Hotels','Luxury Hotels','Restaurants','Dhabas & Mess','Fast Food Outlets','Cafes & Coffee Shops','Cloud Kitchens','Multi-Cuisine Restaurants','South Indian Restaurants','Rooftop Dining'],
  'Repairs': ['Mobile Phone Repair','Laptop & Computer Repair','Home Appliance Repair','TV Repair','AC Service & Repair','Watch Repair','Shoe Repair','Bike Repair','Car Denting & Painting','Plumbing Repairs'],
  'IT & Software': ['Custom Software Development','ERP Solutions','CRM Software','POS Systems','Website Design & Hosting','SEO & Digital Marketing','Accounting Software','School & College ERP','Hospital Management Software','E-Commerce Development'],
  'Construction Materials': ['Cement Dealers','Sand & Aggregate Suppliers','Bricks & Blocks','TMT Steel Bars','Roofing Sheets','Plumbing Materials','Paints & Coatings','Wood & Timber','Glass & Aluminium','Waterproofing Products'],
  'Pest Control': ['Cockroach Control','Termite Treatment','Mosquito Control','Rat & Rodent Control','Bed Bug Treatment','General Disinfection','Commercial Pest Control','Wood Borer Treatment','Fly Control','Honeybee Removal'],
  'Agriculture': ['Seed Suppliers','Fertilizer Dealers','Pesticide Shops','Irrigation Equipment','Farm Machinery Dealers','Organic Farming Consultants','Soil Testing Labs','Agri Input Shops','Poultry & Livestock Supplies','Cold Storage & Warehousing'],
  'Printing Services': ['Visiting Card Printing','Banner & Flex Printing','Brochure & Flyer Printing','Book Printing','T-Shirt Printing','Digital Printing Shops','Offset Printing','Wedding Invitation Printing','Packaging Printing','Stamp & Seal Makers'],
  'Textiles & Garments': ['Saree Shops','Dress Materials','Readymade Garments','Tailoring & Boutiques','School Uniform Suppliers','Fabric Wholesalers','Embroidery & Zari Work','Silk Sarees','Western Wear Shops','Kids Wear'],
  'Travel & Tourism': ['Travel Agencies','Tour Operators','Pilgrimage Tours','Adventure Travel','Holiday Packages','Visa Consultants','Hotel Booking Services','Foreign Exchange','Car Rentals for Tours','Cruise & Air Bookings'],
  'Home Appliances': ['Refrigerators','Washing Machines','Air Conditioners','Water Purifiers','Mixers & Grinders','Televisions','Microwaves & OTG','Fans & Coolers','Geysers & Water Heaters','Home Theater Systems'],
  'Demand Services': ['Plumbers on Demand','Electricians on Demand','Carpenters on Demand','Painters on Demand','Cleaning Services','Laundry & Dry Cleaning','Home Nursing','Babysitters & Nannies','Elderly Care Services','AC Technicians'],
  'Religious': ['Temples','Churches','Mosques','Puja Item Shops','Religious Book Stores','Astrology & Numerology','Vastu Consultants','Event Pooja Services','Prasad Distribution','Spiritual Retreat Centers'],
  'Organic Products': ['Organic Grocery Stores','Organic Farms','Herbal & Ayurvedic Products','Cold-Pressed Oils','Organic Dairy Products','Natural Skincare','Organic Pulses & Grains','Eco-Friendly Products','Health Supplements','Organic Fertilizers'],
  'Advertising': ['Outdoor Advertising','Digital Marketing Agencies','Social Media Marketing','Print Advertising','Radio & TV Ads','Brand Design Studios','SEO & SEM Services','Influencer Marketing','Photography Studios','Video Production'],
  'Insurance': ['Life Insurance','Health Insurance','Vehicle Insurance','Home Insurance','Crop Insurance','Fire & Burglary Insurance','Travel Insurance','Group Insurance','ULIP & Investment Plans','Insurance Claim Consultants'],
  'Advocate & Legal': ['Civil Lawyers','Criminal Lawyers','Family Law Advocates','Property & Real Estate Lawyers','Consumer Court Advocates','Labor & Employment Lawyers','Corporate Lawyers','Notary Services','Legal Document Services','Cyber Law Consultants'],
  'Courier Services': ['Local Courier Services','National Courier','International Courier','Document Courier','Parcel Delivery','Cold Chain Logistics','Bulk Cargo Shipping','Same Day Delivery','E-Commerce Fulfillment','Fragile Item Delivery'],
};

export default function BusinessList({ params = {} }) {
  const { navigate } = useNav();

  const [businesses, setBusinesses] = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  const [category,    setCategory]    = useState(params.category    || '');
  const [subcategory, setSubcategory] = useState(params.subcategory || '');
  const [search,      setSearch]      = useState(params.search      || '');
  const [district,    setDistrict]    = useState('');
  const [assembly,    setAssembly]    = useState('');
  const [districtMap, setDistrictMap] = useState({});
  const [searchInput, setSearchInput] = useState(params.search || '');

  const subCatOptions = category && SUB_CATEGORIES[category] ? SUB_CATEGORIES[category] : [];

  useEffect(() => {
    getDistricts().then(r => setDistrictMap(r.data.map || {})).catch(() => {});
  }, []);

  const fetch = useCallback((pg = 1) => {
    setLoading(true);
    const q = { page: pg };
    if (category)    q.category    = category;
    if (subcategory) q.subcategory = subcategory;
    if (search)      q.search      = search;
    if (district)    q.district    = district;
    if (assembly)    q.assembly    = assembly;
    getBusinesses(q)
      .then(r => { setBusinesses(r.data.businesses || []); setTotal(r.data.total || 0); setPage(pg); })
      .catch(() => { setBusinesses([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [category, subcategory, search, district, assembly]);

  useEffect(() => { fetch(1); }, [fetch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearFilter = (key) => {
    if (key === 'category')    { setCategory(''); setSubcategory(''); }
    if (key === 'subcategory') setSubcategory('');
    if (key === 'search')      { setSearch(''); setSearchInput(''); }
    if (key === 'district')    { setDistrict(''); setAssembly(''); }
    if (key === 'assembly')    setAssembly('');
  };

  const assemblies = district ? (districtMap[district] || []) : [];
  const activeFilters = [
    category    && { key: 'category',    label: category },
    subcategory && { key: 'subcategory', label: subcategory },
    search      && { key: 'search',      label: `"${search}"` },
    district    && { key: 'district',    label: district },
    assembly    && { key: 'assembly',    label: assembly },
  ].filter(Boolean);

  return (
    <div className="container section">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '13px', color: 'var(--color-cool-gray)', flexWrap: 'wrap', fontFamily: 'var(--font-pp-neue-montreal)' }}>
        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', color: 'var(--color-rich-black)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-pp-neue-montreal)' }}>Home</button>
        <span>/</span>
        <button onClick={() => navigate('categories')} style={{ background: 'none', border: 'none', color: 'var(--color-rich-black)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-pp-neue-montreal)' }}>Categories</button>
        {category && <><span>/</span><span style={{ color: 'var(--color-rich-black)' }}>{category}</span></>}
      </div>

      <h1 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '40px', fontWeight: 700, letterSpacing: '-0.022em', color: 'var(--color-rich-black)', marginBottom: 8 }}>
        {category || 'All Businesses'}
        {subcategory && <span style={{ fontSize: '24px', fontWeight: 500, color: 'var(--color-cool-gray)', marginLeft: 12, letterSpacing: '-0.01em' }}>› {subcategory}</span>}
      </h1>
      
      <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', fontSize: '14px', marginBottom: 32, letterSpacing: '-0.005em' }}>
        {loading ? 'Loading…' : `${total} business${total !== 1 ? 'es' : ''} found`}
      </p>

      {/* Search & Filter Panel */}
      <div className="filter-console">
        {/* Search Input Group */}
        <form onSubmit={handleSearch} className="search-group" style={{ borderRadius: '12px' }}>
          <div className="search-input-wrapper">
            <Search size={16} style={{ position: 'absolute', left: 14, color: 'var(--color-cool-gray)' }} />
            <input 
              className="search-input" 
              value={searchInput} 
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by business name, keyword or services…" 
            />
          </div>
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        {/* Dropdowns Row */}
        <div className="dropdowns-row">
          {/* Subcategory */}
          {subCatOptions.length > 0 && (
            <div className="dropdown-field">
              <label className="dropdown-label">
                <Tag size={11} style={{ display: 'inline', marginRight: 4 }} /> Sub-Category
              </label>
              <div className="custom-select-wrap">
                <select 
                  className="custom-select" 
                  value={subcategory} 
                  onChange={e => setSubcategory(e.target.value)}
                >
                  <option value="">All Sub-Categories</option>
                  {subCatOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* District */}
          <div className="dropdown-field">
            <label className="dropdown-label">
              <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} /> District
            </label>
            <div className="custom-select-wrap">
              <select 
                className="custom-select" 
                value={district} 
                onChange={e => { setDistrict(e.target.value); setAssembly(''); }}
              >
                <option value="">All Districts</option>
                {Object.keys(districtMap).sort().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Assembly */}
          {assemblies.length > 0 && (
            <div className="dropdown-field">
              <label className="dropdown-label">
                Assembly
              </label>
              <div className="custom-select-wrap">
                <select 
                  className="custom-select" 
                  value={assembly} 
                  onChange={e => setAssembly(e.target.value)}
                >
                  <option value="">All Assemblies</option>
                  {assemblies.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)', marginRight: 4 }}>
            Active filters:
          </span>
          {activeFilters.map(f => (
            <button 
              key={f.key} 
              onClick={() => clearFilter(f.key)} 
              className="chip active" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6, 
                background: 'var(--color-muted-sage)', 
                color: 'var(--color-deep-fern-green)', 
                borderColor: 'var(--color-muted-sage)',
                borderRadius: '12px',
                padding: '4px 10px',
                fontSize: '12px'
              }}
            >
              {f.label} <X size={12} />
            </button>
          ))}
          <button
            onClick={() => {
              setCategory('');
              setSubcategory('');
              setSearch('');
              setSearchInput('');
              setDistrict('');
              setAssembly('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-deep-fern-green)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: 'var(--font-pp-neue-montreal)',
              padding: '4px 8px',
              textDecoration: 'none'
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : businesses.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Search size={44} style={{ color: 'var(--color-subtle-ash)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700 }}>No businesses found</h3>
          <p style={{ marginTop: 8, fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)' }}>Try adjusting your filters or search term</p>
        </div>
      ) : (
        <>
          <div className="grid-3">
            {businesses.map(biz => (
              <BizCard key={biz._id} biz={biz} onClick={() => navigate('detail', { id: biz._id })} />
            ))}
          </div>

          {/* Pagination */}
          {total > 60 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 48, fontFamily: 'var(--font-pp-neue-montreal)' }}>
              <button 
                className="btn btn-outline btn-sm" 
                disabled={page <= 1} 
                onClick={() => fetch(page - 1)}
                style={{ borderRadius: '12px', paddingInline: 20 }}
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <span style={{ padding: '7px 14px', color: 'var(--color-cool-gray)', fontSize: '13px', fontFamily: 'var(--font-pp-neue-montreal)' }}>
                Page {page}
              </span>
              <button 
                className="btn btn-outline btn-sm" 
                disabled={businesses.length < 60} 
                onClick={() => fetch(page + 1)}
                style={{ borderRadius: '12px', paddingInline: 20 }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .filter-console {
          background: var(--color-subtle-ash);
          border: 1px solid var(--color-subtle-ash);
          border-radius: var(--radius-cards);
          padding: 24px;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .search-group {
          display: flex;
          align-items: center;
          border: 1px solid var(--color-subtle-ash);
          background: var(--color-canvas-white);
          border-radius: 12px !important;
          transition: border-color 0.2s ease;
          overflow: hidden;
          width: 100%;
          padding: 4px;
        }
        .search-group:focus-within {
          border-color: var(--color-deep-fern-green);
        }
        
        .search-input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        
        .search-input {
          border: none !important;
          background: transparent !important;
          padding-left: 36px !important;
          padding-right: 16px !important;
          height: 36px !important;
          width: 100%;
          font-size: 14px;
          font-family: var(--font-pp-neue-montreal);
          outline: none !important;
          color: var(--color-rich-black);
        }
        
        .search-btn {
          height: 36px !important;
          border-radius: 12px !important;
          border: none !important;
          background: var(--color-deep-fern-green) !important;
          color: var(--color-canvas-white) !important;
          padding: 0 24px !important;
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-pp-neue-montreal);
          cursor: pointer;
          transition: background-color 0.2s ease !important;
        }
        .search-btn:hover {
          background: #096238 !important;
        }
        .search-btn:active {
          opacity: 0.9 !important;
        }
        
        .dropdowns-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .dropdown-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1 1 200px;
        }
        
        .dropdown-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-cool-gray);
          font-family: var(--font-pp-neue-montreal);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .custom-select-wrap {
          position: relative;
          width: 100%;
        }
        
        .custom-select-wrap::after {
          content: '▾';
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-cool-gray);
          pointer-events: none;
          font-size: 12px;
        }
        
        .custom-select {
          width: 100%;
          height: 40px;
          padding: 0 36px 0 14px;
          background: var(--color-canvas-white);
          border: 1px solid var(--color-subtle-ash);
          border-radius: 12px;
          color: var(--color-rich-black);
          font-size: 14px;
          font-family: var(--font-pp-neue-montreal);
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          transition: border-color 0.15s ease, color 0.15s ease;
          cursor: pointer;
        }
        
        .custom-select:hover {
          border-color: var(--color-cool-gray);
        }
        
        .custom-select:focus {
          border-color: var(--color-deep-fern-green);
        }
 
        @media (max-width: 640px) {
          .filter-console {
            padding: 16px;
            gap: 16px;
          }
          .dropdowns-row {
            flex-direction: column;
            gap: 12px;
          }
          .dropdown-field {
            flex: 1 1 auto;
          }
        }
      `}</style>
    </div>
  );
}
 
function BizCard({ biz, onClick }) {
  const phone      = biz.phone || biz.whatsappNo || '';
  const hasProfile = !!(biz.image && biz.coverImage);
  return (
    <div className="card card-hover" onClick={onClick} style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)' }}>
      {/* Outer wrapper keeps overflow:visible so profile icon isn't clipped */}
      <div style={{ position: 'relative' }}>
        <div style={{ height: 110, background: 'var(--color-subtle-ash)', overflow: 'hidden' }}>
          {biz.coverImage ? (
            <img src={biz.coverImage} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : biz.image ? (
            <img src={biz.image} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={30} style={{ color: 'var(--color-cool-gray)' }} />
            </div>
          )}
        </div>
        {hasProfile && (
          <img src={biz.image} alt="" style={{
            position: 'absolute', bottom: -16, left: 12, zIndex: 1,
            width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid var(--color-canvas-white)', background: 'var(--color-canvas-white)'
          }} />
        )}
      </div>
 
      <div style={{ padding: '16px', paddingTop: hasProfile ? 22 : 16 }}>
        <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 600, fontSize: '16px', color: 'var(--color-rich-black)', marginBottom: 4, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {biz.name}
        </div>
        {biz.category && (
          <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-deep-fern-green)', fontWeight: 500, marginBottom: 6 }}>
            {biz.category}{biz.subCategory && ` · ${biz.subCategory}`}
          </div>
        )}
        {biz.avgRating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, marginBottom: 8, fontFamily: 'var(--font-pp-neue-montreal)' }}>
            <Star size={12} fill="var(--color-leafy-green)" stroke="var(--color-leafy-green)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-rich-black)' }}>{biz.avgRating.toFixed(1)}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-cool-gray)' }}>({biz.reviewCount || 0} reviews)</span>
          </div>
        )}
        {biz.address && (
          <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <MapPin size={13} style={{ flexShrink: 0 }} />
            <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {biz.assembly}{biz.district && `, ${biz.district}`}
            </span>
          </div>
        )}
        {phone && (
          <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={12} /> {phone}
          </div>
        )}
      </div>
    </div>
  );
}
