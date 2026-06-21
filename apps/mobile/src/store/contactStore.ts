import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { EmergencyContact } from "../types/contact";

type ContactInput = {
  name: string;
  phone: string;
  relationship: string;
};

type ContactStore = {
  contacts: EmergencyContact[];
  setContacts: (contacts: EmergencyContact[]) => void;
  addContact: (contact: ContactInput) => string;
  deleteContact: (contactId: string) => void;
  clearContacts: () => void;
};

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],

      setContacts: (contacts) => {
        set({ contacts });
      },

      addContact: (contact) => {
        const id = Date.now().toString();

        const newContact: EmergencyContact = {
          id,
          name: contact.name.trim(),
          phone: contact.phone.trim(),
          relationship: contact.relationship.trim(),
          priority: get().contacts.length + 1,
          isPrimary: get().contacts.length === 0,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          contacts: [newContact, ...state.contacts],
        }));

        return id;
      },

      deleteContact: (contactId) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== contactId),
        }));
      },

      clearContacts: () => {
        set({ contacts: [] });
      },
    }),
    {
      name: "safewalk-emergency-contacts",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);