/**
 * Choices for the profile setup, so nobody has to type more than their name:
 * the main cities of each state and union territory, and where people work.
 */

/** Main cities (medical-college and district centres) by state or union territory. */
export const CITIES: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kurnool", "Nellore", "Kakinada", "Anantapur", "Rajahmundry", "Kadapa"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur", "Barpeta"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Nalanda"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bhilai", "Jagdalpur", "Raigarh", "Ambikapur"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu"],
  "Delhi": ["New Delhi", "Delhi"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand"],
  "Haryana": ["Gurugram", "Faridabad", "Rohtak", "Panipat", "Ambala", "Hisar", "Karnal", "Sonipat"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Dharamshala", "Tanda", "Solan", "Hamirpur"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Davanagere", "Kalaburagi", "Ballari", "Shivamogga", "Manipal"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kottayam", "Kollam", "Kannur", "Alappuzha", "Palakkad"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Rewa", "Sagar"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Navi Mumbai", "Kolhapur", "Solapur", "Amravati"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong", "Tura"],
  "Mizoram": ["Aizawl", "Lunglei"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Berhampur", "Sambalpur", "Rourkela", "Balasore"],
  "Puducherry": ["Puducherry", "Karaikal"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Bathinda", "Faridkot"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Thanjavur", "Erode"],
  "Telangana": ["Hyderabad", "Secunderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam"],
  "Tripura": ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Prayagraj", "Agra", "Meerut", "Gorakhpur", "Aligarh"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Srinagar Garhwal"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Bardhaman", "Kalyani"],
};

/** Where someone works or studies. The choice is kept as their institution until they add one in Settings. */
export const SETTINGS: { id: string; label: string; hint: string; for?: string[] }[] = [
  { id: "gmc", label: "Government medical college", hint: "Teaching hospital" },
  { id: "pmc", label: "Private medical college", hint: "Teaching hospital" },
  { id: "gh", label: "Government hospital", hint: "District, CHC or state hospital" },
  { id: "ph", label: "Private hospital", hint: "Corporate or nursing home" },
  { id: "clinic", label: "Own clinic or practice", hint: "OPD and consultations" },
  { id: "phc", label: "Primary health centre", hint: "PHC or rural posting" },
  { id: "pharmacy", label: "Pharmacy", hint: "Retail or hospital pharmacy", for: ["pharmacist"] },
  { id: "prep", label: "Preparing full time", hint: "Coaching or self-study", for: ["aspirant"] },
];

/** The next months, for when an aspirant's exam is (stored as the 1st of that month). */
export function examMonths(now = new Date(), count = 15): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let k = 0; k < count; k++) {
    const d = new Date(now.getFullYear(), now.getMonth() + k, 1);
    out.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    });
  }
  return out;
}
