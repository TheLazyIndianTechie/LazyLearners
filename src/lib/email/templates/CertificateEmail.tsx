/**
 * Certificate Delivery Email Template
 */
import React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseLayout } from './components/BaseLayout';
import { Button } from './components/Button';
import { CertificateEmailData } from '../types';
import { emailTheme } from './theme';

export function CertificateEmail({ data }: { data: CertificateEmailData }) {
  const { userName, courseName, certificateUrl, completionDate, certificateId, instructorName } = data;
  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <BaseLayout
      previewText={`Your certificate for ${courseName} is ready!`}
      showHeader={true}
      showFooter={true}
    >
      <Text style={{ margin: '0 0 20px', fontSize: '28px', fontWeight: 'bold', color: emailTheme.colors.text.primary }}>
        Congratulations! 🎓
      </Text>
      <Text style={{ margin: '0 0 20px', fontSize: '18px', color: emailTheme.colors.text.secondary }}>
        Hi {userName},
      </Text>
      <Text style={{ margin: '0 0 20px', fontSize: '16px', color: emailTheme.colors.text.secondary, lineHeight: '1.6' }}>
        You've successfully completed <strong>{courseName}</strong>! Your certificate of completion is now ready to download and share.
      </Text>
      
      <Section style={{ backgroundColor: emailTheme.colors.success.light, padding: '24px', borderRadius: '8px', margin: '30px 0', textAlign: 'center', border: `2px solid ${emailTheme.colors.success.main}` }}>
        <Text style={{ margin: '0 0 12px', fontSize: '48px' }}>🏆</Text>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 'bold', color: emailTheme.colors.text.primary }}>
          Certificate Earned!
        </Text>
        <Text style={{ margin: '0', fontSize: '14px', color: emailTheme.colors.success.dark }}>
          Completed on {formattedDate}
        </Text>
      </Section>

      <Section style={{ backgroundColor: emailTheme.colors.background.tertiary, padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
        <table role="presentation" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tr>
            <td style={{ padding: '8px 0', fontSize: '14px', color: emailTheme.colors.text.tertiary }}>Course:</td>
            <td style={{ padding: '8px 0', fontSize: '14px', color: emailTheme.colors.text.primary, textAlign: 'right', fontWeight: '600' }}>{courseName}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', fontSize: '14px', color: emailTheme.colors.text.tertiary }}>Instructor:</td>
            <td style={{ padding: '8px 0', fontSize: '14px', color: emailTheme.colors.text.primary, textAlign: 'right' }}>{instructorName}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', fontSize: '14px', color: emailTheme.colors.text.tertiary }}>Certificate ID:</td>
            <td style={{ padding: '8px 0', fontSize: '14px', color: emailTheme.colors.text.primary, textAlign: 'right', fontFamily: 'monospace' }}>{certificateId}</td>
          </tr>
        </table>
      </Section>

      <Section style={{ margin: '40px 0', textAlign: 'center' }}>
        <Button href={certificateUrl} variant="primary" size="lg">
          Download Certificate →
        </Button>
      </Section>

      <Text style={{ margin: '20px 0 8px', fontSize: '16px', color: emailTheme.colors.text.secondary }}>
        Congratulations on this achievement!
      </Text>
      <Text style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: emailTheme.colors.text.primary }}>
        The LazyGameDevs Team
      </Text>
    </BaseLayout>
  );
}

export default CertificateEmail;
