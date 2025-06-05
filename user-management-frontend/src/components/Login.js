import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setMessage('Please provide a password.');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setMessage(res.data.message || 'Yay! You’re signed in! Let’s go to the user list.');
      setTimeout(() => navigate('/users'), 2000);
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      if (!err.response) {
        setMessage('Oops! Can’t reach the server. Check your internet and try again.');
      } else if (err.response?.status === 400 && err.response?.data?.message.includes('Invalid credentials')) {
        setMessage('Oops! Invalid email or password. Please try again.');
      } else if (err.response?.status === 403) {
        setMessage('Oh no! Your account is locked. Ask for help to unlock it.');
      } else if (err.response?.status === 400) {
        setMessage('Please fill in both email and password boxes.');
      } else if (err.response?.status === 500) {
        setMessage('Uh-oh! The server isn’t working right now. Try again in a little bit.');
      } else {
        setMessage('Sorry, there was a problem signing you in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="auth-container">
      <Row className="h-100">
        <Col md={6} className="left-section">
          <div className="logo">THE APP</div>
          <h2>Welcome back<br /><strong>Sign IN to The App</strong></h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                aria-label="Email address"
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                aria-label="Password"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Signing In...' : 'SIGN IN'}
            </Button>
            {message && (
              <p className={message.includes('Yay') || message.includes('signed in') ? 'text-success mt-3' : 'text-danger mt-3'}>
                {message}
              </p>
            )}
          </Form>
          <div className="links">
            <a href="/register" aria-label="Sign up for a new account">Don't have an account? Sign up</a>
            <br />
            <a href="/forgot-password" aria-label="Reset your password">Forgot password?</a>
          </div>
        </Col>
        <Col md={6} className="right-section"></Col>
      </Row>
    </Container>
  );
};

export default Login;
