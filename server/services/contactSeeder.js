const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const ContactList = require("../models/ContactList");
const User = require("../models/User");
require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

async function seedContacts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get a user for createdBy field
    const user = await User.findOne({});
    if (!user) {
      console.log("No users found. Please create a user first.");
      process.exit(1);
    }
    console.log("Using user:", user.email);

    // Get existing contact lists
    const contactLists = await ContactList.find({});
    if (contactLists.length === 0) {
      console.log(
        "No contact lists found. Please run contactListSeeder first."
      );
      process.exit(1);
    }

    console.log(
      "Found contact lists:",
      contactLists.map((list) => list.name)
    );

    // Sample contacts to add
    const sampleContacts = [
      {
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        status: "active",
        lists: [contactLists[0]._id], // Newsletter Subscribers
        createdBy: user._id,
      },
      {
        email: "jane.smith@example.com",
        firstName: "Jane",
        lastName: "Smith",
        status: "active",
        lists: [contactLists[0]._id, contactLists[1]._id], // Newsletter + VIP
        createdBy: user._id,
      },
      {
        email: "bob.wilson@example.com",
        firstName: "Bob",
        lastName: "Wilson",
        status: "active",
        lists: [contactLists[0]._id], // Newsletter Subscribers
        createdBy: user._id,
      },
      {
        email: "alice.brown@example.com",
        firstName: "Alice",
        lastName: "Brown",
        status: "active",
        lists: [contactLists[1]._id, contactLists[2]._id], // VIP + Product Updates
        createdBy: user._id,
      },
      {
        email: "charlie.davis@example.com",
        firstName: "Charlie",
        lastName: "Davis",
        status: "active",
        lists: [contactLists[2]._id, contactLists[3]._id], // Product Updates + Marketing
        createdBy: user._id,
      },
    ];

    // Clear existing contacts (except the real one)
    await Contact.deleteMany({
      email: { $ne: "danieltesla746@gmail.com" },
    });

    // Add sample contacts
    const createdContacts = await Contact.insertMany(sampleContacts);
    console.log(`Created ${createdContacts.length} sample contacts`);

    // Update contact list counts
    for (const list of contactLists) {
      const count = await Contact.countDocuments({
        lists: list._id,
        status: "active",
      });

      await ContactList.findByIdAndUpdate(list._id, {
        contactCount: count,
      });

      console.log(`Updated ${list.name}: ${count} contacts`);
    }

    console.log("Contact seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding contacts:", error);
    process.exit(1);
  }
}

seedContacts();
