const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const Contact = require("../models/Contact");
const ContactList = require("../models/ContactList");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "server/uploads/" });

// Get all contacts
router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, search, status, listId } = req.query;
      const offset = (page - 1) * limit;

      let query = {};

      if (search) {
        query.$or = [
          { email: new RegExp(search, "i") },
          { firstName: new RegExp(search, "i") },
          { lastName: new RegExp(search, "i") },
        ];
      }

      if (status && status !== "all") {
        query.status = status;
      }

      if (listId) {
        query.lists = listId;
      }

      const contacts = await Contact.find(query)
        .populate("lists", "name")
        .skip(offset)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const count = await Contact.countDocuments(query);

      res.json({
        contacts: contacts || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  }
);

// Create contact
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const {
        email,
        firstName,
        lastName,
        tags = [],
        customFields = {},
        listIds = [],
      } = req.body;
      console.log("Request Body:", req.body);

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if contact already exists
      const existingContact = await Contact.findOne({
        email: email.toLowerCase(),
      });

      if (existingContact) {
        return res
          .status(409)
          .json({ error: "Contact with this email already exists" });
      }

      // Create contact
      const contact = new Contact({
        email: email.toLowerCase(),
        firstName,
        lastName,
        // tags,
        customFields,
        status: "active",
        // lists: listIds,
        createdBy: req.user._id,
      });

      await contact.save();
      console.log("Created Contact:", contact);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_created",
        targetType: "contact",
        targetId: contact._id,
      });

      res.status(201).json(contact);
    } catch (error) {
      console.error("Create contact error:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  }
);

// Update contact
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        email,
        firstName,
        lastName,
        tags = [],
        customFields = {},
        status,
        listIds = [],
      } = req.body;

      console.log("Update Contact Request:", { id, body: req.body });

      // Validate contact ID
      if (!id) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      // Find existing contact
      const existingContact = await Contact.findById(id);
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      // If email is being updated, check for duplicates
      if (email && email.toLowerCase() !== existingContact.email) {
        const emailExists = await Contact.findOne({
          email: email.toLowerCase(),
          _id: { $ne: id }
        });

        if (emailExists) {
          return res.status(409).json({ 
            error: "Contact with this email already exists" 
          });
        }
      }

      // Prepare update data
      const updateData = {
        ...(email && { email: email.toLowerCase() }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(tags && { tags }),
        ...(customFields && { customFields }),
        ...(status && { status }),
        ...(listIds && { lists: listIds }),
        updatedAt: new Date(),
        updatedBy: req.user._id,
      };

      // Update contact
      const updatedContact = await Contact.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, // Return updated document
          runValidators: true // Run schema validators
        }
      ).populate("lists", "name");

      console.log("Updated Contact:", updatedContact);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_updated",
        targetType: "contact",
        targetId: updatedContact._id,
        details: {
          changes: updateData,
          previousValues: {
            email: existingContact.email,
            firstName: existingContact.firstName,
            lastName: existingContact.lastName,
            status: existingContact.status,
          }
        }
      });

      res.json(updatedContact);
    } catch (error) {
      console.error("Update contact error:", error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationErrors 
        });
      }

      // Handle cast errors (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      res.status(500).json({ error: "Failed to update contact" });
    }
  }
);

// Delete contact
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Delete Contact Request:", { id });

      // Validate contact ID
      if (!id) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      // Find and delete contact
      const deletedContact = await Contact.findByIdAndDelete(id);
      
      if (!deletedContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      console.log("Deleted Contact:", deletedContact._id);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_deleted",
        targetType: "contact",
        targetId: deletedContact._id,
        details: {
          deletedContact: {
            email: deletedContact.email,
            firstName: deletedContact.firstName,
            lastName: deletedContact.lastName,
          }
        }
      });

      res.json({ 
        message: "Contact deleted successfully",
        deletedContact: {
          id: deletedContact._id,
          email: deletedContact.email,
          firstName: deletedContact.firstName,
          lastName: deletedContact.lastName,
        }
      });
    } catch (error) {
      console.error("Delete contact error:", error);
      
      // Handle cast errors (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      res.status(500).json({ error: "Failed to delete contact" });
    }
  }
);

