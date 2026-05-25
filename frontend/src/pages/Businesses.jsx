import ListingPage from '../components/ListingPage.jsx';

export default function Businesses() {
  return (
    <ListingPage
      title="Businesses"
      resource="businesses"
      extraFields={[
        /* ── Identity ── */
        { name: 'category',         label: 'Category',                   placeholder: 'e.g. Restaurant, Grocery, Textile' },
        { name: 'subCategory',      label: 'Sub-Category',               placeholder: 'e.g. Fast Food, Wholesale' },

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
        { name: 'fbLink',           label: 'Facebook Page Link',         type: 'url', placeholder: 'https://facebook.com/...' },
        { name: 'twitterLink',      label: 'Twitter / X Link',           type: 'url', placeholder: 'https://twitter.com/...' },
        { name: 'googleMap',        label: 'Google Maps Link',           type: 'url', placeholder: 'https://maps.google.com/...' },
        { name: 'videoUrl',         label: 'Video URL (YouTube etc.)',   type: 'url', placeholder: 'https://youtube.com/...' },

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
        { name: 'listingCode',      label: 'Listing Code',               placeholder: 'Legacy code (optional)' },
        { name: 'ownerPhone',       label: 'Owner Phone (internal)',      placeholder: 'For WhatsApp auto-register flow' },
      ]}
      defaultDescription="Local businesses shown when WhatsApp users pick *Business List*."
    />
  );
}
