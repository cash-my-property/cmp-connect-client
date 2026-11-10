// Listing ke compliance documents — kaunse chahiye yeh backend rules batate hain
// (GET /listings/options → rules[purpose][category][plan][type].requiredDocs / optionalDocs).
// Off-plan pe Oqood (title deed nahi), ready pe Title deed. Add + Edit property dono yahi use karte hain.

// Backend docLabels na aayen to yeh labels (keys backend LISTING_DOC_KEYS jaisi)
export const DOC_LABEL_FALLBACK = {
  contractA: 'Form A (Listing Agreement)',
  propertyTitleDeed: 'Property Title Deed',
  propertyTrakheesi: 'Trakheesi Permit Certificate',
  passportDocument: "Owner's Passport",
  oqoodDocument: 'Oqood',
  spaDocument: 'Sale and Purchase Agreement (SPA)',
  propertyEid_Visa: 'Emirates ID / Visa Copy',
  propertyFloorPlan: 'Floor Plan',
  propertySitePlan: 'Site Plan',
  companyLicense: 'Company Licence',
  statementOfAccount: 'Statement of Account'
};

// Rules load na hon (mock mode / options abhi nahi aaye) tab ki default list
export const DEFAULT_LISTING_DOCUMENTS = [
  { key: 'contractA', label: 'Form A (Listing Agreement)', required: true },
  { key: 'propertyTitleDeed', label: 'Property Title Deed', required: true },
  { key: 'propertyTrakheesi', label: 'Trakheesi Permit Certificate', required: false },
  { key: 'passportDocument', label: 'Owner Passport / Emirates ID', required: true },
  { key: 'propertyEid_Visa', label: 'Emirates ID / Visa Copy', required: false },
  { key: 'propertyFloorPlan', label: 'Floor Plan', required: false }
];

// Type rules → [{ key, label, required }]. "otherDocuments" alag section hai, is list mein nahi.
export function buildListingDocuments(typeRules, docLabels) {
  if (!typeRules?.requiredDocs) return DEFAULT_LISTING_DOCUMENTS;
  const label = (key) => docLabels?.[key] || DOC_LABEL_FALLBACK[key] || key;
  return [
    ...typeRules.requiredDocs.map((key) => ({ key, label: label(key), required: true })),
    ...(typeRules.optionalDocs || [])
      .filter((key) => key !== 'otherDocuments')
      .map((key) => ({ key, label: label(key), required: false }))
  ];
}
