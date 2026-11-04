import { business } from "./data/catalog";

/** wa.me link. Without a verified number, WhatsApp opens its contact picker with the message pre-filled. */
export function whatsappLink(message: string): string {
  const text = encodeURIComponent(message);
  return business.whatsappNumber ? `https://wa.me/${business.whatsappNumber}?text=${text}` : `https://wa.me/?text=${text}`;
}
