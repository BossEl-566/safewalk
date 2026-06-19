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
  addContact: (contact: ContactInput) => void;
  deleteContact: (contactId: string) => void;
  clearContacts: () => void;
};

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: (contact) => {
        const newContact: EmergencyContact = {
          id: Date.now().toString(),
          name: contact.name.trim(),
          phone: contact.phone.trim(),
          relationship: contact.relationship.trim(),
          priority: get().contacts.length + 1,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          contacts: [newContact, ...state.contacts],
        }));
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