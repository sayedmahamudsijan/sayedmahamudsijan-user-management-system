import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSortUp, faSortDown, faLock, faUnlock, faUserPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import moment from 'moment';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc'); // Default to desc for last_login
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // For action buttons
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
      setMessage('');
    } catch (err) {
      console.error('Fetch users error:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setMessage('Session expired. Please log in again.');
      } else if (err.response?.status === 500) {
        setMessage('Uh-oh! The server isn’t load users right now. Try again later.');
      } else {
        setMessage('Failed to load users. Please try again.');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBlock = async () => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put('/users/block', { userIds: selectedUsers });
      setMessage(res.data.message || 'Users blocked successfully.');
      setSelectedUsers([]);
      await fetchUsers();
    } catch (err) {
      console.error('Block users error:', err.response?.data || err.message);
      if (err.response?.status === 400) {
        setMessage('Please select valid users to block.');
      } else if (err.response?.status === 500) {
        setMessage('Uh-oh! The server can’t block users right now. Try again later.');
      } else {
        setMessage('Failed to block users. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put('/users/unblock', { userIds: selectedUsers });
      setMessage(res.data.message || 'Users unblocked successfully.');
      setSelectedUsers([]);
      await fetchUsers();
    } catch (err) {
      console.error('Unblock users error:', err.response?.data || err.message);
      if (err.response?.status === 400) {
        setMessage('Please select valid users to unblock.');
      } else if (err.response?.status === 500) {
        setMessage('Uh-oh! The server can’t unblock users right now. Try again later.');
      } else {
        setMessage('Failed to unblock users. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user to delete.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete the selected users? This action cannot be undone.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.delete('/users', { data: { userIds: selectedUsers } });
      setMessage(res.data.message || 'Users deleted successfully.');
      setSelectedUsers([]);
      await fetchUsers();
    } catch (err) {
      console.error('Delete users error:', err.response?.data || err.message);
      if (err.response?.status === 400) {
        setMessage('Please select valid users to delete.');
      } else if (err.response?.status === 500) {
        setMessage('Uh-oh! The server can’t delete users right now. Try again later.');
      } else {
        setMessage('Failed to delete users. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUser = () => {
    navigate('/register');
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dateA = a.last_login ? new Date(a.last_login) : new Date(0);
    const dateB = b.last_login ? new Date(b.last_login) : new Date(0);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="user-list-container">
      <div className="action-buttons">
        <Button variant="primary" onClick={handleBlock} disabled={selectedUsers.length === 0 || actionLoading}>
          <FontAwesomeIcon icon={faLock} /> {actionLoading ? 'Blocking...' : 'Block'}
        </Button>
        <Button variant="outline-success" onClick={handleUnblock} disabled={selectedUsers.length === 0 || actionLoading}>
          <FontAwesomeIcon icon={faUnlock} /> {actionLoading ? 'Unblocking...' : 'Unblock'}
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={selectedUsers.length === 0 || actionLoading}>
          <FontAwesomeIcon icon={faTrash} /> {actionLoading ? 'Deleting...' : 'Delete'}
        </Button>
        <Button variant="success" onClick={handleAddUser} disabled={actionLoading}>
          <FontAwesomeIcon icon={faUserPlus} /> Add User
        </Button>
      </div>
      <Form.Control
        type="text"
        placeholder="Search by name or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
        disabled={actionLoading}
      />
      {message && (
        <p className={message.includes('successfully') ? 'text-success' : 'text-danger'}>{message}</p>
      )}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={handleSelectAll}
                disabled={actionLoading}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
              Last Login {sortOrder === 'desc' ? <FontAwesomeIcon icon={faSortDown} /> : <FontAwesomeIcon icon={faSortUp} />}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.length > 0 ? (
            sortedUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelect(user.id)}
                    disabled={actionLoading}
                  />
                </td>
                <td>
                  {user.name}
                  {user.status === 'blocked' && (
                    <FontAwesomeIcon icon={faLock} className="text-danger ml-2" />
                  )}
                </td>
                <td>{user.email}</td>
                <td>{user.last_login ? moment(user.last_login).fromNow() : 'Never'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No users found.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default UserList;
