const express = require("express");
const Campaign = require("../models/Campaign");
const Template = require("../models/Template");
const Contact = require("../models/Contact");
const ContactList = require("../models/ContactList");
const Queue = require("../models/Queue");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/emailService");
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
        templateId, // NEW: Support for template-based campaigns
        variables = {}, // NEW: Template variables
        listIds = [],
        scheduledAt,
        status,
      } = req.body;

      // Validate required fields
      if (!name || !fromEmail) {
        return res
          .status(400)
          .json({ error: "Name and from email are required" });
      }

      // Check if using template or custom content
      let campaignSubject = subject;
      let campaignContent = htmlContent;
      let usedTemplate = null;

      if (templateId) {
        // Using template - get template and process variables for preview
        const template = await Template.findById(templateId);
        if (!template) {
          return res.status(400).json({ error: "Template not found" });
        }

        usedTemplate = template;
        campaignSubject = subject || template.subject;
        campaignContent = htmlContent || template.content;
      }

      if (!campaignSubject || !campaignContent) {
        return res
          .status(400)
          .json({ error: "Subject and content are required" });
      }

      // Get recipient count
      let totalRecipients = 0;
      if (listIds.length > 0) {
        const lists = await ContactList.find({
          _id: { $in: listIds },
        });
        totalRecipients = lists.reduce(
          (total, list) => total + (list.contactCount || 0),
          0
        );
      }

      const campaign = new Campaign({
        name,
        subject: campaignSubject,
        fromName,
        fromEmail,
        replyToEmail: replyToEmail || fromEmail,
        preheader,
        htmlContent: campaignContent,
        templateId: templateId || null, // Store template reference
        variables: variables, // Store campaign variables
        status: scheduledAt ? "scheduled" : status || "draft",
        scheduledAt,
        lists: listIds,
        totalRecipients,
        createdBy: req.user._id,
      });

      await campaign.save();

      // If status is "sending", send the campaign immediately
      if (status === "sending") {
        try {
          console.log("Campaign sending - Selected list IDs:", listIds);

          // Get contacts from selected lists
          const contacts = await Contact.find({
            lists: { $in: listIds },
            status: "active",
          });

          console.log("Found contacts for sending:", contacts.length);
          console.log(
            "Contact details:",
            contacts.map((c) => ({ email: c.email, lists: c.lists }))
          );

          if (contacts.length === 0) {
            console.log("No contacts found - returning error");
            return res
              .status(400)
              .json({ error: "No active contacts found in selected lists" });
          }

          // Send campaign
          const emailService = require("../services/emailService");
          let sendResults;

          if (templateId) {
            // Template-based campaign
            sendResults = await emailService.sendBulkTemplateEmails({
              templateId,
              contacts: contacts.map((contact) => ({
                email: contact.email,
                variables: {
                  first_name: contact.firstName || contact.email.split("@")[0],
                  last_name: contact.lastName || "",
                  email: contact.email,
                  ...contact.customFields,
                },
              })),
              variables: variables,
              fromName,
              fromEmail,
              replyTo: replyToEmail || fromEmail,
              userId: req.user._id,
              campaignId: campaign._id,
            });
          } else {
            // Custom HTML campaign
            sendResults = await emailService.sendBulkTemplateEmails({
              customTemplate: {
                subject: campaignSubject,
                content: campaignContent,
              },
              contacts: contacts.map((contact) => ({
                email: contact.email,
                variables: {
                  first_name: contact.firstName || contact.email.split("@")[0],
                  last_name: contact.lastName || "",
                  email: contact.email,
                  ...contact.customFields,
                },
              })),
              variables: variables,
              fromName,
              fromEmail,
              replyTo: replyToEmail || fromEmail,
              userId: req.user._id,
              campaignId: campaign._id,
            });
          }

          // Update campaign status with send results
          if (
            sendResults &&
            (sendResults.successful?.length > 0 ||
              sendResults.failed?.length > 0)
          ) {
            campaign.status = "sent";
            campaign.sentAt = new Date();
            campaign.sentCount = sendResults.successful?.length || 0;
            campaign.failedCount = sendResults.failed?.length || 0;
            console.log(
              `Campaign sent immediately: ${campaign.sentCount} successful, ${campaign.failedCount} failed`
            );
          } else {
            // No results returned, keep as draft for manual sending later
            campaign.status = "draft";
            console.log("No send results returned, keeping campaign as draft");
          }
          await campaign.save();
        } catch (sendError) {
          console.error("Failed to send campaign:", sendError);
          // Keep campaign as draft if sending fails
          campaign.status = "draft";
          await campaign.save();
          return res.status(500).json({
            error: "Campaign created but failed to send: " + sendError.message,
          });
        }
      }

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "campaign_created",
        targetType: "campaign",
        targetId: campaign._id,
        details: {
          name,
          subject: campaignSubject,
          totalRecipients,
          templateId: templateId || null,
          variablesCount: Object.keys(variables).length,
        },
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
      const campaign = await Campaign.findById(id).populate("templateId");

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (
        campaign.status !== "draft" &&
        campaign.status !== "scheduled" &&
        !(campaign.status === "sent" && campaign.sentCount === 0)
      ) {
        return res.status(400).json({ error: "Campaign cannot be sent" });
      }

      // Update campaign status
      campaign.status = sendAt ? "scheduled" : "sending";
      campaign.scheduledAt = sendAt;
      campaign.sentAt = sendAt ? null : new Date();

      await campaign.save();

      // Send emails immediately if not scheduled
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

        if (contacts.length > 0) {
          // Send emails using EmailService
          try {
            let sendResults;

            if (campaign.templateId) {
              // Template-based campaign
              sendResults = await emailService.sendBulkTemplateEmails({
                templateId: campaign.templateId._id,
                contacts: contacts,
                variables: campaign.variables || {},
                fromName: campaign.fromName,
                fromEmail: campaign.fromEmail,
                replyTo: campaign.replyToEmail,
                userId: req.user._id,
                campaignId: campaign._id,
                batchSize: 10,
                delay: 1000, // 1 second delay between batches
              });
            } else {
              // Custom HTML campaign - create temporary template
              const tempTemplate = {
                _id: "temp",
                subject: campaign.subject,
                content: campaign.htmlContent,
              };

              // Process each contact individually for custom campaigns
              sendResults = {
                successful: [],
                failed: [],
                total: contacts.length,
              };

              for (const contact of contacts) {
                try {
                  const result = await emailService.sendTemplateEmail({
                    templateId: null,
                    to: contact.email,
                    variables: campaign.variables || {},
                    contact: contact,
                    fromName: campaign.fromName,
                    fromEmail: campaign.fromEmail,
                    replyTo: campaign.replyToEmail,
                    userId: req.user._id,
                    campaignId: campaign._id,
                    customTemplate: tempTemplate,
                  });

                  sendResults.successful.push({
                    contact: contact.email,
                    messageId: result.messageId,
                    subject: result.subject,
                  });
                } catch (error) {
                  sendResults.failed.push({
                    contact: contact.email,
                    error: error.message,
                  });
                }
              }
            }

            // Update campaign with send results
            campaign.status = "sent";
            campaign.sentCount = sendResults.successful.length;
            campaign.failedCount = sendResults.failed.length;
            campaign.totalRecipients = sendResults.total;
            await campaign.save();

            // Create queue entries for tracking
            const queueEntries = [
              ...sendResults.successful.map((result) => ({
                campaign: campaign._id,
                contact: contacts.find((c) => c.email === result.contact)?._id,
                email: result.contact,
                status: "sent",
                messageId: result.messageId,
                sentAt: new Date(),
              })),
              ...sendResults.failed.map((result) => ({
                campaign: campaign._id,
                contact: contacts.find((c) => c.email === result.contact)?._id,
                email: result.contact,
                status: "failed",
                error: result.error,
                sentAt: new Date(),
              })),
            ];

            if (queueEntries.length > 0) {
              await Queue.insertMany(queueEntries);
            }

            console.log(
              `Campaign sent: ${sendResults.successful.length} successful, ${sendResults.failed.length} failed`
            );
          } catch (error) {
            console.error("Bulk email send error:", error);
            campaign.status = "failed";
            campaign.failedCount = contacts.length;
            await campaign.save();

            return res.status(500).json({
              error: "Failed to send campaign emails",
              details: error.message,
            });
          }
        } else {
          campaign.status = "sent";
          campaign.sentCount = 0;
          campaign.totalRecipients = 0;
          await campaign.save();
        }
      }

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: sendAt ? "campaign_scheduled" : "campaign_sent",
        targetType: "campaign",
        targetId: campaign._id,
        details: {
          sendAt,
          recipientCount: campaign.totalRecipients,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
        },
      });

      res.json({
        message: sendAt ? "Campaign scheduled" : "Campaign sent",
        campaign: {
          id: campaign._id,
          status: campaign.status,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
          totalRecipients: campaign.totalRecipients,
        },
      });
    } catch (error) {
      console.error("Send campaign error:", error);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  }
);

