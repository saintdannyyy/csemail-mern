const express = require('express');
const Queue = require('../models/Queue');
const Campaign = require('../models/Campaign');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get queue statistics
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
// Get queue statistics
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get job statistics by status
    const jobStats = await Queue.find();

    // Get recent jobs
    const recentJobs = await Queue.find()
      .populate('campaign', 'name subject')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate statistics
    const stats = {
      queued: jobStats?.filter(job => job.status === 'queued').length || 0,
      sending: jobStats?.filter(job => job.status === 'sending').length || 0,
      sent: jobStats?.filter(job => job.status === 'sent').length || 0,
      failed: jobStats?.filter(job => job.status === 'failed').length || 0,
      retrying: jobStats?.filter(job => job.status === 'retrying').length || 0,
      total: jobStats?.length || 0
    };

    // Get processing rate (jobs per minute in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSentJobs = await Queue.find({
      status: 'sent',
      sentAt: { $gte: oneHourAgo }
    });

    const processingRate = recentSentJobs ? Math.round(recentSentJobs.length / 60) : 0;

    res.json({
      stats,
      processingRate,
      recentJobs: recentJobs || []
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ error: 'Failed to fetch queue statistics' });
  }
});

// Get queue jobs with pagination
router.get('/jobs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, status, campaignId } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('email_jobs')
      .select(`
        id,
        email,
        status,
        attempt_count,
        last_attempt_at,
        error_message,
        sent_at,
        created_at,
        campaigns!inner(name, subject)
      `)
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: jobs, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get total count
    let countQuery = supabase
      .from('email_jobs')
      .select('id', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (campaignId) {
      countQuery = countQuery.eq('campaign_id', campaignId);
    }

    const { count } = await countQuery;

    res.json({
      jobs: jobs || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get queue jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch queue jobs' });
  }
});

// Retry failed jobs
router.post('/retry', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { jobIds, campaignId } = req.body;

    let query = supabase
      .from('email_jobs')
      .update({
        status: 'queued',
        error_message: null,
        last_attempt_at: null
      });

    if (jobIds && jobIds.length > 0) {
      query = query.in('id', jobIds);
    } else if (campaignId) {
      query = query.eq('campaign_id', campaignId).eq('status', 'failed');
    } else {
      query = query.eq('status', 'failed');
    }

    const { data, error } = await query.select('id');

    if (error) throw error;

    const retriedCount = data?.length || 0;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'jobs_retried',
      target_type: 'email_job',
      details: { retriedCount, jobIds, campaignId }
    });

    res.json({ 
      message: `${retriedCount} jobs queued for retry`,
      retriedCount 
    });
  } catch (error) {
    console.error('Retry jobs error:', error);
    res.status(500).json({ error: 'Failed to retry jobs' });
  }
});

// Pause/Resume queue processing
router.post('/pause', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Update system configuration
    const { error } = await supabase
      .from('system_config')
      .upsert({
        key: 'queue_paused',
        value: 'true',
        description: 'Queue processing paused by admin',
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'queue_paused',
      target_type: 'system',
      details: { reason: 'Manual pause by admin' }
    });

    res.json({ message: 'Queue processing paused' });
  } catch (error) {
    console.error('Pause queue error:', error);
    res.status(500).json({ error: 'Failed to pause queue' });
  }
});

router.post('/resume', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Update system configuration
    const { error } = await supabase
      .from('system_config')
      .upsert({
        key: 'queue_paused',
        value: 'false',
        description: 'Queue processing resumed by admin',
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'queue_resumed',
      target_type: 'system',
      details: { reason: 'Manual resume by admin' }
    });

    res.json({ message: 'Queue processing resumed' });
  } catch (error) {
    console.error('Resume queue error:', error);
    res.status(500).json({ error: 'Failed to resume queue' });
  }
});

// Get queue configuration
router.get('/config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { data: config } = await supabase
      .from('system_config')
      .select('*')
      .in('key', ['queue_paused', 'rate_limit_per_minute', 'max_retry_attempts']);

    const configMap = {};
    config?.forEach(item => {
      configMap[item.key] = item.value;
    });

    res.json({
      isPaused: configMap.queue_paused === 'true',
      rateLimitPerMinute: parseInt(configMap.rate_limit_per_minute || '100'),
      maxRetryAttempts: parseInt(configMap.max_retry_attempts || '3')
    });
  } catch (error) {
    console.error('Get queue config error:', error);
    res.status(500).json({ error: 'Failed to fetch queue configuration' });
  }
});

// Update queue configuration
router.put('/config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { rateLimitPerMinute, maxRetryAttempts } = req.body;

    const updates = [];
    
    if (rateLimitPerMinute !== undefined) {
      updates.push({
        key: 'rate_limit_per_minute',
        value: rateLimitPerMinute.toString(),
        description: 'Maximum emails to send per minute'
      });
    }

    if (maxRetryAttempts !== undefined) {
      updates.push({
        key: 'max_retry_attempts',
        value: maxRetryAttempts.toString(),
        description: 'Maximum retry attempts for failed jobs'
      });
    }

    if (updates.length > 0) {
      const { error } = await supabase
        .from('system_config')
        .upsert(updates.map(update => ({
          ...update,
          updated_at: new Date().toISOString()
        })));

      if (error) throw error;

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: req.user.id,
        action: 'queue_config_updated',
        target_type: 'system',
        details: { rateLimitPerMinute, maxRetryAttempts }
      });
    }

    res.json({ message: 'Queue configuration updated' });
  } catch (error) {
    console.error('Update queue config error:', error);
    res.status(500).json({ error: 'Failed to update queue configuration' });
  }
});

module.exports = router;