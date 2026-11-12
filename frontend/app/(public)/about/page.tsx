export default function AboutPage() {
  return (
    <div className="wrap">
      <h1>Vision and leadership</h1>
      <p>
        We exist to raise mature disciples who know the Word, walk in the Spirit
        and serve the church.
      </p>

      <div className="grid">
        <div className="card">
          <div className="ico">👤</div>
          <h3>Lead Pastor</h3>
          <p>Oversees the vision and doctrine of the school.</p>
        </div>
        <div className="card">
          <div className="ico">👤</div>
          <h3>Discipleship Director</h3>
          <p>Leads curriculum and facilitators.</p>
        </div>
        <div className="card">
          <div className="ico">👤</div>
          <h3>Lead Facilitator</h3>
          <p>Answers questions in lesson discussions.</p>
        </div>
      </div>
    </div>
  );
}
