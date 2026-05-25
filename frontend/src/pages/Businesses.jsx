import ListingPage from '../components/ListingPage.jsx';

export default function Businesses() {
  return (
    <ListingPage
      title="Businesses"
      resource="businesses"
      extraFields={[
        { name: 'category',    label: 'Category',              placeholder: 'e.g. Restaurant, Grocery, Textile' },
        { name: 'address',     label: 'Address',               type: 'textarea' },
        { name: 'landmark',    label: 'Landmark / How to Reach', placeholder: 'Near bus stand, opp. post office' },
        { name: 'phone',       label: 'Primary Phone',         placeholder: '10-digit number' },
        { name: 'phone2',      label: 'Alternate Phone',       placeholder: 'Optional' },
        { name: 'email',       label: 'Email',                 type: 'email' },
        { name: 'website',     label: 'Website / Social Link', type: 'url', placeholder: 'https://...' },
        { name: 'openDays',    label: 'Opening Days',          type: 'dayspicker' },
        { name: 'openTime',    label: 'Opening Time',          type: 'time' },
        { name: 'closeTime',   label: 'Closing Time',          type: 'time' },
        { name: 'lat',         label: 'Location (GPS)',        type: 'latlng' },
        { name: 'lng',         label: '_lng',                  type: '_latlng_pair' },
        { name: 'listingCode', label: 'Listing Code',          placeholder: 'Legacy code (optional)' },
      ]}
      defaultDescription="Local businesses shown when WhatsApp users pick *Business List*."
    />
  );
}
