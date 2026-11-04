import type { Locale } from "./config";

const en = {
  brand: "Admin",
  demoBanner: "Demo console — sample data stored in this browser only.",
  nav: { overview: "Overview", bookings: "Bookings", calendar: "Calendar", fleet: "Fleet", customers: "Customers", finance: "Finance", settings: "Settings", more: "More", site: "View website", logout: "Sign out" },
  login: {
    title: "Staff sign in", subtitle: "BEZ Car Rental admin console", email: "Email", password: "Password", submit: "Sign in", submitting: "Signing in…",
    invalid: "Incorrect email or password.", demo: "Demo credentials", back: "Back to website",
  },
  status: {
    pending: "Pending", confirmed: "Confirmed", collected: "Vehicle collected", active: "Active rental",
    returned: "Returned", completed: "Completed", cancelled: "Cancelled", rejected: "Rejected",
  } as Record<string, string>,
  actions: {
    confirmed: "Approve", rejected: "Reject", cancelled: "Cancel booking", collected: "Mark vehicle collected",
    active: "Start rental", returned: "Mark returned", completed: "Complete & close",
  } as Record<string, string>,
  vehicleState: { available: "Available", on_rent: "On rent", maintenance: "Maintenance", unavailable: "Unavailable" } as Record<string, string>,
  common: {
    save: "Save", cancel: "Cancel", close: "Close", edit: "Edit", add: "Add", search: "Search", all: "All", none: "None",
    confirm: "Confirm", required: "Required", saved: "Saved", optional: "optional", view: "View", back: "Back", loading: "Loading…",
    demoData: "Demo data", today: "Today", from: "From", to: "To", notes: "Notes", reason: "Reason", amount: "Amount (RM)", date: "Date",
    method: "Method", reference: "Reference", type: "Type", cost: "Cost (RM)", description: "Description", total: "Total", empty: "Nothing here yet.",
  },
  errors: {
    conflict: "Conflicts with another confirmed booking or maintenance block", invalid_transition: "This status change is not allowed",
    reason_required: "Please give a reason", outstanding_balance: "Record the outstanding payment before completing",
    vehicle_unavailable: "Vehicle is not available", locked: "This booking can no longer be changed", invalid_period: "Invalid dates",
    return_before_pickup: "Return must be after pickup", too_short: "Below the minimum rental duration", invalid_amount: "Enter a valid amount",
    exceeds_deposit: "More than the deposit held", exceeds_paid: "More than the amount paid", duplicate_plate: "Plate number already exists",
    invalid_rate: "Rates must be greater than zero", invalid_capacity: "Check seats and luggage", required: "Please fill in the required fields",
    invalid_rules: "Check the values", storage_full: "Browser storage is full — remove some images", not_found: "Not found", unknown: "Something went wrong",
  } as Record<string, string>,
  overview: {
    title: "Overview", greeting: "Here's what's happening today.", total: "Total bookings", pending: "Pending approval", confirmed: "Confirmed",
    onRoad: "Active rentals", available: "Available now", ofFleet: (n: number) => `of ${n} vehicles`, upcomingReturns: "Returns in next 48h",
    pickups: "Pickups in next 48h", needsAction: "Needs approval", overdue: "Overdue", revenue: "Rental revenue", revenueNote: "Payments received per month (demo data)",
    thisMonth: "This month", outstanding: "Outstanding balances", depositsHeld: "Deposits held", viewAll: "View all", noPending: "No requests waiting.",
    noReturns: "No returns due.", noPickups: "No pickups due.", table: "Show as table", month: "Month",
  },
  bookings: {
    title: "Bookings", searchHint: "Reference, customer, phone or plate", ref: "Reference", customer: "Customer", vehicle: "Vehicle", period: "Period",
    status: "Status", total: "Total", balance: "Balance", created: "Received", noResults: "No bookings match.", source: { web: "Website", phone: "Phone", walk_in: "Walk-in", seed: "Demo" } as Record<string, string>,
  },
  booking: {
    back: "All bookings", timeline: "Status history", actions: "Actions", next: "Next step", details: "Booking details", pickup: "Pickup", return: "Return",
    location: "Location", extras: "Extras", customerNotes: "Customer notes", internalNotes: "Internal notes", internalHint: "Visible to staff only",
    changeDates: "Change dates", assign: "Assign vehicle", assignHint: "Only vehicles free for this period are listed", noAlternatives: "No other vehicle is free for these dates.",
    payments: "Payments", recordPayment: "Record payment", charges: "Extra charges", addCharge: "Add charge", summary: "Payment summary",
    due: "Amount due", paid: "Paid", refunded: "Refunded", outstanding: "Outstanding", deposit: "Deposit", depositHeld: "Deposit held",
    depositStatus: { not_collected: "Not collected", held: "Held", refunded: "Refunded", partial: "Partly refunded" } as Record<string, string>,
    refundStatus: { none: "—", due: "Refund due", refunded: "Refunded" } as Record<string, string>,
    kind: { rental: "Rental payment", deposit: "Deposit received", deposit_refund: "Deposit refund", refund: "Refund" } as Record<string, string>,
    methodNames: { cash: "Cash", bank_transfer: "Bank transfer", duitnow: "DuitNow QR", card_manual: "Card (terminal)" } as Record<string, string>,
    chargeTypes: { late: "Late return", fuel: "Fuel", damage: "Damage", cleaning: "Cleaning", other: "Other" } as Record<string, string>,
    clashWarning: (n: number) => `${n} other pending ${n === 1 ? "request overlaps" : "requests overlap"} this period. Approving this one will block them.`,
    conflictWarning: "This period conflicts with:", rejectPrompt: "Reason for rejection (shared with the customer)", cancelPrompt: "Reason for cancellation",
    noPayments: "No payments recorded.", by: "by", paymentNote: "Manual record — no online payment is taken in this demo.",
    customer: "Customer", call: "Call", whatsapp: "WhatsApp",
  },
  calendar: {
    title: "Availability calendar", subtitle: "Reservations, active rentals and maintenance by vehicle.", prev: "Previous", next: "Next", today: "Today",
    legend: { pending: "Pending request", confirmed: "Reserved", onRoad: "Active rental", maintenance: "Maintenance", unavailable: "Unavailable" },
    days: "days", freeToday: (n: number) => `${n} available today`,
  },
  fleet: {
    title: "Fleet", add: "Add vehicle", edit: "Edit vehicle", plate: "Plate no.", make: "Make", model: "Model", variant: "Variant", year: "Year",
    category: "Category", transmission: "Transmission", seats: "Seats", luggage: "Luggage", fuel: "Fuel", mileage: "Mileage (km)", color: "Illustration colour",
    rates: "Rental rates (RM)", hourly: "Per extra hour", daily: "Per day", weekly: "Per day, 7+ days", monthly: "Per day, 28+ days",
    available: "Available for booking", unavailableHint: "Turn off to hide from the website and block new approvals.",
    images: "Images", upload: "Upload images", uploadHint: "JPG/PNG, resized in the browser. Stored locally in this demo; Supabase Storage in Phase 4.",
    removeImage: "Remove", history: "Booking history", maintenance: "Maintenance", addMaintenance: "Schedule maintenance", closeMaintenance: "Close",
    mntTypes: { service: "Service", repair: "Repair", inspection: "Inspection", tyres: "Tyres", cleaning: "Cleaning", other: "Other" } as Record<string, string>,
    open: "Open", closed: "Closed", untilClosed: "Until closed", revenue: "Revenue", rentals: "Rentals", utilisation: "Next booking", noHistory: "No bookings yet.",
    status: "Status", setUnavailable: "Mark unavailable", setAvailable: "Mark available",
  },
  customers: {
    title: "Customers", name: "Name", phone: "Phone", email: "Email", bookings: "Bookings", spent: "Paid", outstanding: "Outstanding", last: "Last booking",
    profile: "Profile", notes: "Notes", notesHint: "Preferences, reminders (staff only)", history: "Booking history", payments: "Payment records",
  },
  finance: {
    title: "Financial records", subtitle: "Rental charges, deposits, balances and refunds (demo data).", charges: "Rental charges (open bookings)",
    deposits: "Deposits held", outstanding: "Outstanding", refundsDue: "Refunds due", ledger: "Payment history", balances: "Open balances",
    export: "Export CSV", noPayments: "No payments yet.",
  },
  settings: {
    title: "Settings", rules: "Booking rules", rulesNote: "In this demo the rules apply to admin actions. In Phase 4 they are stored in the database and drive the public website too.",
    minRentalHours: "Minimum rental (hours)", maxRentalDays: "Maximum rental (days)", minLeadHours: "Minimum notice (hours)", openHour: "Opening hour",
    closeHour: "Closing hour", graceMinutes: "Late-return grace (minutes)", turnaroundMinutes: "Turnaround between rentals (minutes)", taxRate: "Tax rate (%)",
    demo: "Demo data", demoNote: "Restore the sample fleet, bookings and payments. Requests submitted on the website from this browser are cleared too.",
    reset: "Reset demo data", resetConfirm: "Reset all demo data? Your changes will be lost.", resetDone: "Demo data restored.",
    seeded: "Sample data generated", account: "Signed in as",
  },
};

