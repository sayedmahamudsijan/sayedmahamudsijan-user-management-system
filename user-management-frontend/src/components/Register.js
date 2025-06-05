import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await api.post('/register', { email, password, name });
      setMessage(res.data.message || 'Yay! You signed up! Let’s go to the user list.');
      setTimeout(() => navigate('/users'), 1000);
    } catch (err) {
      console.error('Registration error details:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message,
        fullResponse: err.response?.data
      });
      if (err.response?.status === 400 && err.response?.data?.message?.toLowerCase().includes('email already exists')) {
        setMessage('Oops! This email is already taken. Try a different email.');
      } else if (err.response?.status === 400) {
        setMessage('Please fill in all the boxes (name, email, and password).');
      } else if (err.response?.status === 500) {
        setMessage('Uh-oh! The server isn’t working right now. Try again in a little bit.');
      } else if (!err.response) {
        setMessage('Oops! Can’t reach the server. Check your internet and try again.');
      } else {
        setMessage('Sorry, there was a problem signing you up. Please try again.');
      }
    }
  };

  return (
    <Container fluid className="auth-container">
      <Row className="h-100">
        <Col md={6} className="left-section">
          <div className="logo">THE APP</div>
          <h2>Start your journey<br /><strong>Sign UP to The App</strong></h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formName" className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
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
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              SIGN UP
            </Button>
            {message && (
              <p className={message.includes('Yay') ? 'text-success mt-3' : 'text-danger mt-3'}>
                {message}
              </p>
            )}
          </Form>
          <div className="links">
            <a href="/login">Already have an account? Sign in</a>
          </div>
        </Col>
        <Col md={6} className="right-section"></Col>
      </Row>
    </Container>
  );
};

export default Register;