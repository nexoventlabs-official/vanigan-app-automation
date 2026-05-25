import ListingPage from '../components/ListingPage.jsx';

export default function Organizers() {
  return (
    <ListingPage
      title="Organizers"
      resource="organizers"
      extraFields={[
        { name: 'role', label: 'Role', placeholder: 'e.g. Cluster Lead' },
        { name: 'phone', label: 'Contact phone' },
        { name: 'email', label: 'Contact email' },
      ]}
      defaultDescription="Community organizers shown when WhatsApp users pick *Organizer List*."
    />
  );
}
