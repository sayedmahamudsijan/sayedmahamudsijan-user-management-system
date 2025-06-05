import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    try {
      const res = await api.post('/register', { name, email, password });
      setMessage(res.data.message || 'Registration successful! Please login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response) {
        // Server responded with a status other than 2xx
        setMessage(err.response.data.message || 'Registration failed. Please try again.');
      } else if (err.request) {
        // No response received (network error, CORS, etc.)
        setMessage('Cannot reach the server. Check your internet or server status.');
      } else {
        // Other errors (e.g., request setup)
        setMessage('An error occurred: ' + err.message);
      }
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header text-center">
              <h3>Sign UP to The App</h3>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-danger'}`} role="alert">
                  {message}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="email">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Sign UP to The App
                </button>
              </form>
              <div className="text-center mt-3">
                <p>
                  Already have an account? <a href="/login">Sign in</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
