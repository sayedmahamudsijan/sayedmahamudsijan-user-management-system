import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/forgot-password', { email });
      setMessage('Password reset link sent to your email!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send reset link');
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
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              SEND RESET LINK
            </Button>
            {message && <p className={message.includes('sent') ? 'text-success' : 'text-danger'}>{message}</p>}
          </Form>
          <div className="links">
            <a href="/login">Back to Sign In</a>
          </div>
        </Col>
        <Col md={6} className="right-section"></Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;