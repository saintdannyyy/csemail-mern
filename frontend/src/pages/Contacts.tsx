import React, { useState, useEffect } from "react";
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
} from "lucide-react";
import { Contact } from "../types";
import { ContactFormDialog } from "../components/Contact/ContactFormDialog";
import { ImportContactsModal } from "../components/Contact/ImportContactsModal";
import { DeleteContactModal } from "../components/Contact/DeleteContactModal";
import { ExportContactsModal, ExportOptions } from "../components/Contact/ExportContactsModal";

export const Contacts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    contactId: string;
    contactName: string;
  }>({ isOpen: false, contactId: "", contactName: "" });
  const [exportModal, setExportModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState<{ open: boolean; contactId: string }>({ open: false, contactId: '' });

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const response = await (
          await import("../utils/apiClient")
        ).apiClient.getContacts(1, 100);
        // response.contacts is array, response.pagination is object
        const mappedContacts =
          response && response.contacts
            ? response.contacts.map((contact: any) => ({
                ...contact,
                id: contact._id || contact.id,
                listIds: contact.lists || contact.listIds || [],
              }))
            : [];
        setContacts(mappedContacts);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const handleSaveContact = async (
    contactData: Omit<Contact, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const apiClient = (await import("../utils/apiClient")).apiClient;
      console.log("Contact Data:", contactData);
      const newContact = await apiClient.createContact(contactData);
      const mappedNewContact = {
        ...newContact,
        id: newContact._id || newContact.id,
        listIds: newContact.lists || newContact.listIds || [],
      };
      setContacts((prev) => [...prev, mappedNewContact]);
      setAddContactOpen(false); // Close the add dialog
    } catch (error) {
      console.error("Failed to create contact:", error);
      alert("Failed to create contact. Please try again.");
    }
  };

  const handleEditContact = async (
    contactData: Omit<Contact, "id" | "createdAt" | "updatedAt">,
    contactId: string
  ) => {
    try {
      const apiClient = (await import("../utils/apiClient")).apiClient;
      const updatedContact = await apiClient.updateContact(
        contactId,
        contactData
      );
      const mappedUpdatedContact = {
        ...updatedContact,
        id: updatedContact._id || updatedContact.id,
        listIds: updatedContact.lists || updatedContact.listIds || [],
      };
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? mappedUpdatedContact : c))
      );
      setEditContactOpen({ open: false, contactId: '' }); // Close the edit dialog
    } catch (error) {
      console.error("Failed to update contact:", error);
      alert("Failed to update contact. Please try again.");
    }
  };

  const openDeleteModal = (contactId: string, contactName: string) => {
    setDeleteModal({ isOpen: true, contactId, contactName });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, contactId: "", contactName: "" });
  };

  const handleDeleteContact = async () => {
    try {
      const apiClient = (await import("../utils/apiClient")).apiClient;
      await apiClient.deleteContact(deleteModal.contactId);
      
      // Remove contact from state
      setContacts((prev) => prev.filter((c) => c.id !== deleteModal.contactId));
      
      console.log(`Successfully deleted contact: ${deleteModal.contactName}`);
    } catch (error) {
      console.error("Failed to delete contact:", error);
      alert("Failed to delete contact. Please try again.");
      throw error; // Re-throw to let modal handle the error state
    }
  };

  const openExportModal = () => {
    setExportModal({ isOpen: true });
  };

  const closeExportModal = () => {
    setExportModal({ isOpen: false });
  };

  const handleExportContacts = async (options: ExportOptions) => {
    try {
      const apiClient = (await import("../utils/apiClient")).apiClient;
      const blob = await apiClient.exportContacts(options);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `contacts_${timestamp}.${options.format}`;
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log(`Successfully exported contacts as ${options.format}`);
    } catch (error) {
      console.error("Failed to export contacts:", error);
      alert("Failed to export contacts. Please try again.");
      throw error;
    }
  };

  const handleImportContacts = async (file: File) => {
    try {
      const apiClient = (await import("../utils/apiClient")).apiClient;

      // Create FormData to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Use the correct method name: importContacts (not importContact)
      const result = await apiClient.importContacts(formData);

      // Refresh the contacts list
      const updatedResponse = await apiClient.getContacts(1, 100);
      const mappedUpdatedContacts =
        updatedResponse && updatedResponse.contacts
          ? updatedResponse.contacts.map((contact: any) => ({
              ...contact,
              id: contact._id || contact.id,
              listIds: contact.lists || contact.listIds || [],
            }))
          : [];
      setContacts(mappedUpdatedContacts);

      console.log(`Successfully imported ${result.importedCount} contacts`);

      // Return the result so the modal can access it
      return result;
    } catch (error) {
      console.error("Failed to import contacts:", error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${contact.firstName} ${contact.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" || contact.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: Contact["status"]) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      unsubscribed: "bg-yellow-100 text-yellow-800",
      bounced: "bg-red-100 text-red-800",
      complained: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your email contacts and lists
            </p>
          </div>
          <div className="flex space-x-3">
            <ImportContactsModal
              onImport={handleImportContacts}
              trigger={
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </button>
              }
            />
            <button 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={openExportModal}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <ContactFormDialog
              onSave={handleSaveContact}
              open={addContactOpen}
              onOpenChange={setAddContactOpen}
              trigger={
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </button>
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
                <option value="complained">Complained</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {loading
                ? "Loading..."
                : `${filteredContacts.length} of ${contacts.length} contacts`}
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Loading contacts...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.customFields.company || "-"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.customFields.position || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-xs">
                        {/* First row - up to 3 tags */}
                        <div className="flex flex-wrap gap-1 mb-1">
                          {contact.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {/* Second row - remaining tags */}
                        {contact.tags.length > 3 && (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(3).map((tag, index) => (
                              <span
                                key={index + 3}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contact.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <ContactFormDialog
                          contact={contact}
                          open={editContactOpen.open && editContactOpen.contactId === contact.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setEditContactOpen({ open: true, contactId: contact.id });
                            } else {
                              setEditContactOpen({ open: false, contactId: '' });
                            }
                          }}
                          onSave={(data) => {
                            console.log("Editing contact:", contact);
                            console.log("Contact ID:", contact.id);
                            handleEditContact(data, contact.id);
                          }}
                          trigger={
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="h-4 w-4" />
                            </button>
                          }
                        />
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => openDeleteModal(contact.id, `${contact.firstName} ${contact.lastName}`)}
                          title="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Contact Modal */}
      <DeleteContactModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteContact}
        contactName={deleteModal.contactName}
      />

      {/* Export Contacts Modal */}
      <ExportContactsModal
        isOpen={exportModal.isOpen}
        onClose={closeExportModal}
        onExport={handleExportContacts}
        totalContacts={contacts.length}
        filteredContacts={filteredContacts.length !== contacts.length ? filteredContacts.length : undefined}
      />
    </div>
  );
};