// Preview campaign with template variables
router.post(
  "/:id/preview",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { variables = {}, sampleContact = {} } = req.body;

      const campaign = await Campaign.findById(id).populate("templateId");
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.templateId) {
        // Template-based campaign
        const preview = await emailService.previewTemplate({
          templateId: campaign.templateId._id,
          variables: { ...campaign.variables, ...variables },
          contact: sampleContact,
        });

        res.json({
          subject: preview.subject,
          content: preview.content,
          originalSubject: preview.originalSubject,
          originalContent: preview.originalContent,
          variables: preview.variables,
          isTemplate: true,
        });
      } else {
        // Custom campaign - process variables manually
        const processedSubject = emailService.processTemplateVariables(
          campaign.subject,
          { ...campaign.variables, ...variables },
          sampleContact
        );
        const processedContent = emailService.processTemplateVariables(
          campaign.htmlContent,
          { ...campaign.variables, ...variables },
          sampleContact
        );

        res.json({
          subject: processedSubject,
          content: processedContent,
          originalSubject: campaign.subject,
          originalContent: campaign.htmlContent,
          variables: [],
          isTemplate: false,
        });
      }
    } catch (error) {
      console.error("Preview campaign error:", error);
      res.status(500).json({ error: "Failed to preview campaign" });
    }
  }
);

