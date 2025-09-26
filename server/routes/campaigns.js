const express = require('express');
// const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all campaigns
router.get('/', authenticateToken, requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('campaigns')
      .select('*')
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: campaigns, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get total count
    let countQuery = supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    res.json({
      campaigns: campaigns || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create campaign
router.post('/', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const {
      name,
      subject,
      fromName,
      fromEmail,
      replyToEmail,
      preheader,
      htmlContent,
      listIds = [],
      scheduledAt
    } = req.body;

    if (!name || !subject || !fromEmail || !htmlContent) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Get recipient count
    let totalRecipients = 0;
    if (listIds.length > 0) {
      const { count } = await supabase
        .from('contact_lists')
        .select('contact_id', { count: 'exact', head: true })
        .in('list_id', listIds);
      totalRecipients = count || 0;
    }

    const campaignId = uuidv4();
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        id: campaignId,
        name,
        subject,
        from_name: fromName,
        from_email: fromEmail,
        reply_to_email: replyToEmail || fromEmail,
        preheader,
        html_content: htmlContent,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt,
        list_ids: listIds,
        total_recipients: totalRecipients,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'campaign_created',
      target_type: 'campaign',
      target_id: campaignId,
      details: { name, subject, totalRecipients }
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Send campaign
router.post('/:id/send', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { sendAt } = req.body;

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({ error: 'Campaign cannot be sent' });
    }

    // Update campaign status
    const updateData = {
      status: sendAt ? 'scheduled' : 'sending',
      scheduled_at: sendAt,
      sent_at: sendAt ? null : new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    // Create email jobs (simplified for demo)
    if (!sendAt) {
      // Get contacts from lists
      const { data: contacts } = await supabase
        .from('contact_lists')
        .select(`
          contact_id,
          contacts!inner(email, first_name, last_name, status)
        `)
        .in('list_id', campaign.list_ids)
        .eq('contacts.status', 'active');

      // Create jobs for each contact
      const jobs = contacts?.map(contact => ({
        id: uuidv4(),
        campaign_id: id,
        contact_id: contact.contact_id,
        email: contact.contacts.email,
        status: 'queued'
      })) || [];

      if (jobs.length > 0) {
        await supabase.from('email_jobs').insert(jobs);
      }

      // Update campaign with actual recipient count
      await supabase
        .from('campaigns')
        .update({ 
          total_recipients: jobs.length,
          status: 'sent',
          sent_count: jobs.length
        })
        .eq('id', id);
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: sendAt ? 'campaign_scheduled' : 'campaign_sent',
      target_type: 'campaign',
      target_id: id,
      details: { sendAt, recipientCount: campaign.total_recipients }
    });

    res.json({ message: sendAt ? 'Campaign scheduled' : 'Campaign sent' });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

// Get campaign analytics
router.get('/:id/analytics', authenticateToken, requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get job statistics
    const { data: jobStats } = await supabase
      .from('email_jobs')
      .select('status')
      .eq('campaign_id', id);

    // Get event statistics
    const { data: eventStats } = await supabase
      .from('email_events')
      .select(`
        type,
        email_jobs!inner(campaign_id)
      `)
      .eq('email_jobs.campaign_id', id);

    // Calculate metrics
    const stats = {
      sent: jobStats?.filter(j => j.status === 'sent').length || 0,
      delivered: eventStats?.filter(e => e.type === 'delivered').length || 0,
      opened: eventStats?.filter(e => e.type === 'opened').length || 0,
      clicked: eventStats?.filter(e => e.type === 'clicked').length || 0,
      bounced: eventStats?.filter(e => e.type === 'bounced').length || 0,
      unsubscribed: eventStats?.filter(e => e.type === 'unsubscribed').length || 0
    };

    res.json({
      campaign,
      stats,
      rates: {
        deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent * 100).toFixed(2) : '0.00',
        openRate: stats.delivered > 0 ? (stats.opened / stats.delivered * 100).toFixed(2) : '0.00',
        clickRate: stats.delivered > 0 ? (stats.clicked / stats.delivered * 100).toFixed(2) : '0.00',
        bounceRate: stats.sent > 0 ? (stats.bounced / stats.sent * 100).toFixed(2) : '0.00'
      }
    });
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

module.exports = router;