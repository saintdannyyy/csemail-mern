const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const ContactList = require("../models/ContactList");
const User = require("../models/User");
require("dotenv").config({ path: "../.env" });

async function seedContactLists() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find an admin user to use as creator
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.error("No admin user found. Create an admin user first.");
      process.exit(1);
    }

    // Create sample contact lists
    const contactLists = [
      {
        name: "Newsletter Subscribers",
        description: "General newsletter subscribers",
        createdBy: adminUser._id,
      },
      {
        name: "VIP Customers",
        description: "Premium customers and VIP members",
        createdBy: adminUser._id,
      },
      {
        name: "Product Updates",
        description: "Users interested in product announcements",
        createdBy: adminUser._id,
      },
      {
        name: "Marketing Campaigns",
        description: "Contacts for promotional campaigns",
        createdBy: adminUser._id,
      },
    ];

    // Check if contact lists already exist
    const existingLists = await ContactList.find();
    if (existingLists.length > 0) {
      console.log("Contact lists already exist. Skipping seeding.");
      return;
    }

    // Create contact lists
    const createdLists = await ContactList.insertMany(contactLists);
    console.log(`Created ${createdLists.length} contact lists`);

    // Get all existing contacts
    const contacts = await Contact.find();
    if (contacts.length === 0) {
      console.log("No contacts found to assign to lists");
      return;
    }

    // Assign existing contacts to the first list (Newsletter Subscribers)
    const newsletterList = createdLists[0];

    // Update contacts to include the newsletter list
    await Contact.updateMany({}, { $push: { lists: newsletterList._id } });

    // Update the contact count for the newsletter list
    await ContactList.findByIdAndUpdate(newsletterList._id, {
      contactCount: contacts.length,
    });

    console.log(
      `Assigned ${contacts.length} existing contacts to "${newsletterList.name}" list`
    );

    console.log("Contact list seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding contact lists:", error);
    process.exit(1);
  }
}

// Run the seeder
seedContactLists();
