import Link from 'next/link';

export default function ProgrammePage() {
  return (
    <div className="wrap">
      <h1>Curriculum</h1>
      <p>
        <span className="tag">12-week intensive</span> Three modules, each ending
        with a quiz you must pass to continue.
      </p>

      <details open>
        <summary>Module 1: Foundations of Faith</summary>
        <p>Repentance · Salvation · Water baptism</p>
      </details>

      <details>
        <summary>Module 2: The Holy Spirit</summary>
        <p>Baptism of the Spirit · Gifts · Fruit</p>
      </details>

      <details>
        <summary>Module 3: Christian Disciplines</summary>
        <p>Fasting · Prayer · Word study</p>
      </details>

      <div className="card" style={{ marginTop: '16px' }}>
        <h3>Prerequisites</h3>
        <p>You must have completed the foundational believers' class.</p>
        <Link href="/apply" className="btn">
          Enroll now
        </Link>
      </div>
    </div>
  );
}
