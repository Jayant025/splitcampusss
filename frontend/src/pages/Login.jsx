import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      await login(trimmedEmail, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-body-container" style={{ display: "grid", placeItems: "center", minHeight: "100vh", animation: "modalSlideUp 0.4s ease" }}>
      <main className="auth-shell">
        <section className="auth-copy">
          <Link className="brand" to="/">
            SplitCampus
          </Link>
          <h1>Welcome back</h1>
          <p>
            Log in to view your groups, expenses, balances, and settlements. Because who actually has time to maintain a shared Excel sheet? 📊
          </p>
        </section>

        <section className="auth-card card stack-md">
          {error && <div className="badge badge-danger btn-block" style={{ borderRadius: "10px", padding: "0.8rem", width: "100%", justifyContent: "center" }}>{error}</div>}
          <form onSubmit={handleSubmit} className="stack-md">
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username email"
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>
          <p className="auth-footer">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </section>
      </main>
    </div>
  );
};
export default Login;