// Get single contact
router.get(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Get Contact Request:", { id });

      // Validate contact ID
      if (!id) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      // Find contact
      const contact = await Contact.findById(id).populate("lists", "name");
      
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      console.error("Get contact error:", error);
      
      // Handle cast errors (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      res.status(500).json({ error: "Failed to fetch contact" });
    }
  }
);

// Import contacts from CSV/Excel
router.post(
  "/import",
  authenticateToken,
  requireRole(["admin", "editor"]),
  upload.single("file"),
  async (req, res) => {
    try {
      const { listId, mapping } = req.body;
      const file = req.file;
      // console.log("Uploaded File:", file);

      if (!file) {
        return res.status(400).json({ error: "File is required" });
      }

      const contacts = [];
      const errors = [];
      let processed = 0;
      let imported = 0;
      let skipped = 0;

      // Parse file based on extension
      if (file.originalname.endsWith(".csv")) {
        // Parse CSV
        const results = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on("data", (data) => results.push(data))
          .on("end", async () => {
            await processContacts(results);
          });
      } else if (
        file.originalname.endsWith(".xlsx") ||
        file.originalname.endsWith(".xls")
      ) {
        // Parse Excel
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const results = XLSX.utils.sheet_to_json(worksheet);
        await processContacts(results);
      } else {
        return res.status(400).json({ error: "Unsupported file format" });
      }

      async function processContacts(data) {
        const mappingObj = JSON.parse(mapping || "{}");

        for (const row of data) {
          processed++;

          try {
            const email = row[mappingObj.email || "email"];
            const firstName = row[mappingObj.firstName || "first_name"];
            const lastName = row[mappingObj.lastName || "last_name"];

            if (!email || !email.includes("@")) {
              errors.push(`Row ${processed}: Invalid email`);
              skipped++;
              continue;
            }

            // Check if contact exists
            const existingContact = await Contact.findOne({
              email: email.toLowerCase(),
            });

            if (existingContact) {
              skipped++;
              continue;
            }

            // Create contact
            const contact = new Contact({
              email: email.toLowerCase(),
              firstName,
              lastName,
              status: "active",
              customFields: row,
              lists: listId ? [listId] : [],
              createdBy: req.user.userId,
            });

            await contact.save();

            imported++;
          } catch (error) {
            errors.push(`Row ${processed}: ${error.message}`);
            skipped++;
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        // Log audit event
        await AuditLog.create({
          userId: req.user._id,
          action: "contacts_imported",
          targetType: "contact",
          details: { processed, imported, skipped, errors: errors.length },
        });

        res.json({
          message: "Import completed",
          summary: {
            processed,
            imported,
            skipped,
            errors: errors.length,
          },
          errors: errors.slice(0, 10), // Return first 10 errors
          importedCount: imported, // Add this for frontend compatibility
          totalCount: processed,
        });
      }
    } catch (error) {
      console.error("Import contacts error:", error);
      res.status(500).json({ error: "Failed to import contacts" });
    }
  }
);

// Get contact lists
router.get(
  "/lists",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const lists = await ContactList.find()
        .populate("contacts", "_id")
        .sort({ createdAt: -1 });

      // Add contact count to each list
      const listsWithCount = lists.map((list) => ({
        ...list.toObject(),
        contact_lists: [{ count: list.contacts.length }],
      }));

      res.json(listsWithCount || []);
    } catch (error) {
      console.error("Get lists error:", error);
      res.status(500).json({ error: "Failed to fetch lists" });
    }
  }
);

