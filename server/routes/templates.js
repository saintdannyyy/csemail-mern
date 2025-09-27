const express = require("express");
const Template = require("../models/Template");
const Campaign = require("../models/Campaign");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get all templates
router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { search } = req.query;

      // Get all templates
      router.get(
        "/",
        authenticateToken,
        requireRole(["admin", "editor"]),
        async (req, res) => {
          try {
            const { search } = req.query;

            let query = {};

            if (search) {
              query.$or = [
                { name: new RegExp(search, "i") },
                { description: new RegExp(search, "i") },
              ];
            }

            const templates = await Template.find(query).sort({
              isDefault: -1,
              createdAt: -1,
            });

            res.json(templates || []);
          } catch (error) {
            console.error("Get templates error:", error);
            res.status(500).json({ error: "Failed to fetch templates" });
          }
        }
      );

      res.json(templates || []);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  }
);

// Create template
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        htmlContent,
        thumbnailUrl,
        isDefault = false,
      } = req.body;

      if (!name || !htmlContent) {
        return res
          .status(400)
          .json({ error: "Name and HTML content are required" });
      }

      const template = new Template({
        name,
        description,
        htmlContent,
        thumbnailUrl,
        isDefault,
        createdBy: req.user.userId,
      });

      await template.save();

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_created",
        targetType: "template",
        targetId: template._id,
        details: { name, description },
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  }
);

// Update template
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, htmlContent, thumbnailUrl, isDefault } =
        req.body;

      // Update template
      router.put(
        "/:id",
        authenticateToken,
        requireRole(["admin", "editor"]),
        async (req, res) => {
          try {
            const { id } = req.params;
            const { name, description, htmlContent, thumbnailUrl, isDefault } =
              req.body;

            const template = await Template.findByIdAndUpdate(
              id,
              {
                name,
                description,
                htmlContent,
                thumbnailUrl,
                isDefault,
                updatedAt: new Date(),
              },
              { new: true }
            );

            if (!template) {
              return res.status(404).json({ error: "Template not found" });
            }

            // Log audit event
            await AuditLog.create({
              userId: req.user.userId,
              action: "template_updated",
              targetType: "template",
              targetId: template._id,
              details: { name, description },
            });

            res.json(template);
          } catch (error) {
            console.error("Update template error:", error);
            res.status(500).json({ error: "Failed to update template" });
          }
        }
      );

      res.json(template);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  }
);

// Delete template
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Delete template
      router.delete(
        "/:id",
        authenticateToken,
        requireRole(["admin", "editor"]),
        async (req, res) => {
          try {
            const { id } = req.params;

            // Check if template is being used in campaigns
            const campaigns = await Campaign.find({ template: id }).limit(1);

            if (campaigns && campaigns.length > 0) {
              return res
                .status(400)
                .json({
                  error:
                    "Template is being used by campaigns and cannot be deleted",
                });
            }

            const template = await Template.findByIdAndDelete(id);

            if (!template) {
              return res.status(404).json({ error: "Template not found" });
            }

            // Log audit event
            await AuditLog.create({
              userId: req.user.userId,
              action: "template_deleted",
              targetType: "template",
              targetId: id,
            });

            res.json({ message: "Template deleted successfully" });
          } catch (error) {
            console.error("Delete template error:", error);
            res.status(500).json({ error: "Failed to delete template" });
          }
        }
      );

      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  }
);

// Duplicate template
router.post(
  "/:id/duplicate",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get original template
      const originalTemplate = await Template.findById(id);

      if (!originalTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Create duplicate
      const newTemplate = new Template({
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        htmlContent: originalTemplate.htmlContent,
        thumbnailUrl: originalTemplate.thumbnailUrl,
        isDefault: false,
        createdBy: req.user.userId,
      });

      await newTemplate.save();

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_duplicated",
        targetType: "template",
        targetId: newTemplate._id,
        details: { originalId: id, originalName: originalTemplate.name },
      });

      res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Duplicate template error:", error);
      res.status(500).json({ error: "Failed to duplicate template" });
    }
  }
);

module.exports = router;
