import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { FaUserPlus, FaEye, FaTrash, FaSearch, FaUsers, FaChartLine, FaUserShield } from 'react-icons/fa';
import { RiAdminFill, RiDashboardLine } from 'react-icons/ri';
import { BiLoaderAlt } from 'react-icons/bi';
import { MdEmail, MdOutlineVerified } from 'react-icons/md';
import { BsThreeDotsVertical, BsShieldLock } from 'react-icons/bs';
import './AdminDashboard.css';

// Main AdminDashboard component
const AdminDashboard = () => {
  // State declarations
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showUserMenu, setShowUserMenu] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const { currentUser } = useAuth();

  // Effect for dark mode and fetching users
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';

    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Simulate delay for loading state
        await new Promise(resolve => setTimeout(resolve, 800));
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUsers(res.data);
      } catch (err) {
        setError('Failed to load users. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [darkMode]);

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsers(users.filter(user => user._id !== userId));
      setShowDeleteModal(false);

      // Show success message
      const successElement = document.createElement('div');
      successElement.className = 'success-message';
      successElement.innerHTML = '<span>✓</span> User deleted successfully';
      document.body.appendChild(successElement);

      setTimeout(() => {
        document.body.removeChild(successElement);
      }, 3000);
    } catch (err) {
      setError('Failed to delete user. The server returned an error.');
      setShowDeleteModal(false);
    }
  };

  // Confirm deletion modal
  const confirmDelete = (userId, e) => {
    e.stopPropagation();
    setUserToDelete(userId);
    setShowDeleteModal(true);
    setShowUserMenu(null);
  };

  // Toggle user menu
  const toggleUserMenu = (userId, e) => {
    e.stopPropagation();
    setShowUserMenu(showUserMenu === userId ? null : userId);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && user.role.toLowerCase() === activeFilter.toLowerCase();
  });

  // Calculate dashboard stats
  const stats = {
    totalUsers: users.length,
    admins: users.filter(user => user.role === 'Admin').length,
    newUsers: users.filter(user => {
      const userDate = new Date(user.createdAt || Date.now());
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return userDate > oneWeekAgo;
    }).length,
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-container">
          <BiLoaderAlt className="loading-spinner" />
        </div>
        <p>Loading dashboard data...</p>
        <div className="loading-progress-bar">
          <div className="loading-progress-value"></div>
        </div>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className={`admin-dashboard ${darkMode ? 'dark-theme' : ''}`}>
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <BsShieldLock />
            <span>AdminPanel</span>
          </div>
        </div>
        <div className="sidebar-menu">
          <div className="menu-item active">
            <RiDashboardLine />
            <span>Dashboard</span>
          </div>
          <div className="menu-item">
            <FaUsers />
            <span>Users</span>
          </div>
          <div className="menu-item">
            <FaChartLine />
            <span>Analytics</span>
          </div>
          <div className="menu-item">
            <MdEmail />
            <span>Messages</span>
          </div>
        </div>
        <div className="theme-toggle" onClick={toggleDarkMode}>
          <div className={`toggle-slider ${darkMode ? 'active' : ''}`}>
            <div className="toggle-thumb"></div>
          </div>
          <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <div className="main-header">
          <h1>
            <span className="welcome-text">Welcome back,</span>
            {currentUser.name}
          </h1>
          <div className="admin-profile">
            <div className="profile-status">
              <span className="status-dot"></span>
              <span>Online</span>
            </div>
            <div className="admin-avatar">
              <RiAdminFill />
              <div className="avatar-badge">
                <MdOutlineVerified />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stats-card users">
            <div className="stats-icon">
              <FaUsers />
            </div>
            <div className="stats-info">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
            <div className="stats-chart">
              <div className="bar" style={{ height: '60%' }}></div>
              <div className="bar" style={{ height: '80%' }}></div>
              <div className="bar" style={{ height: '40%' }}></div>
              <div className="bar" style={{ height: '70%' }}></div>
              <div className="bar" style={{ height: '90%' }}></div>
            </div>
          </div>

          <div className="stats-card admins">
            <div className="stats-icon">
              <FaUserShield />
            </div>
            <div className="stats-info">
              <h3>{stats.admins}</h3>
              <p>Administrators</p>
            </div>
            <div className="stats-progress">
              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{ width: `${(stats.admins / stats.totalUsers) * 100}%` }}
                ></div>
              </div>
              <span>{Math.round((stats.admins / stats.totalUsers) * 100)}%</span>
            </div>
          </div>

          <div className="stats-card new-users">
            <div className="stats-icon">
              <FaUserPlus />
            </div>
            <div className="stats-info">
              <h3>{stats.newUsers}</h3>
              <p>New Users</p>
            </div>
            <div className="stats-indicator">
              <span className="indicator-value">+{stats.newUsers}</span>
              <span className="indicator-period">This Week</span>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="dashboard-content">
          <div className="content-header">
            <h2>User Management</h2>
            <Link to="/create-user" className="add-user-btn">
              <FaUserPlus />
              <span>Add New User</span>
            </Link>
          </div>

          {/* Filter and Search */}
          <div className="filter-container">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-tabs">
              {[
                { label: 'All Users', value: 'all' },
                { label: 'Students', value: 'student' },
                { label: 'Admins', value: 'admin' },
                { label: 'Content Admins', value: 'content_admin' },
                { label: 'Faculty', value: 'faculty' },
                { label: 'Verification Admins', value: 'verification_admin' },
                { label: 'Verification Officers', value: 'verification_officer' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  className={`filter-tab ${activeFilter === value ? 'active' : ''}`}
                  onClick={() => setActiveFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Users List */}
          <div className="users-container">
            {filteredUsers.length > 0 ? (
              <div className="users-grid">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user._id}
                    className="user-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="user-card-content">
                      <div className="user-card-header">
                        <div className="user-avatar">
                          <span>{user.name.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="user-info">
                        <h3 className="user-name">{user.name}</h3>
                        <p className="user-email">{user.email}</p>
                        <div className="user-role">
                          <span className={`role-badge ${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <div className="user-actions">
                        <Link to={`/user/${user._id}`} className="btn-view">
                          <FaEye />
                          <span>View</span>
                        </Link>
                        <button
                          className="btn-delete"
                          onClick={(e) => confirmDelete(user._id, e)}
                        >
                          <FaTrash />
                          <span>Delete</span>
                        </button>
                        <div className="user-card-menu">
                          <button
                            className="menu-toggle"
                            onClick={(e) => toggleUserMenu(user._id, e)}
                          >
                            <BsThreeDotsVertical />
                          </button>
                          {showUserMenu === user._id && (
                            <div className="user-menu">
                              <Link to={`/user/${user._id}`} className="menu-item">
                                <FaEye />
                                <span>View Details</span>
                              </Link>
                              <button
                                className="menu-item delete"
                                onClick={(e) => confirmDelete(user._id, e)}
                              >
                                <FaTrash />
                                <span>Delete User</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-users-found">
                <div className="no-data-icon">
                  <FaUsers />
                </div>
                <h3>No Users Found</h3>
                <p>There are no users matching your current search criteria.</p>
                <button
                  className="btn-reset-search"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="modal-icon">
              <FaTrash />
            </div>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={() => handleDeleteUser(userToDelete)}
              >
                <FaTrash />
                <span>Delete User</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;