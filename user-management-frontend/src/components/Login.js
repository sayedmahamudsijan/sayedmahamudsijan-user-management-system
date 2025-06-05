import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setMessage('Yay! You’re signed in! Let’s go to the user list.');
      setTimeout(() => navigate('/users'), 1000);
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      if (err.response?.status === 401 && err.response?.data?.message.includes('Email not found')) {
        setMessage('Oops! We don’t know this email. Try signing up first!');
      } else if (err.response?.status === 401 && err.response?.data?.message.includes('Incorrect password')) {
        setMessage('Oops! That password is wrong. Try a different one.');
      } else if (err.response?.status === 403) {
        setMessage('Oh no! Your account is locked. Ask for help to unlock it.');
      } else if (err.response?.status === 400) {
        setMessage('Please fill in both email and password boxes.');
      } else if (err.response?.status === 500) {
        setMessage('Uh-oh! The server isn’t working right now. Try again in a little bit.');
      } else {
        setMessage('Sorry, there was a problem signing you in. Please try again.');
      }
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
              SIGN IN
            </Button>
            {message && (
              <p className={message.includes('Yay') ? 'text-success mt-3' : 'text-danger mt-3'}>
                {message}
              </p>
            )}
          </Form>
          <div className="links">
            <a href="/register">Don't have an account? Sign up</a>
            <br />
            <a href="/forgot-password">Forgot password?</a>
          </div>
        </Col>
        <Col md={6} className="right-section"></Col>
      </Row>
    </Container>
  );
};

export default Login;