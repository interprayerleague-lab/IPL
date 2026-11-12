'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Certificate {
  id: string;
  student_name: string;
  programme_title: string;
  certificate_number: string;
  issued_at: string;
  status: string;
}

interface EligibleStudent {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  programme_title: string;
  is_eligible: boolean;
  total_lessons: number;
  completed_lessons: number;
  total_quizzes: number;
  passed_quizzes: number;
}

export default function CertificatesPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadCertificates(), loadEligibleStudents()]);
    setLoading(false);
  };

  const loadCertificates = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/certificates`, {
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
    }
  };

  const loadEligibleStudents = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/certificates/eligible`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEligibleStudents(data);
      }
    } catch (error) {
      console.error('Error loading eligible students:', error);
    }
  };

  const handleIssueCertificate = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`Issue certificate to ${studentName}?`)) return;

    setIssuing(enrollmentId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/certificates/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ enrollment_id: enrollmentId }),
      });

      if (response.ok) {
        alert('Certificate issued successfully');
        await loadData();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to issue certificate');
      }
    } catch (error) {
      alert('Error issuing certificate');
      console.error(error);
    } finally {
      setIssuing(null);
    }
  };

  const handleRevokeCertificate = async (certificateId: string, studentName: string) => {
    if (!confirm(`Revoke certificate for ${studentName}? This action will be recorded in the audit log.`)) return;

    setRevoking(certificateId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/certificates/${certificateId}/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        alert('Certificate revoked successfully');
        await loadData();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to revoke certificate');
      }
    } catch (error) {
      alert('Error revoking certificate');
      console.error(error);
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  return (
    <>
      <h2>Certificates</h2>

      {/* Eligible Students Section */}
      <div className="card">
        <h3>Eligible for Certification</h3>
        {eligibleStudents.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No eligible students at this time.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
            {eligibleStudents.map((student) => (
              <div
                key={student.enrollment_id}
                style={{
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: student.is_eligible ? 'var(--bg-light)' : 'var(--bg)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <b>{student.student_name}</b>
                    <p style={{ margin: '4px 0', fontSize: '14px' }}>{student.programme_title}</p>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                      <span>
                        Lessons: {student.completed_lessons}/{student.total_lessons} •{' '}
                      </span>
                      <span>
                        Quizzes: {student.passed_quizzes}/{student.total_quizzes}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {student.is_eligible ? (
                      <button
                        className="btn-primary"
                        onClick={() => handleIssueCertificate(student.enrollment_id, student.student_name)}
                        disabled={issuing === student.enrollment_id}
                        style={{ fontSize: '14px', padding: '6px 12px' }}
                      >
                        {issuing === student.enrollment_id ? 'Issuing...' : 'Issue Certificate'}
                      </button>
                    ) : (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: 'var(--warning)',
                          color: 'white',
                        }}
                      >
                        Not Eligible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issued Certificates Section */}
      <h3 style={{ marginTop: '24px' }}>Issued Certificates</h3>
      {certificates.length === 0 ? (
        <div className="card">
          <p>No certificates have been issued yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {certificates.map((certificate) => (
            <div key={certificate.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <b>{certificate.student_name}</b>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>{certificate.programme_title}</p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>
                    Certificate #{certificate.certificate_number}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>
                    Issued: {new Date(certificate.issued_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {certificate.status === 'issued' ? (
                    <>
                      <span className="tag ok">Issued</span>
                      <button
                        className="btn"
                        onClick={() => handleRevokeCertificate(certificate.id, certificate.student_name)}
                        disabled={revoking === certificate.id}
                        style={{
                          fontSize: '14px',
                          padding: '4px 12px',
                          backgroundColor: 'var(--warning)',
                        }}
                      >
                        {revoking === certificate.id ? 'Revoking...' : 'Revoke'}
                      </button>
                    </>
                  ) : (
                    <span className="tag warn">Revoked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
