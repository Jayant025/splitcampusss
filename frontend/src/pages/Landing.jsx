import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Landing = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: "100vh",
          background: "var(--page-background)"
        }}
      >
        <div className="eyebrow" style={{ fontSize: "1.2rem" }}>
          Loading SplitCampus...
        </div>
      </div>
    );
  }

  return (
    <div className="landing-shell" style={{ animation: "modalSlideUp 0.6s ease" }}>
      <header className="landing-nav">
        <span className="brand">SplitCampus</span>
        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#use-cases">Use Cases</a>
          <button className="btn btn-ghost" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/signup")}>
            Get Started
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Built for hostel rooms, flats, trips, and events</span>
            <h1>Track group expenses without messy chats and manual math.</h1>
            <p>
              SplitCampus helps student groups create shared expense spaces, split bills
              fairly, upload receipts, settle payments, and understand spending patterns.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate("/signup")}>
                Create an account
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/login")}>
                Already have an account
              </button>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-panel">
              <strong>Equal, exact, or percentage splits</strong>
              <p>Handle dinner bills, flat rent, cab sharing, and custom event contributions.</p>
            </div>
            <div className="stat-panel">
              <strong>Balances that stay readable</strong>
              <p>See who owes whom, settlement history, and monthly charts for any group.</p>
            </div>
          </div>
        </section>

        <section className="feature-grid" id="features">
          <article className="card feature-card">
            <h3>Create student groups</h3>
            <p>Organize hostel rooms, flatmates, trip crews, and event teams in one place.</p>
          </article>
          <article className="card feature-card">
            <h3>Upload receipts</h3>
            <p>Attach bill images to expenses so everyone can verify the entry quickly.</p>
          </article>
          <article className="card feature-card">
            <h3>Track balances</h3>
            <p>Get an easy-to-explain summary of total paid, total owed, and net balances.</p>
          </article>
          <article className="card feature-card">
            <h3>Visual analytics</h3>
            <p>Use charts to understand monthly spend, category trends, and member contribution.</p>
          </article>
        </section>

        <section className="card use-case-section" id="use-cases">
          <div>
            <span className="eyebrow">Popular student use cases</span>
            <h2 style={{ fontSize: "2rem", margin: "0.5rem 0" }}>Where SplitCampus fits naturally</h2>
          </div>
          <div className="use-case-grid" style={{ marginTop: "1.5rem" }}>
            <div>
              <strong>Hostel roommates</strong>
              <p>Mess bills, snacks, Wi-Fi, and electricity contributions.</p>
            </div>
            <div>
              <strong>Flatmates</strong>
              <p>Rent, groceries, gas, and shared subscriptions.</p>
            </div>
            <div>
              <strong>College trips</strong>
              <p>Travel bookings, hotel rooms, food, and local transport.</p>
            </div>
            <div>
              <strong>Event teams</strong>
              <p>Decor, logistics, refreshment budgets, and sponsorship spending.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
export default Landing;
