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

              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
