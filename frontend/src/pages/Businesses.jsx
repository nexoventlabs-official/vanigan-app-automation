import ListingPage from '../components/ListingPage.jsx';

export default function Businesses() {
  return (
    <ListingPage
      title="Businesses"
      resource="businesses"
      extraFields={[
        { name: 'category', label: 'Category', placeholder: 'e.g. Restaurant, Retail' },
        { name: 'phone', label: 'Contact phone' },
        { name: 'address', label: 'Address' },
      ]}
      defaultDescription="Local businesses shown when WhatsApp users pick *Business List*."
    />
  );
}
