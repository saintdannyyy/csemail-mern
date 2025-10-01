const express = require("express");
const Campaign = require("../models/Campaign");
const ContactList = require("../models/ContactList");
const Queue = require("../models/Queue");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get all campaigns
router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const offset = (page - 1) * limit;

      let query = {};

      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { subject: new RegExp(search, "i") },
        ];
      }

      if (status && status !== "all") {
        query.status = status;
      }

      const campaigns = await Campaign.find(query)
        .skip(offset)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const count = await Campaign.countDocuments(query);

      res.json({
        campaigns: campaigns || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  }
);

// Create campaign
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
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
        scheduledAt,
      } = req.body;

      if (!name || !subject || !fromEmail || !htmlContent) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      // Get recipient count
      let totalRecipients = 0;
      if (listIds.length > 0) {
        const lists = await ContactList.find({
          _id: { $in: listIds },
        }).populate("contacts");
        totalRecipients = lists.reduce(
          (total, list) => total + list.contacts.length,
          0
        );
      }

      const campaign = new Campaign({
        name,
        subject,
        fromName,
        fromEmail,
        replyToEmail: replyToEmail || fromEmail,
        preheader,
        htmlContent,
        status: scheduledAt ? "scheduled" : "draft",
        scheduledAt,
        lists: listIds,
        totalRecipients,
        createdBy: req.user.userId,
      });

      await campaign.save();

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "campaign_created",
        targetType: "campaign",
        targetId: campaign._id,
        details: { name, subject, totalRecipients },
      });

      res.status(201).json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  }
);

// Send campaign
router.post(
  "/:id/send",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sendAt } = req.body;

      // Get campaign
      const campaign = await Campaign.findById(id);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.status !== "draft" && campaign.status !== "scheduled") {
        return res.status(400).json({ error: "Campaign cannot be sent" });
      }

      // Update campaign status
      campaign.status = sendAt ? "scheduled" : "sending";
      campaign.scheduledAt = sendAt;
      campaign.sentAt = sendAt ? null : new Date();

      await campaign.save();

      // Create email jobs (simplified for demo)
      if (!sendAt) {
        // Get contacts from lists
        const lists = await ContactList.find({
          _id: { $in: campaign.lists },
        }).populate({
          path: "contacts",
          match: { status: "active" },
        });

        const contacts = [];
        lists.forEach((list) => {
          contacts.push(...list.contacts);
        });

        // Create jobs for each contact
        const jobs = contacts.map((contact) => ({
          campaign: campaign._id,
          contact: contact._id,
          email: contact.email,
          status: "queued",
        }));

        if (jobs.length > 0) {
          await Queue.insertMany(jobs);
        }

        // Update campaign with actual recipient count
        campaign.totalRecipients = jobs.length;
        campaign.status = "sent";
        campaign.sentCount = jobs.length;
        await campaign.save();
      }

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: sendAt ? "campaign_scheduled" : "campaign_sent",
        targetType: "campaign",
        targetId: campaign._id,
        details: { sendAt, recipientCount: campaign.totalRecipients },
      });

      res.json({ message: sendAt ? "Campaign scheduled" : "Campaign sent" });
    } catch (error) {
      console.error("Send campaign error:", error);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  }
);

// Get campaign analytics
router.get(
  "/:id/analytics",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get campaign
      const campaign = await Campaign.findById(id);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get job statistics
      const jobStats = await Queue.find({ campaign: id });

      // For now, simplified stats (we'll add email events later)
      const stats = {
        sent: jobStats.filter((j) => j.status === "sent").length,
        delivered: jobStats.filter((j) => j.status === "delivered").length,
        opened: 0, // TODO: Add email events tracking
        clicked: 0, // TODO: Add email events tracking
        bounced: jobStats.filter((j) => j.status === "bounced").length,
        unsubscribed: 0, // TODO: Add email events tracking
      };

      res.json({
        campaign,
        stats,
        rates: {
          deliveryRate:
            stats.sent > 0
              ? ((stats.delivered / stats.sent) * 100).toFixed(2)
              : "0.00",
          openRate:
            stats.delivered > 0
              ? ((stats.opened / stats.delivered) * 100).toFixed(2)
              : "0.00",
          clickRate:
            stats.delivered > 0
              ? ((stats.clicked / stats.delivered) * 100).toFixed(2)
              : "0.00",
          bounceRate:
            stats.sent > 0
              ? ((stats.bounced / stats.sent) * 100).toFixed(2)
              : "0.00",
        },
      });
    } catch (error) {
      console.error("Get campaign analytics error:", error);
      res.status(500).json({ error: "Failed to fetch campaign analytics" });
    }
  }
);

module.exports = router;
