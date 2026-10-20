/**
 * Who sells on aethex.in, and the store's service promises. Shown on product
 * pages, at checkout, on the policy pages, in order emails and in the footer,
 * and used by the Worker. Fill in every empty field before launch: the store
 * admin (aethex.in/admin) lists what is still missing. Empty fields are simply
 * left off the pages, never shown as blanks.
 */
export interface Business {
  brand: string; legalName: string; address: string; gstin: string; cin: string;
  email: string; phone: string; hours: string;
  grievance: { name: string; designation: string; email: string; phone: string };
  dispatch: string; delivery: string; replacementDays: number;
}

export const BUSINESS: Business = {
  /** The store's name on pages and emails. */
  brand: "Aethex",
  /** The company that sells and invoices (as registered). */
  legalName: "Clavix Technologies Private Limited",
  /** Registered office address, as on the GST certificate. */
  address: "",
  /** GSTIN. When set, pages say a GST invoice comes with every order. */
  gstin: "",
  /** Corporate Identification Number. */
  cin: "",
  /** Customer care. */
  email: "support@aethex.in",
  phone: "",
  hours: "",
  /** Grievance Officer (Consumer Protection (E-Commerce) Rules, 2020, rule 4). */
  grievance: { name: "", designation: "Grievance Officer", email: "support@aethex.in", phone: "" },
  /** Service promises shown on product pages and the shipping policy. */
  dispatch: "within 2 business days of confirmation",
  delivery: "usually 3 to 7 business days after dispatch, depending on your PIN code",
  /** Days after delivery to report a damaged, defective or wrong item. */
  replacementDays: 7,
};

export const SITE_URL = "https://aethex.in";

/** What is still missing before launch (shown in the store admin). */
export function launchGaps(): string[] {
  const gaps: string[] = [];
  if (!BUSINESS.address) gaps.push("Registered office address (src/config/business.ts: address)");
  if (!BUSINESS.gstin) gaps.push("GSTIN (src/config/business.ts: gstin)");
  if (!BUSINESS.phone) gaps.push("Customer care phone number (src/config/business.ts: phone)");
  if (!BUSINESS.grievance.name) gaps.push("Grievance Officer's name (src/config/business.ts: grievance.name)");
  if (!BUSINESS.grievance.phone) gaps.push("Grievance Officer's phone (src/config/business.ts: grievance.phone)");
  return gaps;
}
