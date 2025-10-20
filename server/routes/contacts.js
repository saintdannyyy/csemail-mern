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

// Add this helper function at the top of the file after the imports
async function updateListContactCount(listId) {
  try {
    const count = await Contact.countDocuments({ lists: listId });
    await ContactList.findByIdAndUpdate(listId, { contactCount: count });
    console.log(`Updated contact count for list ${listId}: ${count}`);
    return count;
  } catch (error) {
    console.error(`Failed to update contact count for list ${listId}:`, error);
    throw error;
  }
}

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
        phone,
        tags = [],
        customFields = {},
        listIds = [],
      } = req.body;

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

      // Parse tags if they come as a string
      let parsedTags = [];
      if (tags) {
        if (typeof tags === "string") {
          try {
            parsedTags = JSON.parse(tags);
          } catch (e) {
            // If parsing fails, treat as comma-separated string
            parsedTags = tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag);
          }
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        }
      }

      // Create contact
      const contact = new Contact({
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone,
        tags: [
          "order",
          "confirmation",
          "receipt",
          "newsletter",
          "promotion",
          "ecommerce",
        ],
        customFields,
        status: "active",
        lists: listIds,
        createdBy: req.user._id,
      });

      await contact.save();

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
        phone,
        tags = [],
        customFields = {},
        status,
        listIds = [],
      } = req.body;

      // Validate contact ID
      if (!id) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      // Find existing contact
      const existingContact = await Contact.findById(id);
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      // Store old list IDs for comparison
      const oldListIds = existingContact.lists.map(id => id.toString());

      // If email is being updated, check for duplicates
      if (email && email.toLowerCase() !== existingContact.email) {
        const emailExists = await Contact.findOne({
          email: email.toLowerCase(),
          _id: { $ne: id },
        });

        if (emailExists) {
          return res.status(409).json({
            error: "Contact with this email already exists",
          });
        }
      }

      // Parse tags if they come as a string
      let parsedTags = tags;
      if (tags) {
        if (typeof tags === "string") {
          try {
            parsedTags = JSON.parse(tags);
          } catch (e) {
            // If parsing fails, treat as comma-separated string
            parsedTags = tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag);
          }
        }
      }

      // Prepare update data
      const updateData = {
        ...(email && { email: email.toLowerCase() }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(tags !== undefined && { tags: parsedTags }),
        ...(customFields && { customFields }),
        ...(status && { status }),
        ...(listIds && { lists: listIds }),
        updatedAt: new Date(),
        updatedBy: req.user._id,
      };

      // Update contact
      const updatedContact = await Contact.findByIdAndUpdate(id, updateData, {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }).populate("lists", "name");

      // Update contact counts for affected lists if lists were changed
      if (listIds && JSON.stringify(oldListIds.sort()) !== JSON.stringify(listIds.sort())) {
        const allAffectedLists = [...new Set([...oldListIds, ...listIds])];
        
        // Update counts for all affected lists
        for (const listId of allAffectedLists) {
          await updateListContactCount(listId);
        }
        
        console.log(`Updated contact counts for lists: ${allAffectedLists.join(', ')}`);
      }

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
            lists: oldListIds,
          },
        },
      });

      res.json(updatedContact);
    } catch (error) {
      console.error("Update contact error:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          error: "Validation failed",
          details: validationErrors,
        });
      }

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
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

      // Find contact first to get list IDs
      const contactToDelete = await Contact.findById(id);

      if (!contactToDelete) {
        return res.status(404).json({ error: "Contact not found" });
      }

      // Store list IDs before deletion
      const listIds = contactToDelete.lists.map(id => id.toString());

      // Delete the contact
      const deletedContact = await Contact.findByIdAndDelete(id);

      // Update contact counts for all lists this contact was in
      for (const listId of listIds) {
        await updateListContactCount(listId);
      }

      console.log(`Deleted Contact: ${deletedContact._id}, updated counts for lists: ${listIds.join(', ')}`);

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
          },
          affectedLists: listIds,
        },
      });

      res.json({
        message: "Contact deleted successfully",
        deletedContact: {
          id: deletedContact._id,
          email: deletedContact.email,
          firstName: deletedContact.firstName,
          lastName: deletedContact.lastName,
        },
      });
    } catch (error) {
      console.error("Delete contact error:", error);

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      res.status(500).json({ error: "Failed to delete contact" });
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
      console.log("GET /api/contacts/lists - Fetching contact lists");

      const lists = await ContactList.find().sort({ createdAt: -1 });

      console.log(`Found ${lists.length} contact lists`);

      // Format the response
      const formattedLists = lists.map((list) => ({
        _id: list._id,
        name: list.name,
        description: list.description,
        contactCount: list.contactCount || 0,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      }));

      res.json({ lists: formattedLists });
    } catch (error) {
      console.error("Get lists error:", error);
      res.status(500).json({ error: "Failed to fetch lists" });
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
      if (error.name === "CastError") {
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
        console.log("file is csv");
        const results = [];

        await new Promise((resolve, reject) => {
          fs.createReadStream(file.path)
            .pipe(csv())
            .on("data", (data) => {
              console.log("CSV Row:", data);
              results.push(data);
            })
            .on("end", () => {
              console.log("CSV parsing completed, total rows:", results.length);
              resolve();
            })
            .on("error", reject);
        });

        await processContacts(results);
      } else if (
        file.originalname.endsWith(".xlsx") ||
        file.originalname.endsWith(".xls")
      ) {
        // Parse Excel
        console.log("file is excel");
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
            // Extract fields with proper fallbacks
            const email =
              row[mappingObj.email || "email"] || row["Email"] || row["EMAIL"];
            let firstName =
              row[mappingObj.firstName || "firstName"] ||
              row["First Name"] ||
              row["first_name"] ||
              row["FIRST_NAME"];
            let lastName =
              row[mappingObj.lastName || "lastName"] ||
              row["Last Name"] ||
              row["last_name"] ||
              row["LAST_NAME"];
            const company =
              row[mappingObj.company || "company"] ||
              row["Company"] ||
              row["COMPANY"];
            const position =
              row[mappingObj.position || "position"] ||
              row["Position"] ||
              row["POSITION"];

            // Validate email
            if (!email || !email.includes("@")) {
              errors.push(`Row ${processed}: Invalid or missing email`);
              skipped++;
              continue;
            }

            // Handle missing required fields
            if (!firstName) {
              firstName = "Unknown";
            }
            if (!lastName) {
              lastName = "Contact";
            }

            console.log("Processing email:", email);

            // Check if contact exists
            const existingContact = await Contact.findOne({
              email: email.toLowerCase(),
            });

            if (existingContact) {
              console.log("Contact already exists, skipping:", email);
              skipped++;
              continue; // Add continue to skip to next iteration
            }

            // Create contact
            const contact = new Contact({
              email: email.toLowerCase(),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              status: "active",
              lists: listId ? [listId] : [],
              customFields: {
                ...(company && { company: company.trim() }),
                ...(position && { position: position.trim() }),
              },
              createdBy: req.user._id,
            });

            const savedContact = await contact.save();

            if (savedContact) {
              console.log("Successfully imported contact:", savedContact.email);
              imported++; // Increment the imported counter
            } else {
              console.log("Failed to save contact:", email);
              errors.push(`Row ${processed}: Failed to save contact`);
              skipped++;
            }
          } catch (error) {
            console.error(`Error processing row ${processed}:`, error.message);
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

// Create contact list
router.post(
  "/lists",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      console.log("Creating contact list");
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "List name is required" });
      }

      const list = new ContactList({
        name,
        description,
        createdBy: req.user._id,
        contactCount: 0,
      });

      await list.save();

      console.log("Contact list created:", list._id);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
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

