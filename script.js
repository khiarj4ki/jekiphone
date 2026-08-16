const SUPABASE_URL = 'https://fwfyxwsqoaznyzswyjfy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kg-dteMitS-z8YpmzoEEjQ_BDAnMiWh';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let dataTransaksi = [];

const formatRp = (angka) => new Intl.NumberFormat('id-ID').format(angka);

document.getElementById('tanggal').valueAsDate = new Date();

function toggleForm() {
    const jenis = document.getElementById('jenisTx').value;
    const fieldMerk = document.getElementById('field-merk');
    const fieldStorage = document.getElementById('field-storage');
    const fieldPlatform = document.getElementById('field-platform');
    const fieldKeterangan = document.getElementById('field-keterangan');
    const fieldBiaya = document.getElementById('field-biaya');
    const labelNominal = document.getElementById('labelNominal');

    if (jenis === 'Beli HP') {
        fieldMerk.style.display = 'block';
        fieldStorage.style.display = 'block';
        fieldPlatform.style.display = 'none';
        fieldKeterangan.style.display = 'none';
        fieldBiaya.style.display = 'block';
        labelNominal.innerText = "Harga Beli Unit (Rp)";
    } else if (jenis === 'Jual HP') {
        fieldMerk.style.display = 'block';
        fieldStorage.style.display = 'block';
        fieldPlatform.style.display = 'block';
        fieldKeterangan.style.display = 'none';
        fieldBiaya.style.display = 'none';
        labelNominal.innerText = "Harga Jual Unit (Rp)";
    } else if (jenis === 'Deposit') {
        fieldMerk.style.display = 'none';
        fieldStorage.style.display = 'none';
        fieldPlatform.style.display = 'none';
        fieldKeterangan.style.display = 'block';
        fieldBiaya.style.display = 'none';
        labelNominal.innerText = "Nominal Uang Masuk (Rp)";
    }
}

async function fetchTransactions() {
    const { data, error } = await supabase
        .from('mutasi_kas')
        .select('*')
        .order('id', { ascending: true });

    if (!error && data) {
        dataTransaksi = data;
        renderTable();
    }
}

async function hapusBaris(id) {
    if (confirm("Yakin ingin menghapus catatan transaksi ini?")) {
        const { error } = await supabase
            .from('mutasi_kas')
            .delete()
            .eq('id', id);

        if (!error) fetchTransactions();
    }
}

document.getElementById('txForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.innerText = "Menyimpan...";
    btnSubmit.disabled = true;

    const jenis = document.getElementById('jenisTx').value;
    const tanggal = document.getElementById('tanggal').value;
    const nominal = parseInt(document.getElementById('nominalUtama').value) || 0;
    const biaya = parseInt(document.getElementById('biayaTambahan').value) || 0;

    let itemBaru = { jenis, tanggal };

    if (jenis === 'Beli HP') {
        const merk = document.getElementById('merk').value || 'Tanpa Nama';
        const storage = document.getElementById('storage').value || '-';
        itemBaru.nama = `${merk} (${storage})`;
        itemBaru.platform = 'Beli / Angkut';
        itemBaru.harga_beli = nominal;
        itemBaru.biaya_tambahan = biaya;
        itemBaru.modal_keluar = nominal + biaya; // Kas Keluar
        itemBaru.harga_jual = 0;
        itemBaru.profit = -(nominal + biaya);
    } else if (jenis === 'Jual HP') {
        const merk = document.getElementById('merk').value || 'Tanpa Nama';
        const storage = document.getElementById('storage').value || '-';
        itemBaru.nama = `${merk} (${storage})`;
        itemBaru.platform = document.getElementById('platform').value;
        itemBaru.harga_beli = 0;
        itemBaru.biaya_tambahan = 0;
        itemBaru.modal_keluar = 0;
        itemBaru.harga_jual = nominal; // Kas Masuk
        itemBaru.profit = nominal;
    } else if (jenis === 'Deposit') {
        itemBaru.nama = document.getElementById('keterangan').value || 'Top Up Dana Pribadi';
        itemBaru.platform = 'Kas Masuk';
        itemBaru.harga_beli = 0;
        itemBaru.biaya_tambahan = 0;
        itemBaru.modal_keluar = 0;
        itemBaru.harga_jual = nominal; // Kas Masuk
        itemBaru.profit = 0;
    }

    const { error } = await supabase.from('mutasi_kas').insert([itemBaru]);

    if (!error) {
        document.getElementById('nominalUtama').value = "0";
        document.getElementById('biayaTambahan').value = "0";
        document.getElementById('merk').value = "";
        document.getElementById('storage').value = "";
        document.getElementById('keterangan').value = "";
        fetchTransactions();
    }

    btnSubmit.innerText = "💾 Simpan Transaksi";
    btnSubmit.disabled = false;
});

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    let kasBerjalan = 0;
    let totalDeposit = 0;
    let totalOmset = 0;
    let totalUnitJual = 0;

    dataTransaksi.forEach((tx) => {
        const keluar = Number(tx.modal_keluar) || 0;
        const masuk = Number(tx.harga_jual) || 0;

        kasBerjalan = kasBerjalan - keluar + masuk;

        if (tx.jenis === 'Deposit') totalDeposit += masuk;
        if (tx.jenis === 'Jual HP') {
            totalOmset += masuk;
            totalUnitJual++;
        }

        // Badge styling
        let badgeJenis = "bg-rose-100 text-rose-800 border-rose-200";
        if (tx.jenis === 'Jual HP') badgeJenis = "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (tx.jenis === 'Deposit') badgeJenis = "bg-sky-100 text-sky-800 border-sky-200";

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="px-4 py-3 text-slate-500 font-mono text-xs">${tx.tanggal.split('-').reverse().join('/')}</td>
            <td class="px-4 py-3"><span class="px-2 py-0.5 text-xs font-bold rounded-md border ${badgeJenis}">${tx.jenis}</span></td>
            <td class="px-4 py-3 text-slate-800 font-semibold">${tx.nama}</td>
            <td class="px-4 py-3 text-slate-600 text-xs">${tx.platform}</td>
            <td class="px-4 py-3 text-right font-mono text-rose-600">${keluar > 0 ? '-' + formatRp(keluar) : '-'}</td>
            <td class="px-4 py-3 text-right font-mono text-emerald-600">${masuk > 0 ? '+' + formatRp(masuk) : '-'}</td>
            <td class="px-4 py-3 text-right font-mono font-bold text-slate-900">${formatRp(kasBerjalan)}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="hapusBaris(${tx.id})" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-2.5 py-1 rounded border border-rose-200 transition">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('val-kas').innerText = `Rp ${formatRp(kasBerjalan)}`;
    document.getElementById('val-modal').innerText = `Rp ${formatRp(totalDeposit)}`;
    document.getElementById('val-omset').innerText = `Rp ${formatRp(totalOmset)}`;
    document.getElementById('val-unit').innerText = `${totalUnitJual} Unit`;
}

// Inisialisasi awal tampilan form dan muat data
toggleForm();
fetchTransactions();