// Send test emails for campaign
router.post(
  "/:id/test",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { testEmails, variables = {}, sampleContact = {} } = req.body;

      if (
        !testEmails ||
        !Array.isArray(testEmails) ||
        testEmails.length === 0
      ) {
        return res.status(400).json({ error: "Test emails are required" });
      }

      const campaign = await Campaign.findById(id).populate("templateId");
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      let results;

      if (campaign.templateId) {
        // Template-based campaign
        results = await emailService.testTemplate({
          templateId: campaign.templateId._id,
          testEmails,
          variables: { ...campaign.variables, ...variables },
          userId: req.user._id,
        });
      } else {
        // Custom campaign
        results = [];
        for (const email of testEmails) {
          try {
            const result = await emailService.sendTemplateEmail({
              templateId: null,
              to: email,
              variables: { ...campaign.variables, ...variables },
              contact: { ...sampleContact, email },
              fromName: campaign.fromName,
              fromEmail: campaign.fromEmail,
              replyTo: campaign.replyToEmail,
              userId: req.user._id,
              customTemplate: {
                subject: campaign.subject,
                content: campaign.htmlContent,
              },
            });

            results.push({
              email,
              success: true,
              messageId: result.messageId,
              subject: result.subject,
            });
          } catch (error) {
            results.push({
              email,
              success: false,
              error: error.message,
            });
          }
        }
      }

      // Log test send
      await AuditLog.create({
        userId: req.user._id,
        action: "campaign_test_sent",
        targetType: "campaign",
        targetId: campaign._id,
        details: {
          testEmails,
          campaignName: campaign.name,
          variablesUsed: Object.keys(variables),
          successCount: results.filter((r) => r.success).length,
          failCount: results.filter((r) => !r.success).length,
        },
      });

      res.json({
        message: `Test emails sent to ${testEmails.length} recipient(s)`,
        results,
        summary: {
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
      });
    } catch (error) {
      console.error("Send test campaign error:", error);
      res.status(500).json({ error: "Failed to send test emails" });
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