// Update contactList
router.put(
  "/lists/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      // console.log("Request Body:", req.body);

      console.log("Update ContactList Request:", { id, body: req.body });

      // Validate contactList ID
      if (!id) {
        return res.status(400).json({ error: "ContactList ID is required" });
      }

      // Find existing contactList
      const existingContactList = await ContactList.findById(id);
      if (!existingContactList) {
        return res.status(404).json({ error: "ContactList not found" });
      }

      // If name is being updated, check for duplicates
      if (name && name.toLowerCase() !== existingContactList.name) {
        const nameExists = await ContactList.findOne({
          name: name.toLowerCase(),
          _id: { $ne: id },
        });

        if (nameExists) {
          return res.status(409).json({
            error: "ContactList with this name already exists",
          });
        }
      }

      // Prepare update data
      const updateData = {
        ...(name && { name: name.toLowerCase() }),
        ...(description !== undefined && { description }),

        updatedAt: new Date(),
        updatedBy: req.user._id,
      };

      // Update contactList
      const updatedContactList = await ContactList.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true, // Return updated document
          runValidators: true, // Run schema validators
        }
      ).populate("name", "description");

      // console.log("Updated ContactList:", updatedContactList);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contactList_updated",
        targetType: "contactList",
        targetId: updatedContactList._id,
        details: {
          changes: updateData,
          previousValues: {
            name: existingContactList.name,
            description: existingContactList.description,
            createdAt: existingContactList.createdAt,
            updatedAt: existingContactList.updatedAt,
          },
        },
      });

      res.json(updatedContactList);
    } catch (error) {
      console.error("Update contactList error:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          error: "Validation failed",
          details: validationErrors,
        });
      }

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      res.status(500).json({ error: "Failed to update contactList" });
    }
  }
);

