import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from "expo-contacts";
import * as SecureStore from "expo-secure-store";
import { matchContactReviewers } from "./api";

const CONSENT_KEY = "localio_contacts_consent";
const MATCHES_KEY = "localio_contact_reviewer_ids";

export type ContactConsent = "accepted" | "declined";

export class ContactsPermissionError extends Error {
  constructor(readonly canAskAgain: boolean) {
    super(
      canAskAgain
        ? "Contacts access wasn't granted. Allow access to find reviews from your contacts."
        : "Contacts access is turned off for Localio. Enable it in your device settings to find contact reviews.",
    );
    this.name = "ContactsPermissionError";
  }
}

export async function getContactConsent(): Promise<ContactConsent | null> {
  const value = await SecureStore.getItemAsync(CONSENT_KEY);
  return value === "accepted" || value === "declined" ? value : null;
}

export async function saveContactConsent(consent: ContactConsent): Promise<void> {
  await SecureStore.setItemAsync(CONSENT_KEY, consent);
}

export async function getCachedContactReviewerIds(): Promise<number[] | null> {
  const value = await SecureStore.getItemAsync(MATCHES_KEY);
  if (value === null) return null;
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every((id) => Number.isInteger(id) && id > 0)) {
    throw new Error("Saved contact matches are invalid. Refresh contact matches to continue.");
  }
  return parsed as number[];
}

export async function findContactReviewers(): Promise<number[]> {
  let permission = await getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await requestPermissionsAsync();
  }
  if (!permission.granted) throw new ContactsPermissionError(permission.canAskAgain);

  const contacts = await Contact.getAllDetails([ContactField.PHONES]);
  const phoneNumbers = Array.from(
    new Set(
      contacts.flatMap((contact) =>
        (contact.phones ?? [])
          .map((phone) => phone.number?.replace(/\D/g, "") ?? "")
          .filter((number) => number.length >= 7 && number.length <= 15),
      ),
    ),
  ).slice(0, 1000);

  const reviewerIds = phoneNumbers.length ? await matchContactReviewers(phoneNumbers) : [];
  await SecureStore.setItemAsync(MATCHES_KEY, JSON.stringify(reviewerIds));
  return reviewerIds;
}
