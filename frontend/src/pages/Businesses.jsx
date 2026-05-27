import ListingPage from '../components/ListingPage.jsx';

const CATEGORIES = [
  'Emart','Hospitals','Transport','Electricals','Education','Sports',
  'Real Estate','Spa and Facial','Digital Products','Anything on Hire',
  'Automobile','B2B','Banquets','Bills & Recharge','Books',
  'Cabs & Car rentals','Caterers','Civil Contractors','Courier',
  'Daily Needs','Art & Artists','Doctor','Jobs','Jewellery','Labs',
  'Language Classes','Bank','Medical','Modular Kitchen','Home Service',
  'Packers and Movers','Party','Personal Care','Pest Control',
  'Pet and Pet Care','Play School','Sports Goods','Training Institute',
  'Transporters','Travel','Wedding','Auditor','Advocate','Cinema',
  'Printing Services','Textiles','Photo Studio','Online service',
  'Manufacturer','Export Import','Retailer and Stationery','Engineering',
  'Distributor','Organic Products','Hotel and Restaurant',
  'Online Ticket Booking','Advertising','Food Stall','IT And Software',
  'All Shops','Repairs','Home Appliance','Demand Service',
  'Spices','Butcher shop','TOURISM','Construction Materials','Insurance',
  'Customs House','Shopping','Hostel and Mansion','AGRICULTURE','RELIGIOUS',
];

export default function Businesses() {
  return (
    <ListingPage
      title="Businesses"
      resource="businesses"
      extraFields={[
        /* ── Identity ── */
        { name: 'category', label: 'Category', type: 'select', options: CATEGORIES },
        { name: 'subCategory',      label: 'Sub-Category',               type: 'subcat' },

        /* ── Location ── */
        { name: 'address',          label: 'Address',                    type: 'textarea' },
        { name: 'landmark',         label: 'Landmark / How to Reach',    placeholder: 'Near bus stand, opp. post office' },
        { name: 'serviceLocations', label: 'Service Locations',          placeholder: 'Areas you serve (optional)' },
        { name: 'city',             label: 'City',                       placeholder: 'e.g. Chennai' },
        { name: 'pincode',          label: 'Pincode',                    placeholder: '6-digit PIN' },
        { name: 'lat',              label: 'Location (GPS)',             type: 'latlng' },
        { name: 'lng',              label: '_lng',                       type: '_latlng_pair' },

        /* ── Contact ── */
        { name: 'phone',            label: 'Primary Phone',              placeholder: '10-digit number' },
        { name: 'whatsappNo',       label: 'WhatsApp Number',            placeholder: 'If different from primary' },
        { name: 'landline',         label: 'Landline',                   placeholder: 'STD code + number' },
        { name: 'phone2',           label: 'Alternate Phone',            placeholder: 'Optional' },
        { name: 'email',            label: 'Email',                      type: 'email' },
        { name: 'website',          label: 'Website',                    type: 'url', placeholder: 'https://...' },

        /* ── Social / Media ── */
        { name: 'social', label: 'Social Media Links', type: 'social' },

        /* ── Hours ── */
        { name: 'openDays',         label: 'Opening Days',               type: 'dayspicker' },
        { name: 'openTime',         label: 'Opening Time',               type: 'time' },
        { name: 'closeTime',        label: 'Closing Time',               type: 'time' },

        /* ── Images ── */
        { name: 'coverImage',       label: 'Cover / Banner Image',       type: 'coverimage' },
        { name: 'galleryImages',    label: 'Gallery Images',             type: 'gallery' },

        /* ── Services ── */
        { name: 'services',         label: 'Services / Products (up to 6)', type: 'services' },

        /* ── FAQ ── */
        { name: 'infoQuestion',     label: 'FAQ Question',               placeholder: 'Common question about your business' },
        { name: 'infoAnswer',       label: 'FAQ Answer',                 type: 'textarea' },

        /* ── Meta ── */
        { name: 'ownerPhone',       label: 'Owner Phone (internal)',      placeholder: 'For WhatsApp auto-register flow' },
      ]}
      defaultDescription="Local businesses shown when WhatsApp users pick *Business List*."
    />
  );
}
