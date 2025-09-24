const express = require('express');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');
const supabase = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Get campaign statistics
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, status, created_at, sent_count, total_recipients')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get email job statistics
    const { data: emailJobs } = await supabase
      .from('email_jobs')
      .select('status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get event statistics
    const { data: events } = await supabase
      .from('email_events')
      .select('type, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get contact statistics
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: suppressedContacts } = await supabase
      .from('suppression_list')
      .select('email', { count: 'exact', head: true });

    // Calculate metrics
    const totalCampaigns = campaigns?.length || 0;
    const emailsSent = emailJobs?.filter(job => job.status === 'sent').length || 0;
    const emailsDelivered = events?.filter(event => event.type === 'delivered').length || 0;
    const emailsOpened = events?.filter(event => event.type === 'opened').length || 0;
    const emailsClicked = events?.filter(event => event.type === 'clicked').length || 0;
    const emailsBounced = events?.filter(event => event.type === 'bounced').length || 0;

    // Calculate rates
    const openRate = emailsDelivered > 0 ? (emailsOpened / emailsDelivered * 100) : 0;
    const clickRate = emailsDelivered > 0 ? (emailsClicked / emailsDelivered * 100) : 0;
    const bounceRate = emailsSent > 0 ? (emailsBounced / emailsSent * 100) : 0;

    // Get daily performance data
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const daySent = emailJobs?.filter(job => 
        job.status === 'sent' && 
        format(new Date(job.created_at), 'yyyy-MM-dd') === dateStr
      ).length || 0;
      
      const dayOpened = events?.filter(event => 
        event.type === 'opened' && 
        format(new Date(event.created_at), 'yyyy-MM-dd') === dateStr
      ).length || 0;
      
      const dayClicked = events?.filter(event => 
        event.type === 'clicked' && 
        format(new Date(event.created_at), 'yyyy-MM-dd') === dateStr
      ).length || 0;

      dailyData.push({
        date: dateStr,
        sent: daySent,
        opened: dayOpened,
        clicked: dayClicked
      });
    }

    res.json({
      summary: {
        totalCampaigns,
        emailsSent,
        emailsDelivered,
        emailsOpened,
        emailsClicked,
        emailsBounced,
        totalContacts: totalContacts || 0,
        suppressedContacts: suppressedContacts || 0,
        openRate: openRate.toFixed(1),
        clickRate: clickRate.toFixed(1),
        bounceRate: bounceRate.toFixed(1)
      },
      dailyPerformance: dailyData,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Get dashboard statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get campaign performance report
router.get('/campaigns', authenticateToken, requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  try {
    const { page = 1, limit = 20, period = '30' } = req.query;
    const offset = (page - 1) * limit;
    const days = parseInt(period);
    const startDate = startOfDay(subDays(new Date(), days));

    // Get campaigns with statistics
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        subject,
        status,
        sent_at,
        total_recipients,
        sent_count,
        delivered_count,
        opened_count,
        clicked_count,
        bounced_count,
        unsubscribed_count
      `)
      .gte('created_at', startDate.toISOString())
      .order('sent_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate rates for each campaign
    const campaignsWithRates = campaigns?.map(campaign => ({
      ...campaign,
      deliveryRate: campaign.sent_count > 0 ? 
        ((campaign.delivered_count || 0) / campaign.sent_count * 100).toFixed(2) : '0.00',
      openRate: campaign.delivered_count > 0 ? 
        ((campaign.opened_count || 0) / campaign.delivered_count * 100).toFixed(2) : '0.00',
      clickRate: campaign.delivered_count > 0 ? 
        ((campaign.clicked_count || 0) / campaign.delivered_count * 100).toFixed(2) : '0.00',
      bounceRate: campaign.sent_count > 0 ? 
        ((campaign.bounced_count || 0) / campaign.sent_count * 100).toFixed(2) : '0.00'
    })) || [];

    // Get total count
    const { count } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    res.json({
      campaigns: campaignsWithRates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get campaign performance error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign performance' });
  }
});

// Export campaign report
router.get('/campaigns/:id/export', authenticateToken, requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get recipient details with events
    const { data: recipients } = await supabase
      .from('email_jobs')
      .select(`
        email,
        status,
        sent_at,
        email_events(type, created_at, details)
      `)
      .eq('campaign_id', id)
      .order('sent_at', { ascending: false });

    // Format data for CSV export
    const csvData = recipients?.map(recipient => {
      const events = recipient.email_events || [];
      const delivered = events.find(e => e.type === 'delivered');
      const opened = events.find(e => e.type === 'opened');
      const clicked = events.find(e => e.type === 'clicked');
      const bounced = events.find(e => e.type === 'bounced');
      const unsubscribed = events.find(e => e.type === 'unsubscribed');

      return {
        email: recipient.email,
        status: recipient.status,
        sentAt: recipient.sent_at,
        delivered: delivered ? 'Yes' : 'No',
        deliveredAt: delivered?.created_at || '',
        opened: opened ? 'Yes' : 'No',
        openedAt: opened?.created_at || '',
        clicked: clicked ? 'Yes' : 'No',
        clickedAt: clicked?.created_at || '',
        bounced: bounced ? 'Yes' : 'No',
        bouncedAt: bounced?.created_at || '',
        unsubscribed: unsubscribed ? 'Yes' : 'No',
        unsubscribedAt: unsubscribed?.created_at || ''
      };
    }) || [];

    res.json({
      campaign: {
        name: campaign.name,
        subject: campaign.subject,
        sentAt: campaign.sent_at
      },
      recipients: csvData,
      summary: {
        totalRecipients: csvData.length,
        delivered: csvData.filter(r => r.delivered === 'Yes').length,
        opened: csvData.filter(r => r.opened === 'Yes').length,
        clicked: csvData.filter(r => r.clicked === 'Yes').length,
        bounced: csvData.filter(r => r.bounced === 'Yes').length,
        unsubscribed: csvData.filter(r => r.unsubscribed === 'Yes').length
      }
    });
  } catch (error) {
    console.error('Export campaign report error:', error);
    res.status(500).json({ error: 'Failed to export campaign report' });
  }
});

module.exports = router;