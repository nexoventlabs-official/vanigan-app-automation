import { useNav } from '../App.jsx';

export default function TermsAndConditions() {
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
            Terms &amp; Conditions
          </h1>
          <p style={{ color: 'var(--color-cool-gray)', fontSize: '14px' }}>
            Last updated: June 2025
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-subtle-ash)', marginBottom: 40 }} />

        {/* Content */}
        <div style={{ lineHeight: 1.8, fontSize: '15px', color: '#374151' }}>

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Vanigan ("the Platform"), you agree to be bound by these Terms &amp;
              Conditions. If you do not agree with any part of these terms, please do not use our services.
              These terms apply to all visitors, members, businesses, and users of the Platform.
            </p>
          </Section>

          <Section title="2. About Vanigan">
            <p>
              Vanigan is a business directory and community platform that connects local businesses with
              consumers across Tamil Nadu. We provide listing services, member cards, and promotional tools
              to help businesses grow.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <ul>
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorised use of your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </Section>

          <Section title="4. Business Listings">
            <ul>
              <li>Business listings must be accurate, truthful, and not misleading.</li>
              <li>You must own or have authority to list the business you submit.</li>
              <li>We reserve the right to remove or modify listings that violate our policies.</li>
              <li>Duplicate, spam, or fraudulent listings are strictly prohibited.</li>
              <li>Images uploaded must be owned by you or used with permission.</li>
            </ul>
          </Section>

          <Section title="5. Member Cards & Plans">
            <p>
              Vanigan offers membership plans that grant access to digital member cards and premium
              directory features. All plan fees are clearly stated at the time of purchase. Fees are
              non-refundable unless otherwise specified. We reserve the right to change plan pricing
              with advance notice.
            </p>
          </Section>

          <Section title="6. Prohibited Activities">
            <p>Users must not:</p>
            <ul>
              <li>Post false, misleading, or defamatory content.</li>
              <li>Use the Platform for any unlawful purpose.</li>
              <li>Scrape, harvest, or collect data from the Platform without written permission.</li>
              <li>Interfere with or disrupt the Platform's infrastructure.</li>
              <li>Impersonate any person or organisation.</li>
              <li>Transmit viruses, malware, or any harmful code.</li>
            </ul>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              All content on the Platform, including logos, design, text, and graphics, is owned by or
              licensed to Vanigan. You may not reproduce, distribute, or create derivative works without
              explicit written consent. User-submitted content remains the property of the submitter, but
              by submitting you grant Vanigan a non-exclusive, royalty-free licence to display it.
            </p>
          </Section>

          <Section title="8. Reviews & Ratings">
            <p>
              Reviews submitted on the Platform must be genuine and based on real experiences. Fake,
              incentivised, or malicious reviews are prohibited. We reserve the right to remove any
              review that violates these guidelines.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              Vanigan is provided on an "as is" basis. We make no warranties regarding the accuracy or
              completeness of listings or other content. To the fullest extent permitted by law, Vanigan
              shall not be liable for any indirect, incidental, or consequential damages arising from
              your use of the Platform.
            </p>
          </Section>

          <Section title="10. Modifications to Terms">
            <p>
              We may update these Terms &amp; Conditions from time to time. Continued use of the Platform
              after changes are posted constitutes your acceptance of the revised terms. We will indicate
              the date of the most recent update at the top of this page.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms &amp; Conditions are governed by the laws of India. Any disputes shall be subject
              to the exclusive jurisdiction of courts in Tamil Nadu, India.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have any questions about these Terms &amp; Conditions, please contact us at:
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
      <style>{`
        .tnc-content ul {
          padding-left: 20px;
          margin: 8px 0;
        }
        .tnc-content ul li {
          margin-bottom: 6px;
        }
      `}</style>
    </div>
  );
}
