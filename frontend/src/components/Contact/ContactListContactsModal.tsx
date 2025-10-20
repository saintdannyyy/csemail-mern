import React, { useState, useEffect } from "react";
import { X, Search, Plus, Minus, Users, Check } from "lucide-react";

interface Contact {
  id: string;
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags: string[];
  customFields: Record<string, string>;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  listIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface ContactList {
  _id: string;
  name: string;
  description?: string;
  contactCount: number;
}

interface ContactListContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactList: ContactList | null;
  onContactListUpdated?: () => void;
 
}

export const ContactListContactsModal: React.FC<ContactListContactsModalProps> = ({
  isOpen,
  onClose,
  contactList,
  onContactListUpdated,

}) => {
  const [contactsInList, setContactsInList] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [filteredContactsNotInList, setFilteredContactsNotInList] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contactList) {
      fetchContacts();
    }
  }, [isOpen, contactList]);

  useEffect(() => {
    // Filter contacts not in list based on search term
    if (allContacts.length > 0 && contactsInList.length >= 0) {
      const contactsNotInList = allContacts.filter(
        contact => !contactsInList.some(inListContact => inListContact.id === contact.id)
      );
      
      const filtered = contactsNotInList.filter(contact => {
        if (!searchTerm) return true;
        const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
        return (
          contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fullName.includes(searchTerm.toLowerCase())
        );
      });
      
      setFilteredContactsNotInList(filtered);
    }
  }, [allContacts, contactsInList, searchTerm]);

  const fetchContacts = async () => {
    if (!contactList) return;

    try {
      setLoading(true);
      const apiClient = (await import("../../utils/apiClient")).apiClient;
      
      // Fetch all contacts
      const allContactsResponse = await apiClient.getContacts(1, 1000);
      const mappedAllContacts = allContactsResponse.contacts?.map((contact: any) => ({
        ...contact,
        id: contact._id || contact.id,
        listIds: contact.lists?.map((list: any) => list._id || list.id || list) || contact.listIds || [],
      })) || [];
      
      setAllContacts(mappedAllContacts);
      
      // Filter contacts that are in this specific list
      const contactsInThisList = mappedAllContacts.filter((contact: Contact) => 
        contact.listIds.includes(contactList._id)
      );
      
      setContactsInList(contactsInThisList);
      
      
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const addContactToList = async (contactId: string) => {
    if (!contactList) return;

    try {
      setActionLoading(contactId);
      const apiClient = (await import("../../utils/apiClient")).apiClient;
      
      await apiClient.addContactToList(contactList._id, contactId);
      
      // Move contact from available to in-list
      const contactToMove = allContacts.find(c => c.id === contactId);
      if (contactToMove) {
        const updatedContact = {
          ...contactToMove,
          listIds: [...contactToMove.listIds, contactList._id]
        };
        
        setContactsInList(prev => [...prev, updatedContact]);
        setAllContacts(prev => 
          prev.map(c => c.id === contactId ? updatedContact : c)
        );
      }
      
      onContactListUpdated?.();
    } catch (error) {
      console.error("Failed to add contact to list:", error);
      alert("Failed to add contact to list. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const removeContactFromList = async (contactId: string) => {
    if (!contactList) return;

    try {
      setActionLoading(contactId);
      const apiClient = (await import("../../utils/apiClient")).apiClient;
      
      await apiClient.removeContactFromList(contactList._id, contactId);
      
      // Move contact from in-list to available
      const contactToMove = contactsInList.find(c => c.id === contactId);
      if (contactToMove) {
        const updatedContact = {
          ...contactToMove,
          listIds: contactToMove.listIds.filter(listId => listId !== contactList._id)
        };
        
        setContactsInList(prev => prev.filter(c => c.id !== contactId));
        setAllContacts(prev => 
          prev.map(c => c.id === contactId ? updatedContact : c)
        );
      }
      
      onContactListUpdated?.();
    } catch (error) {
      console.error("Failed to remove contact from list:", error);
      alert("Failed to remove contact from list. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const getContactDisplayName = (contact: Contact) => {
    const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    return name || contact.email;
  };

  if (!isOpen || !contactList) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Contacts - {contactList.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {contactsInList.length} contact{contactsInList.length !== 1 ? 's' : ''} in this list
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading contacts...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contacts in List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Check className="mr-2 text-green-500" size={20} />
                    Contacts in List ({contactsInList.length})
                  </h3>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contactsInList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={32} className="mx-auto mb-2 text-gray-400" />
                      No contacts in this list yet.
                    </div>
                  ) : (
                    contactsInList.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getContactDisplayName(contact)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {contact.email}
                          </p>
                        </div>
                        <button
                          onClick={() => removeContactFromList(contact.id)}
                          disabled={actionLoading === contact.id}
                          className="ml-2 p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Remove from list"
                        >
                          {actionLoading === contact.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Minus size={16} />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Available Contacts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Plus className="mr-2 text-blue-500" size={20} />
                    Available Contacts
                  </h3>
                </div>
                
                {/* Search */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredContactsNotInList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? (
                        <div>
                          <Search size={32} className="mx-auto mb-2 text-gray-400" />
                          No contacts found matching "{searchTerm}"
                        </div>
                      ) : (
                        <div>
                          <Users size={32} className="mx-auto mb-2 text-gray-400" />
                          All contacts are already in this list.
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredContactsNotInList.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getContactDisplayName(contact)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {contact.email}
                          </p>
                        </div>
                        <button
                          onClick={() => addContactToList(contact.id)}
                          disabled={actionLoading === contact.id}
                          className="ml-2 p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          title="Add to list"
                        >
                          {actionLoading === contact.id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus size={16} />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};