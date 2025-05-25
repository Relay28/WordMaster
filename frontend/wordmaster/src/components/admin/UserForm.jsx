// src/components/admin/UserForm.jsx
import React, { useState } from 'react';
import api from '../utils/api';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Alert,
  Box,
  Chip

} from '@mui/material';
import { LoadingButton } from '@mui/lab';

const UserForm = ({ user, type, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
      fname: user?.fname || '',
      lname: user?.lname || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'USER',
      active: user?.active ?? true
    });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData(prev => ({
          ...prev,
          profilePicture: file // Store the file object for upload
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (type === 'create') {
        await api.post('/api/admin/users/C', formData);
      } else {
        await api.put(`/api/admin/users/${user.id}`, formData);
      }
      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || 'Operation failed';
      setError(message);
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3} sx={{ mt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="First Name"
            name="fname"
            value={formData.fname}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            label="Last Name"
            name="lname"
            value={formData.lname}
            onChange={handleChange}
            required
            fullWidth
          />
        </Box>

        <TextField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          fullWidth
        />

        {type === 'create' && (
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required={type === 'create'}
            fullWidth
          />
        )}

        <FormControl fullWidth>
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formData.role}
            label="Role"
            onChange={handleChange}
            required
          >
            <MenuItem value="USER_STUDENT">Student</MenuItem>
            <MenuItem value="USER_TEACHER">Teacher</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            {/* Add other roles if needed */}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              name="active"
              checked={formData.active}
              onChange={handleChange}
            />
          }
          label="Active"
        />

        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={loading}
          fullWidth
        >
          {type === 'create' ? 'Create User' : 'Update User'}
        </LoadingButton>
      </Stack>
    </form>
  );
};

export default UserForm;