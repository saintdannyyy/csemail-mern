const express = require("express");
const { format, subDays, startOfDay, endOfDay } = require("date-fns");
const Campaign = require("../models/Campaign");
const Queue = require("../models/Queue");
const Contact = require("../models/Contact");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get dashboard statistics
router.get(
  "/dashboard",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { period = "30" } = req.query;
      const days = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Get campaign statistics
      const campaigns = await Campaign.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // Get email job statistics
      const emailJobs = await Queue.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // Get contact statistics
      const totalContacts = await Contact.countDocuments({
        status: "active",
      });

      // TODO: Add suppression list when SuppressionList model is implemented
      const suppressedContacts = 0;

      // Calculate metrics
      const totalCampaigns = campaigns?.length || 0;
      const emailsSent =
        emailJobs?.filter((job) => job.status === "sent").length || 0;
      // TODO: Add email events tracking
      const emailsDelivered = 0;
      const emailsOpened = 0;
      const emailsClicked = 0;
      const emailsBounced =
        emailJobs?.filter((job) => job.status === "bounced").length || 0;
      const activeContacts = totalContacts - suppressedContacts;

      res.json({
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        campaigns: {
          total: totalCampaigns,
          sent: campaigns?.filter((c) => c.status === "sent").length || 0,
          scheduled:
            campaigns?.filter((c) => c.status === "scheduled").length || 0,
          draft: campaigns?.filter((c) => c.status === "draft").length || 0,
        },
        emails: {
          sent: emailsSent,
          delivered: emailsDelivered,
          opened: emailsOpened,
          clicked: emailsClicked,
          bounced: emailsBounced,
          deliveryRate:
            emailsSent > 0
              ? ((emailsDelivered / emailsSent) * 100).toFixed(2)
              : "0.00",
          openRate:
            emailsDelivered > 0
              ? ((emailsOpened / emailsDelivered) * 100).toFixed(2)
              : "0.00",
          clickRate:
            emailsDelivered > 0
              ? ((emailsClicked / emailsDelivered) * 100).toFixed(2)
              : "0.00",
          bounceRate:
            emailsSent > 0
              ? ((emailsBounced / emailsSent) * 100).toFixed(2)
              : "0.00",
        },
        contacts: {
          total: totalContacts,
          active: activeContacts,
          suppressed: suppressedContacts,
        },
      });
    } catch (error) {
      console.error("Get dashboard statistics error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  }
);

// Get campaign performance report
router.get(
  "/campaigns",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, period = "30" } = req.query;
      const offset = (page - 1) * limit;
      const days = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), days));

      // Get campaigns with statistics
      const campaigns = await Campaign.find({
        createdAt: { $gte: startDate },
      })
        .sort({ sentAt: -1 })
        .skip(offset)
        .limit(parseInt(limit));

      // Calculate rates for each campaign
      const campaignsWithRates =
        campaigns?.map((campaign) => ({
          id: campaign._id,
          name: campaign.name,
          subject: campaign.subject,
          status: campaign.status,
          sentAt: campaign.sentAt,
          totalRecipients: campaign.totalRecipients,
          sentCount: campaign.sentCount || 0,
          deliveredCount: campaign.deliveredCount || 0,
          openedCount: campaign.openedCount || 0,
          clickedCount: campaign.clickedCount || 0,
          bouncedCount: campaign.bouncedCount || 0,
          unsubscribedCount: campaign.unsubscribedCount || 0,
          deliveryRate:
            (campaign.sentCount || 0) > 0
              ? (
                  ((campaign.deliveredCount || 0) / (campaign.sentCount || 0)) *
                  100
                ).toFixed(2)
              : "0.00",
          openRate:
            (campaign.deliveredCount || 0) > 0
              ? (
                  ((campaign.openedCount || 0) /
                    (campaign.deliveredCount || 0)) *
                  100
                ).toFixed(2)
              : "0.00",
          clickRate:
            (campaign.deliveredCount || 0) > 0
              ? (
                  ((campaign.clickedCount || 0) /
                    (campaign.deliveredCount || 0)) *
                  100
                ).toFixed(2)
              : "0.00",
          bounceRate:
            (campaign.sentCount || 0) > 0
              ? (
                  ((campaign.bouncedCount || 0) / (campaign.sentCount || 0)) *
                  100
                ).toFixed(2)
              : "0.00",
        })) || [];

      // Get total count
      const count = await Campaign.countDocuments({
        createdAt: { $gte: startDate },
      });

      res.json({
        campaigns: campaignsWithRates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error("Get campaign performance error:", error);
      res.status(500).json({ error: "Failed to fetch campaign performance" });
    }
  }
);

// Export campaign report
router.get(
  "/campaigns/:id/export",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get campaign details
      const campaign = await Campaign.findById(id);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get recipient details from queue
      const recipients = await Queue.find({
        campaignId: id,
      })
        .populate("contactId", "email")
        .sort({ sentAt: -1 });

      // Format data for CSV export
      const csvData =
        recipients?.map((recipient) => ({
          email: recipient.email,
          status: recipient.status,
          sentAt: recipient.sentAt,
          deliveredAt: null, // TODO: Add email events tracking
          openedAt: null, // TODO: Add email events tracking
          clickedAt: null, // TODO: Add email events tracking
          bouncedAt: recipient.status === "bounced" ? recipient.sentAt : null,
          unsubscribedAt: null, // TODO: Add email events tracking
        })) || [];

      res.json({
        campaign: {
          name: campaign.name,
          subject: campaign.subject,
          sentAt: campaign.sentAt,
        },
        recipients: csvData,
        summary: {
          totalRecipients: csvData.length,
          delivered: csvData.filter((r) => r.status === "sent").length, // Simplified for now
          opened: 0, // TODO: Add email events tracking
          clicked: 0, // TODO: Add email events tracking
          bounced: csvData.filter((r) => r.status === "bounced").length,
          unsubscribed: 0, // TODO: Add email events tracking
        },
      });
    } catch (error) {
      console.error("Export campaign report error:", error);
      res.status(500).json({ error: "Failed to export campaign report" });
    }
  }
);

module.exports = router;