// Create contact list
router.post(
  "/lists",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "List name is required" });
      }

      // Create contact list
      router.post(
        "/lists",
        authenticateToken,
        requireRole(["admin", "editor"]),
        async (req, res) => {
          try {
            const { name, description } = req.body;

            if (!name) {
              return res.status(400).json({ error: "List name is required" });
            }

            const list = new ContactList({
              name,
              description,
              createdBy: req.user.userId,
            });

            await list.save();

            // Log audit event
            await AuditLog.create({
              userId: req.user.userId,
              action: "list_created",
              targetType: "list",
              targetId: list._id,
              details: { name, description },
            });

            res.status(201).json(list);
          } catch (error) {
            console.error("Create list error:", error);
            res.status(500).json({ error: "Failed to create list" });
          }
        }
      );
    } catch (error) {
      console.error("Create list error:", error);
      res.status(500).json({ error: "Failed to create list" });
    }
  }
);

// Export contacts
router.get(
  "/export",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { 
        format = 'csv', 
        fields = 'firstName,lastName,email,phone,company,position,tags,status,createdAt',
        filterType = 'all'
      } = req.query;

      console.log("Export Contacts Request:", { format, fields, filterType });

      // Parse fields
      const includeFields = fields.split(',').filter(field => field.trim());
      
      // Build query based on filterType
      let query = {};
      // For now, we'll export all contacts. In the future, you can add filter logic here
      
      // Fetch contacts
      const contacts = await Contact.find(query).sort({ createdAt: -1 });
      
      if (!contacts || contacts.length === 0) {
        return res.status(404).json({ error: "No contacts found" });
      }

      console.log(`Exporting ${contacts.length} contacts in ${format} format`);

      // Map contacts to include only requested fields
      const mappedContacts = contacts.map(contact => {
        const contactObj = {};
        
        includeFields.forEach(field => {
          switch (field.trim()) {
            case 'firstName':
              contactObj['First Name'] = contact.firstName || '';
              break;
            case 'lastName':
              contactObj['Last Name'] = contact.lastName || '';
              break;
            case 'email':
              contactObj['Email'] = contact.email || '';
              break;
            case 'phone':
              contactObj['Phone'] = contact.phone || '';
              break;
            case 'company':
              contactObj['Company'] = contact.customFields?.company || '';
              break;
            case 'position':
              contactObj['Position'] = contact.customFields?.position || '';
              break;
            case 'tags':
              contactObj['Tags'] = contact.tags ? contact.tags.join(', ') : '';
              break;
            case 'status':
              contactObj['Status'] = contact.status || '';
              break;
            case 'createdAt':
              contactObj['Date Added'] = contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '';
              break;
            case 'lastActivity':
              contactObj['Last Activity'] = contact.lastActivity ? new Date(contact.lastActivity).toLocaleDateString() : '';
              break;
          }
        });
        
        return contactObj;
      });

      // Generate export based on format
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=contacts_${Date.now()}.json`);
        return res.json(mappedContacts);
      } 
      else if (format === 'csv') {
        // Generate CSV
        const csv = require('csv-parser');
        let csvContent = '';
        
        // Headers
        if (mappedContacts.length > 0) {
          csvContent = Object.keys(mappedContacts[0]).join(',') + '\n';
          
          // Data rows
          mappedContacts.forEach(contact => {
            const row = Object.values(contact).map(value => {
              // Escape commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',');
            csvContent += row + '\n';
          });
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=contacts_${Date.now()}.csv`);
        return res.send(csvContent);
      }
      else if (format === 'xlsx') {
        const XLSX = require('xlsx');
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(mappedContacts);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
        
        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=contacts_${Date.now()}.xlsx`);
        return res.send(excelBuffer);
      }
      else {
        return res.status(400).json({ error: "Unsupported export format" });
      }

    } catch (error) {
      console.error("Export contacts error:", error);
      res.status(500).json({ error: "Failed to export contacts" });
    }
  }
);

module.exports = router;
