import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <div className="hero">
        <h1>Deepen your walk with Christ</h1>
        <p>
          A 12-week intensive of biblical teaching, mentorship and community,
          taught online at your pace.
        </p>
        <Link href="/apply" className="btn w">
          Enroll now
        </Link>
      </div>

      <div className="wrap">
        <h2>A message from our Discipleship Director</h2>
        <p>
          Every believer is called to grow, not just to attend. This school
          exists to ground you in the Word, fill you with the Spirit and equip
          you to live a disciplined Christian life.
        </p>
        <p>
          Whether you joined last year or last month, you will be walked through
          each step by a facilitator who knows your name.
        </p>

        <h2 style={{ marginTop: '26px' }}>What you will gain</h2>
        <div className="grid">
          <div className="card">
            <div className="ico">📖</div>
            <h3>Biblical foundations</h3>
            <p>Core doctrine taught from Scripture.</p>
          </div>
          <div className="card">
            <div className="ico">🤝</div>
            <h3>Mentorship</h3>
            <p>A facilitator answers your questions.</p>
          </div>
          <div className="card">
            <div className="ico">💻</div>
            <h3>Flexible online learning</h3>
            <p>Watch on your phone, any time.</p>
          </div>
          <div className="card">
            <div className="ico">🎓</div>
            <h3>Certificate</h3>
            <p>Awarded when you complete all modules.</p>
          </div>
        </div>

        <h2 style={{ marginTop: '26px' }}>Alumni testimonies</h2>
        <div className="grid">
          <div className="card">
            <p className="quote">
              "I finally understood why I fast and how to pray with purpose."
            </p>
            <div className="who">Adaeze, Lagos branch</div>
          </div>
          <div className="card">
            <p className="quote">
              "The Holy Spirit module changed how I read my Bible."
            </p>
            <div className="who">Tunde, Ibadan branch</div>
          </div>
          <div className="card">
            <p className="quote">
              "Flexible enough for my work schedule, deep enough to matter."
            </p>
            <div className="who">Grace, Abuja branch</div>
          </div>
        </div>
      </div>
    </>
  );
}
