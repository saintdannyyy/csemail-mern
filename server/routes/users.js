const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, email, first_name, last_name, role, status, created_at, last_login_at')
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: users, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get total count
    let countQuery = supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
      countQuery = countQuery.eq('role', role);
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    res.json({
      users: users || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { email, firstName, lastName, role, sendInvite = true } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const userId = uuidv4();
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        role,
        status: 'pending',
        password_hash: passwordHash
      })
      .select('id, email, first_name, last_name, role, status, created_at')
      .single();

    if (error) throw error;

    // TODO: Send invitation email if sendInvite is true
    // This would integrate with your email sending service

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'user_created',
      target_type: 'user',
      target_id: userId,
      details: { email, firstName, lastName, role, sendInvite }
    });

    res.status(201).json({
      user,
      tempPassword: sendInvite ? undefined : tempPassword // Only return password if not sending invite
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, status } = req.body;

    // Prevent admin from changing their own role or status
    if (id === req.user.id && (role !== req.user.role || status !== req.user.status)) {
      return res.status(400).json({ error: 'Cannot change your own role or status' });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, first_name, last_name, role, status, created_at, updated_at')
      .single();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'user_updated',
      target_type: 'user',
      target_id: id,
      details: updateData
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has created campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('created_by', id)
      .limit(1);

    if (campaigns && campaigns.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user who has created campaigns. Deactivate instead.' 
      });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'user_deleted',
      target_type: 'user',
      target_id: id
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Reset user password
router.post('/:id/reset-password', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Generate new temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        status: 'pending', // Force user to change password on next login
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // TODO: Send password reset email
    // This would integrate with your email sending service

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'user_password_reset',
      target_type: 'user',
      target_id: id
    });

    res.json({ 
      message: 'Password reset successfully',
      tempPassword // In production, this would be sent via email
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get user counts by role and status
    const { data: users } = await supabase
      .from('users')
      .select('role, status');

    const stats = {
      total: users?.length || 0,
      byRole: {
        admin: users?.filter(u => u.role === 'admin').length || 0,
        editor: users?.filter(u => u.role === 'editor').length || 0,
        viewer: users?.filter(u => u.role === 'viewer').length || 0
      },
      byStatus: {
        active: users?.filter(u => u.status === 'active').length || 0,
        inactive: users?.filter(u => u.status === 'inactive').length || 0,
        pending: users?.filter(u => u.status === 'pending').length || 0
      }
    };

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('audit_logs')
      .select(`
        action,
        created_at,
        users!inner(first_name, last_name, email)
      `)
      .in('action', ['user_login', 'user_logout', 'user_created', 'user_updated'])
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      stats,
      recentActivity: recentActivity || []
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;