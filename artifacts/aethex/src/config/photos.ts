/**
 * Update 74: real photographs for the five platforms. They are free Unsplash photos (Unsplash licence: free for
 * commercial use, no permission needed), served from Unsplash's image CDN at the size each place needs. They are
 * scene and lifestyle pictures only: never shown as a listed doctor, a product or a review.
 */
const U = (id: string) => (w: number, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ""}&q=70&auto=format&fit=crop`;

export const PH = {
  // consultations
  doctorPortrait: U("1612349317150-e413f6a5b16d"),
  doctorWoman: U("1659353888906-adb3e0041693"),
  consultTablet: U("1758691463000-08b98131daf3"),
  doctorDesk: U("1758691462651-611d730c5272"),
  doctorPatient: U("1631217868264-e5b90bb7e133"),
  consultation: U("1758691462863-9e1b8a863140"),
  stethoscopeHand: U("1532938911079-1b06ac7ceec7"),
  videoConsult: U("1576091160399-112ba8d25d1d"),
  doctorSmile: U("1758691463384-771db2f192b3"),
  doctorLaptop: U("1758691462848-31a39258dbd8"),
  // home care and store
  bpMonitor: U("1615486511484-92e172cc4fe0"),
  bpCheck: U("1631815590016-ebce183022ce"),
  stethoscopePills: U("1603398938378-e54eab446dde"),
  stethoscope: U("1505751172876-fa1923c5c528"),
  // hospitals
  reception: U("1519494026892-80bbd2d6fd0d"),
  ward: U("1538108149393-fbbd81895907"),
  wardBeds: U("1778151270757-f3793f65e2de"),
  hospitalRoom: U("1778151270902-cb0ca572f2ee"),
  icuMonitor: U("1513224502586-d1e602410265"),
  operatingRoom: U("1516549655169-df83a0774514"),
  surgeons: U("1579684453423-f84349ef60b0"),
  corridor: U("1517120026326-d87759a7b63b"),
  ivStand: U("1516574187841-cb9cc2ca948b"),
  // colleges and study
  lectureHall: U("1758270705067-0d7edee57af0"),
  lectureRoom: U("1758270705482-cee87ea98738"),
  studentBooks: U("1571260899304-425eee4c7efc"),
  studentScrubs: U("1584432810601-6c7f27d2362b"),
  microscopeWork: U("1630959305790-4c956ce6c0b6"),
  microscopeLab: U("1707944746033-0232ca340fc6"),
} as const;

export type PhotoKey = keyof typeof PH;
export const ph = (k: PhotoKey, w = 1200, h?: number) => PH[k](w, h);

/** If a photograph can't load (offline, blocked), hide it so the dark backdrop shows instead of a broken image. */
export const hideBroken = (e: { currentTarget: HTMLImageElement }) => { e.currentTarget.style.visibility = "hidden"; };
