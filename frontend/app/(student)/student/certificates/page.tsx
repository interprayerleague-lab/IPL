'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  file_path: string | null;
  status: string;
  programme_title: string;
}

export default function CertificatesPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/certificates`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId: string, certificateNumber: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/certificates/${certificateId}/download`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificate-${certificateNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  if (loading) {
    return (
      <div className="wrap">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <h2>My Certificates</h2>

      {certificates.length === 0 ? (
        <div className="card">
          <p>You have not received any certificates yet.</p>
          <p style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '14px' }}>
            Certificates will be issued upon successful completion of programme requirements.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {certificates.map((certificate) => (
            <div key={certificate.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <b style={{ fontSize: '16px' }}>{certificate.programme_title}</b>
                  <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '14px' }}>
                    Certificate #{certificate.certificate_number}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    Issued: {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  {certificate.status === 'issued' && (
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        backgroundColor: 'var(--success)',
                        color: 'white',
                      }}
                    >
                      ✓ Issued
                    </span>
                  )}
                  {certificate.status === 'revoked' && (
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        backgroundColor: 'var(--warning)',
                        color: 'white',
                      }}
                    >
                      Revoked
                    </span>
                  )}
                </div>
              </div>

              {certificate.status === 'issued' && certificate.file_path && (
                <button
                  className="btn-primary"
                  onClick={() => downloadCertificate(certificate.id, certificate.certificate_number)}
                  style={{ width: 'auto' }}
                >
                  Download Certificate
                </button>
              )}

              {certificate.status === 'revoked' && (
                <p style={{ marginTop: '8px', color: 'var(--warning)', fontSize: '14px' }}>
                  This certificate has been revoked and is no longer valid.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
