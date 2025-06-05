import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/forgot-password', { email });
      setMessage(res.data.message || 'Password reset link sent to your email!');
      setTimeout(() => navigate('/login'), 2000); // Redirect to login after 2 seconds
    } catch (err) {
      console.error('Forgot password error:', err.response?.data || err.message);
      if (err.response?.status === 404) {
        setMessage('Email not found. Please check your email address.');
      } else if (err.response?.status === 400) {
        setMessage('Please provide a valid email address.');
      } else if (err.response?.status === 500) {
        setMessage('Uh-oh! The server isn’t working right now. Try again later.');
      } else {
        setMessage('Failed to send reset link. Please try again.');
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
          <h2>Reset your password<br /><strong>Forgot Password</strong></h2>
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
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Sending...' : 'SEND RESET LINK'}
            </Button>
            {message && (
              <p className={message.includes('sent') ? 'text-success mt-3' : 'text-danger mt-3'}>
                {message}
              </p>
            )}
          </Form>
          <div className="links">
            <a href="/login" aria-label="Back to Sign In">Back to Sign In</a>
          </div>
        </Col>
        <Col md={6} className="right-section"></Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;