// Delete contact List
router.delete(
  "/lists/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Delete ContactList Request:", { id });

      // Validate contactList ID
      if (!id) {
        return res.status(400).json({ error: "ContactList ID is required" });
      }

      // Find and delete contactList
      const deletedContactList = await ContactList.findByIdAndDelete(id);

      if (!deletedContactList) {
        return res.status(404).json({ error: "ContactList not found" });
      }

      console.log("Deleted ContactList:", deletedContactList._id);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contactList_deleted",
        targetType: "contactList",
        targetId: deletedContactList._id,
        details: {
          deletedContactList: {
            name: deletedContactList.name,
            description: deletedContactList.description,
            createdAt: deletedContactList.createdAt,
            updatedAt: deletedContactList.updatedAt,
          },
        },
      });

      res.json({
        message: "ContactList deleted successfully",
        deletedContactList: {
          id: deletedContactList._id,
          name: deletedContactList.name,
          description: deletedContactList.description,
        },
      });
    } catch (error) {
      console.error("Delete contactList error:", error);

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid contactList ID format" });
      }

      res.status(500).json({ error: "Failed to delete contactList" });
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
        format = "csv",
        fields = "firstName,lastName,email,phone,company,position,tags,status,createdAt",
        filterType = "all",
      } = req.query;

      console.log("Export Contacts Request:", { format, fields, filterType });

      // Parse fields
      const includeFields = fields.split(",").filter((field) => field.trim());

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
      const mappedContacts = contacts.map((contact) => {
        const contactObj = {};

        includeFields.forEach((field) => {
          switch (field.trim()) {
            case "firstName":
              contactObj["First Name"] = contact.firstName || "";
              break;
            case "lastName":
              contactObj["Last Name"] = contact.lastName || "";
              break;
            case "email":
              contactObj["Email"] = contact.email || "";
              break;
            case "phone":
              contactObj["Phone"] = contact.phone || "";
              break;
            case "company":
              contactObj["Company"] = contact.customFields?.company || "";
              break;
            case "position":
              contactObj["Position"] = contact.customFields?.position || "";
              break;
            case "tags":
              contactObj["Tags"] = contact.tags ? contact.tags.join(", ") : "";
              break;
            case "status":
              contactObj["Status"] = contact.status || "";
              break;
            case "createdAt":
              contactObj["Date Added"] = contact.createdAt
                ? new Date(contact.createdAt).toLocaleDateString()
                : "";
              break;
            case "lastActivity":
              contactObj["Last Activity"] = contact.lastActivity
                ? new Date(contact.lastActivity).toLocaleDateString()
                : "";
              break;
          }
        });

        return contactObj;
      });

      // Generate export based on format
      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contacts_${Date.now()}.json`
        );
        return res.json(mappedContacts);
      } else if (format === "csv") {
        // Generate CSV
        const csv = require("csv-parser");
        let csvContent = "";

        // Headers
        if (mappedContacts.length > 0) {
          csvContent = Object.keys(mappedContacts[0]).join(",") + "\n";

          // Data rows
          mappedContacts.forEach((contact) => {
            const row = Object.values(contact)
              .map((value) => {
                // Escape commas and quotes in CSV
                if (
                  typeof value === "string" &&
                  (value.includes(",") || value.includes('"'))
                ) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              })
              .join(",");
            csvContent += row + "\n";
          });
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contacts_${Date.now()}.csv`
        );
        return res.send(csvContent);
      } else if (format === "xlsx") {
        const XLSX = require("xlsx");

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(mappedContacts);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contacts_${Date.now()}.xlsx`
        );
        return res.send(excelBuffer);
      } else {
        return res.status(400).json({ error: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Export contacts error:", error);
      res.status(500).json({ error: "Failed to export contacts" });
    }
  }
);

// Update the "Add contact to list" route
router.post(
  "/lists/:listId/contacts/:contactId",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { listId, contactId } = req.params;

      console.log("Add Contact to List Request:", { listId, contactId });

      // Validate parameters
      if (!listId || !contactId) {
        return res
          .status(400)
          .json({ error: "List ID and Contact ID are required" });
      }

      // Find the contact and list
      const contact = await Contact.findById(contactId);
      const contactList = await ContactList.findById(listId);

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      if (!contactList) {
        return res.status(404).json({ error: "Contact list not found" });
      }

      // Check if contact is already in the list
      if (contact.lists.includes(listId)) {
        return res
          .status(409)
          .json({ error: "Contact is already in this list" });
      }

      // Add contact to list
      contact.lists.push(listId);
      await contact.save();

      // Update the contact count for the list
      const newContactCount = await updateListContactCount(listId);

      console.log(`Added contact ${contactId} to list ${listId}. New count: ${newContactCount}`);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_added_to_list",
        targetType: "contact",
        targetId: contact._id,
        details: {
          listId,
          listName: contactList.name,
          contactEmail: contact.email,
          newContactCount
        }
      });

      res.json({
        message: "Contact added to list successfully",
        contact: contact,
        list: {
          ...contactList.toObject(),
          contactCount: newContactCount
        }
      });
    } catch (error) {
      console.error("Add contact to list error:", error);

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      res.status(500).json({ error: "Failed to add contact to list" });
    }
  }
);

// Update the "Remove contact from list" route
router.delete(
  "/lists/:listId/contacts/:contactId",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { listId, contactId } = req.params;

      console.log("Remove Contact from List Request:", { listId, contactId });

      // Validate parameters
      if (!listId || !contactId) {
        return res
          .status(400)
          .json({ error: "List ID and Contact ID are required" });
      }

      // Find the contact and list
      const contact = await Contact.findById(contactId);
      const contactList = await ContactList.findById(listId);

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      if (!contactList) {
        return res.status(404).json({ error: "Contact list not found" });
      }

      // Check if contact is in the list
      if (!contact.lists.includes(listId)) {
        return res.status(409).json({ error: "Contact is not in this list" });
      }

      // Remove contact from list
      contact.lists = contact.lists.filter((id) => id.toString() !== listId);
      await contact.save();

      // Update the contact count for the list
      const newContactCount = await updateListContactCount(listId);

      console.log(`Removed contact ${contactId} from list ${listId}. New count: ${newContactCount}`);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_removed_from_list",
        targetType: "contact",
        targetId: contact._id,
        details: {
          listId,
          listName: contactList.name,
          contactEmail: contact.email,
          newContactCount
        }
      });

      res.json({
        message: "Contact removed from list successfully",
        contact: contact,
        list: {
          ...contactList.toObject(),
          contactCount: newContactCount
        }
      });
    } catch (error) {
      console.error("Remove contact from list error:", error);

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      res.status(500).json({ error: "Failed to remove contact from list" });
    }
  }
);

// Get contacts in a specific list
router.get(
  "/lists/:listId/contacts",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { listId } = req.params;
      const { page = 1, limit = 100 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      console.log("Get Contacts in List Request:", { listId, page, limit });

      // Validate list ID
      if (!listId) {
        return res.status(400).json({ error: "List ID is required" });
      }

      // Check if list exists
      const contactList = await ContactList.findById(listId);
      if (!contactList) {
        return res.status(404).json({ error: "Contact list not found" });
      }

      // Find contacts that have this listId in their lists array
      const contacts = await Contact.find({ 
        lists: listId 
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

      const total = await Contact.countDocuments({ lists: listId });

      // Update the contact count in the list if it's different
      if (contactList.contactCount !== total) {
        await ContactList.findByIdAndUpdate(listId, { contactCount: total });
        console.log(`Updated contact count for list ${listId} from ${contactList.contactCount} to ${total}`);
      }

      res.json({
        contacts,
        list: {
          _id: contactList._id,
          name: contactList.name,
          description: contactList.description,
          contactCount: total
        },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get contacts in list error:', error);
      
      // Handle cast errors (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({ error: "Invalid list ID format" });
      }

      res.status(500).json({ error: 'Failed to fetch contacts in list' });
    }
  }
);

// Utility route to recalculate all contact list counts
router.post(
  "/lists/recalculate-counts",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      console.log("Recalculating all contact list counts...");

      const lists = await ContactList.find();
      const results = [];

      for (const list of lists) {
        const oldCount = list.contactCount;
        const newCount = await updateListContactCount(list._id);
        
        results.push({
          listId: list._id,
          listName: list.name,
          oldCount,
          newCount,
          changed: oldCount !== newCount
        });
      }

      console.log("Contact count recalculation completed");

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_counts_recalculated",
        targetType: "system",
        details: {
          listsProcessed: results.length,
          changedCounts: results.filter(r => r.changed).length
        }
      });

      res.json({
        message: "Contact counts recalculated successfully",
        results,
        summary: {
          totalLists: results.length,
          listsUpdated: results.filter(r => r.changed).length
        }
      });
    } catch (error) {
      console.error("Recalculate contact counts error:", error);
      res.status(500).json({ error: "Failed to recalculate contact counts" });
    }
  }
);

module.exports = router;
