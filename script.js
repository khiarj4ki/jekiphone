const SUPABASE_URL = 'https://fwfyxwsqoaznyzswyjfy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kg-dteMitS-z8YpmzoEEjQ_BDAnMiWh';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let dataTransaksi = [];

const formatRp = (angka) => new Intl.NumberFormat('id-ID').format(angka);

document.getElementById('tanggal').valueAsDate = new Date();

function toggleForm() {
    const jenis = document.getElementById('jenisTx').value;
    const fpElements = document.querySelectorAll('.fp');
    const topupWrap = document.getElementById('topup-desc-wrap');
    const labelBeli = document.getElementById('labelBeli');

    if (jenis === 'Deposit') {
        fpElements.forEach(el => el.classList.add('hidden'));
        topupWrap.classList.remove('hidden');
        labelBeli.innerText = "Nominal Masuk (Rp)";
    } else {
        fpElements.forEach(el => el.classList.remove('hidden'));
        topupWrap.classList.add('hidden');
        labelBeli.innerText = "Harga Beli HP (Rp)";
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
    if (confirm("Yakin ingin menghapus transaksi ini?")) {
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

    let itemBaru = { jenis, tanggal };

    if (jenis === 'Deposit') {
        itemBaru.nama = document.getElementById('keterangan').value || 'Top Up Modal';
        itemBaru.platform = 'Deposit';
        itemBaru.modal_keluar = 0;
        itemBaru.harga_beli = parseInt(document.getElementById('hargaBeli').value) || 0;
        itemBaru.biaya_tambahan = 0;
        itemBaru.harga_jual = itemBaru.harga_beli;
        itemBaru.profit = 0;
    } else {
        const merk = document.getElementById('merk').value || 'Tanpa Nama';
        const storage = document.getElementById('storage').value || '-';
        itemBaru.nama = `${merk} (${storage})`;
        itemBaru.platform = document.getElementById('platform').value;
        itemBaru.harga_beli = parseInt(document.getElementById('hargaBeli').value) || 0;
        itemBaru.biaya_tambahan = parseInt(document.getElementById('biayaTambahan').value) || 0;
        itemBaru.harga_jual = parseInt(document.getElementById('hargaJual').value) || 0;
        itemBaru.modal_keluar = itemBaru.harga_beli + itemBaru.biaya_tambahan;
        itemBaru.profit = itemBaru.harga_jual - itemBaru.modal_keluar;
    }

    const { error } = await supabase.from('mutasi_kas').insert([itemBaru]);

    if (!error) {
        document.getElementById('hargaBeli').value = "0";
        document.getElementById('biayaTambahan').value = "0";
        document.getElementById('hargaJual').value = "0";
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
    let totalProfit = 0;
    let totalModalDeposit = 0;
    let totalUnit = 0;

    dataTransaksi.forEach((tx) => {
        if (tx.jenis === 'Deposit') {
            kasBerjalan += Number(tx.harga_jual);
            totalModalDeposit += Number(tx.harga_jual);
        } else {
            kasBerjalan += Number(tx.profit);
            totalProfit += Number(tx.profit);
            if (Number(tx.harga_jual) > 0) totalUnit++;
        }

        let badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
        if (tx.platform === 'Maujual') badgeStyle = "bg-sky-100 text-sky-800 border-sky-200";
        if (tx.platform === 'Kitar') badgeStyle = "bg-blue-100 text-blue-800 border-blue-200";
        if (tx.platform === 'Deposit') badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="px-4 py-3 text-slate-500 font-mono text-xs">${tx.tanggal.split('-').reverse().join('/')}</td>
            <td class="px-4 py-3 text-slate-800 font-semibold">${tx.nama}</td>
            <td class="px-4 py-3"><span class="px-2 py-0.5 text-xs font-bold rounded-md border ${badgeStyle}">${tx.platform}</span></td>
            <td class="px-4 py-3 text-right font-mono text-slate-600">${tx.jenis === 'Deposit' ? '-' : formatRp(tx.modal_keluar)}</td>
            <td class="px-4 py-3 text-right font-mono text-slate-800">${formatRp(tx.harga_jual)}</td>
            <td class="px-4 py-3 text-right font-mono ${tx.profit > 0 ? 'text-emerald-600 font-bold' : 'text-slate-500'}">${tx.jenis === 'Deposit' ? '-' : (tx.profit > 0 ? '+' : '') + formatRp(tx.profit)}</td>
            <td class="px-4 py-3 text-right font-mono font-bold text-slate-900">${formatRp(kasBerjalan)}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="hapusBaris(${tx.id})" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-2.5 py-1 rounded border border-rose-200 transition">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('val-kas').innerText = `Rp ${formatRp(kasBerjalan)}`;
    document.getElementById('val-profit').innerText = `Rp ${formatRp(totalProfit)}`;
    document.getElementById('val-modal').innerText = `Rp ${formatRp(totalModalDeposit)}`;
    document.getElementById('val-unit').innerText = `${totalUnit} Unit`;
}

fetchTransactions();