import { useNav } from '../App.jsx';

export default function PrivacyPolicy() {
  const { navigate } = useNav();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-canvas-white)',
      padding: '60px 0 80px',
      fontFamily: 'var(--font-pp-neue-montreal)',
      color: 'var(--color-rich-black)'
    }}>
      <div className="container" style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <button
            onClick={() => navigate('home')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-cool-gray)',
              fontSize: '13px',
              fontFamily: 'var(--font-pp-neue-montreal)',
              padding: 0,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ← Back to Home
          </button>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            marginBottom: 8,
            lineHeight: 1.2
          }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--color-cool-gray)', fontSize: '14px' }}>
            Last updated: June 2025
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-subtle-ash)', marginBottom: 40 }} />

        {/* Intro */}
        <p style={{ lineHeight: 1.8, fontSize: '15px', color: '#374151', marginBottom: 40 }}>
          At Vanigan, your privacy matters to us. This Privacy Policy explains how we collect, use,
          disclose, and protect your personal information when you use our Platform. By using Vanigan,
          you agree to the practices described in this policy.
        </p>

        {/* Content */}
        <div style={{ lineHeight: 1.8, fontSize: '15px', color: '#374151' }}>

          <Section title="1. Information We Collect">
            <p><strong>a) Information you provide directly:</strong></p>
            <ul>
              <li>Name, phone number, and email address when you register.</li>
              <li>Business details (name, category, description, address, images) when you submit a listing.</li>
              <li>Profile photo and other details when you set up your member profile.</li>
              <li>Reviews and ratings you submit on the Platform.</li>
            </ul>
            <p style={{ marginTop: 12 }}><strong>b) Information collected automatically:</strong></p>
            <ul>
              <li>Device information (browser type, operating system).</li>
              <li>Usage data (pages visited, time spent, clicks).</li>
              <li>IP address and approximate location.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul>
              <li>To create and manage your account and business listings.</li>
              <li>To generate and display your Vanigan member card.</li>
              <li>To process transactions and manage membership plans.</li>
              <li>To send service-related notifications and updates.</li>
              <li>To improve the Platform's features and user experience.</li>
              <li>To detect and prevent fraud or abuse.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
          </Section>

          <Section title="3. WhatsApp & Communication">
            <p>
              Vanigan may communicate with you through WhatsApp Business messaging for verification,
              member card delivery, and service notifications. By registering, you consent to receiving
              such messages. You may opt out at any time by contacting us.
            </p>
          </Section>

          <Section title="4. Sharing of Information">
            <p>We do not sell your personal information. We may share it with:</p>
            <ul>
              <li>
                <strong>Service Providers:</strong> Third-party vendors who help us operate the Platform
                (e.g., cloud hosting, image storage via Cloudinary, SMS/WhatsApp services).
              </li>
              <li>
                <strong>Business Directory:</strong> Business listing details you submit are displayed
                publicly on the Platform as part of the directory service.
              </li>
              <li>
                <strong>Legal Compliance:</strong> When required by law, court order, or government authority.
              </li>
            </ul>
          </Section>

          <Section title="5. Data Storage & Security">
            <p>
              Your data is stored securely on cloud servers. We use industry-standard measures including
              encrypted connections (HTTPS), access controls, and regular security reviews to protect your
              information. However, no system is completely secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use cookies and similar technologies to maintain your session and improve your experience.
              You can control cookie behaviour through your browser settings. Disabling cookies may affect
              some features of the Platform.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:support@vanigan.in" style={{ color: 'var(--color-deep-fern-green)', textDecoration: 'none' }}>
                support@vanigan.in
              </a>.
            </p>
          </Section>

          <Section title="8. Third-Party Links">
            <p>
              The Platform may contain links to third-party websites (e.g., Google Play Store). We are not
              responsible for the privacy practices of those sites and encourage you to review their policies
              separately.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Vanigan is not intended for use by anyone under the age of 18. We do not knowingly collect
              personal data from minors. If we become aware that a minor has provided personal information,
              we will delete it promptly.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes by
              updating the date at the top of this page. Continued use of the Platform after changes are
              posted constitutes your acceptance of the revised policy.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have any questions or concerns about this Privacy Policy, please reach out to us:
            </p>
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '16px 20px',
              marginTop: 12,
              lineHeight: 2
            }}>
              <strong>Vanigan</strong><br />
              5/79, Perumal Koil Street,<br />
              Sadanandapuram, Thandalam,<br />
              Tamil Nadu 600128<br />
              <a href="mailto:support@vanigan.in" style={{ color: 'var(--color-deep-fern-green)', textDecoration: 'none' }}>
                support@vanigan.in
              </a>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: '17px',
        fontWeight: 700,
        marginBottom: 12,
        color: 'var(--color-rich-black)',
        letterSpacing: '-0.2px'
      }}>
        {title}
      </h2>
      <div style={{ color: '#374151' }}>
        {children}
      </div>
    </div>
  );
}
