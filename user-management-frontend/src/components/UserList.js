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
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      const parsedUsers = Array.isArray(res.data) ? res.data.map(user => ({
        ...user,
        activity_data: user.activity_data ? JSON.parse(user.activity_data || '[0, 0, 0]') : [0, 0, 0]
      })) : [];
      setUsers(parsedUsers);
      setMessage('');
    } catch (err) {
      console.error('Fetch users error:', err.message);
      setMessage(`Failed to load users: ${err.message}`);
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
      setMessage('Please select at least one user');
      return;
    }
    try {
      const res = await api.put('/users/block', { userIds: selectedUsers });
      setMessage(res.data.message);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setMessage(`Failed to block users: ${err.message}`);
    }
  };

  const handleUnblock = async () => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user');
      return;
    }
    try {
      const res = await api.put('/users/unblock', { userIds: selectedUsers });
      setMessage(res.data.message);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setMessage(`Failed to unblock users: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user to delete');
      return;
    }
    if (!window.confirm('Are you sure you want to delete the selected users? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await api.delete('/users', { data: { userIds: selectedUsers } });
      setMessage(res.data.message);
      setSelectedUsers([]);
      await fetchUsers(); // Ensure refresh happens after deletion
    } catch (err) {
      console.error('Delete error details:', err.response?.data || err.message);
      setMessage(`Failed to delete users: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAddUser = () => {
    navigate('/register');
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) =>
    sortOrder === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email)
  );

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="user-list-container">
      <div className="action-buttons">
        <Button variant="primary" onClick={handleBlock} disabled={selectedUsers.length === 0}>
          <FontAwesomeIcon icon={faLock} /> Block
        </Button>
        <Button variant="outline-success" onClick={handleUnblock} disabled={selectedUsers.length === 0}>
          <FontAwesomeIcon icon={faUnlock} /> Unblock
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={selectedUsers.length === 0}>
          <FontAwesomeIcon icon={faTrash} /> Delete
        </Button>
        <Button variant="success" onClick={handleAddUser}>
          <FontAwesomeIcon icon={faUserPlus} /> Add User
        </Button>
      </div>
      <Form.Control
        type="text"
        placeholder="Search by name or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      {message && <p className={message.includes('successfully') ? 'text-success' : 'text-danger'}>{message}</p>}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={handleSelectAll}
              />
            </th>
            <th>Name</th>
            <th onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              Email {sortOrder === 'asc' ? <FontAwesomeIcon icon={faSortUp} /> : <FontAwesomeIcon icon={faSortDown} />}
            </th>
            <th>Last Seen</th>
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
                  />
                </td>
                <td>
                  {user.name}
                  {user.status === 'blocked' && (
                    <FontAwesomeIcon icon={faLock} className="text-danger ml-2" />
                  )}
                </td>
                <td>{user.email}</td>
                <td>{moment(user.last_seen).fromNow()}</td>
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