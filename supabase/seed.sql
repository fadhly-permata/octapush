-- seed.sql — initial seed data (FSD §3.4.3 starter use-cases)
-- Run after migrations. Safe to re-run (ON CONFLICT / guard).

insert into public.starter_use_cases (title, description, category, icon, prompt_text, sort_order)
values
  (
    '{"id":"Aplikasi Kasir Penjualan","en":"Sales / POS App"}',
    '{"id":"Catat transaksi penjualan, hitung total, kurangi stok otomatis.","en":"Record sales, compute totals, auto-decrement stock."}',
    'sales',
    'cash-register',
    '{"id":"Buatkan aplikasi kasir penjualan dengan form transaksi, hitung total bayar, dan workflow potong stok otomatis saat submit.","en":"Build a POS sales app with a transaction form, total calculation, and auto stock decrement on submit."}',
    10
  ),
  (
    '{"id":"Data Siswa / Akademik","en":"Student / Academic Data"}',
    '{"id":"Master data siswa, kelas, dan nilai.","en":"Master data for students, classes, and grades."}',
    'education',
    'school',
    '{"id":"Buatkan aplikasi data siswa: master siswa, master kelas, dan input nilai dengan laporan rekap.","en":"Build a student data app: student master, class master, and grade entry with summary report."}',
    20
  ),
  (
    '{"id":"Inventori Gudang","en":"Warehouse Inventory"}',
    '{"id":"Stok barang masuk/keluar dan opname.","en":"Stock in/out and stocktaking."}',
    'inventory',
    'warehouse',
    '{"id":"Buatkan aplikasi inventori: master barang, transaksi masuk/keluar, dan laporan stok akhir.","en":"Build an inventory app: item master, inbound/outbound transactions, and ending-stock report."}',
    30
  ),
  (
    '{"id":"Absensi Karyawan","en":"Employee Attendance"}',
    '{"id":"Presensi harian dan rekap kehadiran.","en":"Daily attendance and presence summary."}',
    'hr',
    'clipboard',
    '{"id":"Buatkan aplikasi absensi: master karyawan, presensi harian, dan rekap kehadiran bulanan.","en":"Build an attendance app: employee master, daily check-in, and monthly presence summary."}',
    40
  ),
  (
    '{"id":"Kas / Keuangan Mini","en":"Mini Finance / Cash"}',
    '{"id":"Catat pemasukan, pengeluaran, dan saldo.","en":"Record income, expense, and balance."}',
    'finance',
    'wallet',
    '{"id":"Buatkan aplikasi kas mini: transaksi pemasukan/pengeluaran dan laporan saldo harian.","en":"Build a mini cash app: income/expense transactions and daily balance report."}',
    50
  )
on conflict do nothing;