type AdminDict = typeof en;

const ms: AdminDict = {
  brand: "Admin",
  demoBanner: "Konsol demo — data contoh disimpan dalam pelayar ini sahaja.",
  nav: { overview: "Ringkasan", bookings: "Tempahan", calendar: "Kalendar", fleet: "Armada", customers: "Pelanggan", finance: "Kewangan", settings: "Tetapan", more: "Lagi", site: "Lihat laman web", logout: "Log keluar" },
  login: {
    title: "Log masuk staf", subtitle: "Konsol admin BEZ Car Rental", email: "E-mel", password: "Kata laluan", submit: "Log masuk", submitting: "Sedang log masuk…",
    invalid: "E-mel atau kata laluan salah.", demo: "Maklumat log masuk demo", back: "Kembali ke laman web",
  },
  status: {
    pending: "Menunggu", confirmed: "Disahkan", collected: "Kenderaan diambil", active: "Sewaan aktif",
    returned: "Dipulangkan", completed: "Selesai", cancelled: "Dibatalkan", rejected: "Ditolak",
  },
  actions: {
    confirmed: "Luluskan", rejected: "Tolak", cancelled: "Batalkan tempahan", collected: "Tanda kenderaan diambil",
    active: "Mulakan sewaan", returned: "Tanda dipulangkan", completed: "Selesai & tutup",
  },
  vehicleState: { available: "Tersedia", on_rent: "Disewa", maintenance: "Penyelenggaraan", unavailable: "Tidak tersedia" },
  common: {
    save: "Simpan", cancel: "Batal", close: "Tutup", edit: "Ubah", add: "Tambah", search: "Cari", all: "Semua", none: "Tiada",
    confirm: "Sahkan", required: "Wajib", saved: "Disimpan", optional: "pilihan", view: "Lihat", back: "Kembali", loading: "Memuatkan…",
    demoData: "Data demo", today: "Hari ini", from: "Dari", to: "Hingga", notes: "Catatan", reason: "Sebab", amount: "Jumlah (RM)", date: "Tarikh",
    method: "Kaedah", reference: "Rujukan", type: "Jenis", cost: "Kos (RM)", description: "Keterangan", total: "Jumlah", empty: "Belum ada rekod.",
  },
  errors: {
    conflict: "Bertindih dengan tempahan disahkan atau blok penyelenggaraan", invalid_transition: "Perubahan status ini tidak dibenarkan",
    reason_required: "Sila nyatakan sebab", outstanding_balance: "Rekod bayaran tertunggak sebelum menyelesaikan",
    vehicle_unavailable: "Kenderaan tidak tersedia", locked: "Tempahan ini tidak boleh diubah lagi", invalid_period: "Tarikh tidak sah",
    return_before_pickup: "Masa pulang mesti selepas masa ambil", too_short: "Kurang daripada tempoh sewa minimum", invalid_amount: "Masukkan jumlah yang sah",
    exceeds_deposit: "Melebihi deposit yang dipegang", exceeds_paid: "Melebihi jumlah yang dibayar", duplicate_plate: "Nombor plat sudah wujud",
    invalid_rate: "Kadar mesti lebih daripada sifar", invalid_capacity: "Semak tempat duduk dan bagasi", required: "Sila isi ruangan wajib",
    invalid_rules: "Semak nilai yang dimasukkan", storage_full: "Storan pelayar penuh — buang beberapa gambar", not_found: "Tidak dijumpai", unknown: "Berlaku ralat",
  },
  overview: {
    title: "Ringkasan", greeting: "Ini yang berlaku hari ini.", total: "Jumlah tempahan", pending: "Menunggu kelulusan", confirmed: "Disahkan",
    onRoad: "Sewaan aktif", available: "Tersedia sekarang", ofFleet: (n: number) => `daripada ${n} kenderaan`, upcomingReturns: "Pemulangan 48 jam akan datang",
    pickups: "Pengambilan 48 jam akan datang", needsAction: "Perlu kelulusan", overdue: "Lewat", revenue: "Hasil sewaan", revenueNote: "Bayaran diterima setiap bulan (data demo)",
    thisMonth: "Bulan ini", outstanding: "Baki tertunggak", depositsHeld: "Deposit dipegang", viewAll: "Lihat semua", noPending: "Tiada permohonan menunggu.",
    noReturns: "Tiada pemulangan.", noPickups: "Tiada pengambilan.", table: "Papar sebagai jadual", month: "Bulan",
  },
  bookings: {
    title: "Tempahan", searchHint: "Rujukan, pelanggan, telefon atau plat", ref: "Rujukan", customer: "Pelanggan", vehicle: "Kenderaan", period: "Tempoh",
    status: "Status", total: "Jumlah", balance: "Baki", created: "Diterima", noResults: "Tiada tempahan sepadan.", source: { web: "Laman web", phone: "Telefon", walk_in: "Walk-in", seed: "Demo" },
  },
  booking: {
    back: "Semua tempahan", timeline: "Sejarah status", actions: "Tindakan", next: "Langkah seterusnya", details: "Butiran tempahan", pickup: "Ambil", return: "Pulang",
    location: "Lokasi", extras: "Tambahan", customerNotes: "Catatan pelanggan", internalNotes: "Catatan dalaman", internalHint: "Hanya untuk staf",
    changeDates: "Tukar tarikh", assign: "Tukar kenderaan", assignHint: "Hanya kenderaan yang kosong untuk tempoh ini disenaraikan", noAlternatives: "Tiada kenderaan lain yang kosong untuk tarikh ini.",
    payments: "Bayaran", recordPayment: "Rekod bayaran", charges: "Caj tambahan", addCharge: "Tambah caj", summary: "Ringkasan bayaran",
    due: "Jumlah perlu dibayar", paid: "Dibayar", refunded: "Dipulangkan", outstanding: "Tertunggak", deposit: "Deposit", depositHeld: "Deposit dipegang",
    depositStatus: { not_collected: "Belum dikutip", held: "Dipegang", refunded: "Dipulangkan", partial: "Sebahagian dipulangkan" },
    refundStatus: { none: "—", due: "Bayaran balik perlu dibuat", refunded: "Telah dibayar balik" },
    kind: { rental: "Bayaran sewa", deposit: "Deposit diterima", deposit_refund: "Pemulangan deposit", refund: "Bayaran balik" },
    methodNames: { cash: "Tunai", bank_transfer: "Pindahan bank", duitnow: "DuitNow QR", card_manual: "Kad (terminal)" },
    chargeTypes: { late: "Lewat pulang", fuel: "Minyak", damage: "Kerosakan", cleaning: "Pembersihan", other: "Lain-lain" },
    clashWarning: (n: number) => `${n} permohonan lain bertindih dengan tempoh ini. Meluluskan permohonan ini akan menyekat permohonan tersebut.`,
    conflictWarning: "Tempoh ini bertindih dengan:", rejectPrompt: "Sebab penolakan (akan dimaklumkan kepada pelanggan)", cancelPrompt: "Sebab pembatalan",
    noPayments: "Tiada bayaran direkodkan.", by: "oleh", paymentNote: "Rekod manual — tiada bayaran dalam talian dalam demo ini.",
    customer: "Pelanggan", call: "Telefon", whatsapp: "WhatsApp",
  },
  calendar: {
    title: "Kalendar kekosongan", subtitle: "Tempahan, sewaan aktif dan penyelenggaraan mengikut kenderaan.", prev: "Sebelum", next: "Seterusnya", today: "Hari ini",
    legend: { pending: "Permohonan menunggu", confirmed: "Ditempah", onRoad: "Sewaan aktif", maintenance: "Penyelenggaraan", unavailable: "Tidak tersedia" },
    days: "hari", freeToday: (n: number) => `${n} tersedia hari ini`,
  },
  fleet: {
    title: "Armada", add: "Tambah kenderaan", edit: "Ubah kenderaan", plate: "No. plat", make: "Jenama", model: "Model", variant: "Varian", year: "Tahun",
    category: "Kategori", transmission: "Transmisi", seats: "Tempat duduk", luggage: "Bagasi", fuel: "Bahan api", mileage: "Perbatuan (km)", color: "Warna ilustrasi",
    rates: "Kadar sewa (RM)", hourly: "Sejam tambahan", daily: "Sehari", weekly: "Sehari, 7+ hari", monthly: "Sehari, 28+ hari",
    available: "Boleh ditempah", unavailableHint: "Matikan untuk sembunyikan daripada laman web dan sekat kelulusan baharu.",
    images: "Gambar", upload: "Muat naik gambar", uploadHint: "JPG/PNG, dikecilkan dalam pelayar. Disimpan secara setempat dalam demo; Supabase Storage dalam Fasa 4.",
    removeImage: "Buang", history: "Sejarah tempahan", maintenance: "Penyelenggaraan", addMaintenance: "Jadualkan penyelenggaraan", closeMaintenance: "Tutup",
    mntTypes: { service: "Servis", repair: "Pembaikan", inspection: "Pemeriksaan", tyres: "Tayar", cleaning: "Pembersihan", other: "Lain-lain" },
    open: "Terbuka", closed: "Ditutup", untilClosed: "Sehingga ditutup", revenue: "Hasil", rentals: "Sewaan", utilisation: "Tempahan seterusnya", noHistory: "Belum ada tempahan.",
    status: "Status", setUnavailable: "Tanda tidak tersedia", setAvailable: "Tanda tersedia",
  },
  customers: {
    title: "Pelanggan", name: "Nama", phone: "Telefon", email: "E-mel", bookings: "Tempahan", spent: "Dibayar", outstanding: "Tertunggak", last: "Tempahan terakhir",
    profile: "Profil", notes: "Catatan", notesHint: "Keutamaan, peringatan (staf sahaja)", history: "Sejarah tempahan", payments: "Rekod bayaran",
  },
  finance: {
    title: "Rekod kewangan", subtitle: "Caj sewa, deposit, baki dan bayaran balik (data demo).", charges: "Caj sewa (tempahan terbuka)",
    deposits: "Deposit dipegang", outstanding: "Tertunggak", refundsDue: "Bayaran balik perlu dibuat", ledger: "Sejarah bayaran", balances: "Baki terbuka",
    export: "Eksport CSV", noPayments: "Belum ada bayaran.",
  },
  settings: {
    title: "Tetapan", rules: "Peraturan tempahan", rulesNote: "Dalam demo ini peraturan digunakan untuk tindakan admin. Dalam Fasa 4 ia disimpan dalam pangkalan data dan digunakan oleh laman web juga.",
    minRentalHours: "Sewa minimum (jam)", maxRentalDays: "Sewa maksimum (hari)", minLeadHours: "Notis minimum (jam)", openHour: "Waktu buka",
    closeHour: "Waktu tutup", graceMinutes: "Tempoh tangguh lewat (minit)", turnaroundMinutes: "Masa persediaan antara sewaan (minit)", taxRate: "Kadar cukai (%)",
    demo: "Data demo", demoNote: "Pulihkan armada, tempahan dan bayaran contoh. Permohonan dari laman web dalam pelayar ini juga akan dipadam.",
    reset: "Set semula data demo", resetConfirm: "Set semula semua data demo? Perubahan anda akan hilang.", resetDone: "Data demo telah dipulihkan.",
    seeded: "Data contoh dijana", account: "Log masuk sebagai",
  },
};

export const getAdminDictionary = (l: Locale): AdminDict => (l === "ms" ? ms : en);
export type { AdminDict };
