import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';

export default function OnboardingSigninPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('layla@cmpprime.ae');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your registered work email and password.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Navigate to wizard apply flow
      navigate('/apply');
    }, 400);
  };

  return (
    <OnboardingLayout
      title="Welcome back"
      subtitle="Carry on with your registration, or check where it has got to."
      points={[
        "Pick up where you left off",
        "See which documents are still needed",
        "Replace anything we send back",
        "Go live as soon as you are approved"
      ]}
    >
      <div className="reg-card">
        <p className="eyebrow">Cash My Property</p>
        <h2>Sign in</h2>
        <p className="sub">Use the email you registered with.</p>

        {error && (
          <div className="note" style={{ background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)', border: '1px solid var(--cmp-danger)', color: 'var(--cmp-danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="si-email">Email</label>
            <input
              id="si-email"
              autoComplete="username"
              placeholder="name@company.ae"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="si-password">Password</label>
            <input
              id="si-password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="meta">
          No account yet? <Link to="/signup">Register your company or projects</Link>
        </p>
      </div>
    </OnboardingLayout>
  );
}
