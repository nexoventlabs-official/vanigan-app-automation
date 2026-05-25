import ListingPage from '../components/ListingPage.jsx';

export default function Members() {
  return (
    <ListingPage
      title="Members"
      resource="members"
      extraFields={[
        { name: 'designation', label: 'Designation', placeholder: 'e.g. Member, Volunteer' },
        { name: 'phone', label: 'Contact phone' },
        { name: 'email', label: 'Contact email' },
      ]}
      defaultDescription="Vanigan members shown when WhatsApp users pick *Members List*."
    />
  );
}
