// components/LoginPage.js
import React, { useState } from 'react';
import '../styles/LoginPage.css';
import { login } from '../utils/api';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    const result = await login(username, password);
    console.log(result);
    
    if (result.success) {
      // Call the onLogin callback with user data and token
      onLogin(result.data, result.data.access_token);
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img 
            src="https://gurukulsure60.com/sure60fees/images/logo.png" 
            alt="Sure60" 
            className="login-logo"
          />
          <h2>Welcome Back</h2>
          <p>Please login to your account</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="/forgot-password">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;