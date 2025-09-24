const express = require('express');
const supabase = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get audit logs
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userId, 
      action, 
      targetType, 
      startDate, 
      endDate 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        users!inner(first_name, last_name, email)
      `)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get total count with same filters
    let countQuery = supabase
      .from('audit_logs')
      .select('id', { count: 'exact', head: true });

    if (userId) countQuery = countQuery.eq('user_id', userId);
    if (action) countQuery = countQuery.eq('action', action);
    if (targetType) countQuery = countQuery.eq('target_type', targetType);
    if (startDate) countQuery = countQuery.gte('created_at', startDate);
    if (endDate) countQuery = countQuery.lte('created_at', endDate);

    const { count } = await countQuery;

    res.json({
      logs: logs || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log statistics
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get logs for the period
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('action, target_type, created_at, user_id')
      .gte('created_at', startDate);

    // Calculate statistics
    const stats = {
      totalActions: logs?.length || 0,
      uniqueUsers: new Set(logs?.map(log => log.user_id)).size,
      byAction: {},
      byTargetType: {},
      dailyActivity: {}
    };

    // Group by action
    logs?.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    });

    // Group by target type
    logs?.forEach(log => {
      stats.byTargetType[log.target_type] = (stats.byTargetType[log.target_type] || 0) + 1;
    });

    // Group by day
    logs?.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
    });

    // Get most active users
    const userActivity = {};
    logs?.forEach(log => {
      userActivity[log.user_id] = (userActivity[log.user_id] || 0) + 1;
    });

    const topUserIds = Object.entries(userActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId]) => userId);

    // Get user details for top users
    const { data: topUsers } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', topUserIds);

    const topUsersWithActivity = topUsers?.map(user => ({
      ...user,
      activityCount: userActivity[user.id]
    })) || [];

    res.json({
      ...stats,
      topUsers: topUsersWithActivity,
      period: {
        days,
        startDate
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Get available actions and target types for filtering
router.get('/filters', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get distinct actions
    const { data: actions } = await supabase
      .from('audit_logs')
      .select('action')
      .order('action');

    // Get distinct target types
    const { data: targetTypes } = await supabase
      .from('audit_logs')
      .select('target_type')
      .order('target_type');

    // Get users who have audit logs
    const { data: users } = await supabase
      .from('audit_logs')
      .select(`
        user_id,
        users!inner(first_name, last_name, email)
      `)
      .order('users.first_name');

    const uniqueActions = [...new Set(actions?.map(a => a.action))];
    const uniqueTargetTypes = [...new Set(targetTypes?.map(t => t.target_type))];
    const uniqueUsers = users?.reduce((acc, log) => {
      const existing = acc.find(u => u.id === log.user_id);
      if (!existing) {
        acc.push({
          id: log.user_id,
          name: `${log.users.first_name} ${log.users.last_name}`,
          email: log.users.email
        });
      }
      return acc;
    }, []) || [];

    res.json({
      actions: uniqueActions,
      targetTypes: uniqueTargetTypes,
      users: uniqueUsers
    });
  } catch (error) {
    console.error('Get audit filters error:', error);
    res.status(500).json({ error: 'Failed to fetch audit filters' });
  }
});

// Export audit logs
router.get('/export', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      userId, 
      action, 
      targetType, 
      startDate, 
      endDate,
      format = 'json'
    } = req.query;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        users!inner(first_name, last_name, email)
      `);

    // Apply filters
    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.eq('action', action);
    if (targetType) query = query.eq('target_type', targetType);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: logs, error } = await query
      .order('created_at', { ascending: false })
      .limit(10000); // Limit to prevent memory issues

    if (error) throw error;

    // Format logs for export
    const exportLogs = logs?.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      user: `${log.users.first_name} ${log.users.last_name}`,
      userEmail: log.users.email,
      action: log.action,
      targetType: log.target_type,
      targetId: log.target_id,
      details: JSON.stringify(log.details),
      ipAddress: log.ip_address,
      userAgent: log.user_agent
    })) || [];

    // Log the export action
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'audit_logs_exported',
      target_type: 'system',
      details: { 
        recordCount: exportLogs.length,
        filters: { userId, action, targetType, startDate, endDate }
      }
    });

    res.json({
      exportedAt: new Date().toISOString(),
      recordCount: exportLogs.length,
      filters: { userId, action, targetType, startDate, endDate },
      logs: exportLogs
    });
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

module.exports = router;