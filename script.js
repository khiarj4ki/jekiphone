const SUPABASE_URL = 'https://fwfyxwsqoaznyzswyjfy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kg-dteMitS-z8YpmzoEEjQ_BDAnMiWh';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let dataTransaksi = [];

const formatRp = (angka) => new Intl.NumberFormat('id-ID').format(angka);

document.getElementById('tanggal').valueAsDate = new Date();

function toggleForm() {
    const jenis = document.getElementById('jenisTx').value;
    const fpElements = document.querySelectorAll('.fp');
    const topupElements = document.querySelectorAll('.topup-only');
    
    if (jenis === 'Deposit') {
        fpElements.forEach(el => el.style.display = 'none');
        topupElements.forEach(el => el.style.display = 'flex');
        document.getElementById('labelBeli').innerText = "Nominal Uang Masuk (Rp)";
        document.querySelector('.topup-amount').style.display = 'flex';
    } else {
        fpElements.forEach(el => el.style.display = 'flex');
        topupElements.forEach(el => el.style.display = 'none');
        document.getElementById('labelBeli').innerText = "Harga Beli HP (Rp)";
    }
}

async function fetchTransactions() {
    const { data, error } = await supabase
        .from('mutasi_kas')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error("Error fetching data:", error);
    } else {
        dataTransaksi = data;
        renderTable();
    }
}

async function hapusBaris(id) {
    if(confirm("Yakin ingin menghapus transaksi ini?")) {
        const { error } = await supabase
            .from('mutasi_kas')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchTransactions(); 
        }
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
        itemBaru.nama = document.getElementById('keterangan').value || 'Top Up Dana';
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
    } else {
        console.error("Error saving data:", error);
    }
    
    btnSubmit.innerText = "Simpan Transaksi";
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
            if(Number(tx.harga_jual) > 0) totalUnit++;
        }

        let badgeClass = 'badge-fb';
        if(tx.platform === 'Maujual') badgeClass = 'badge-maujual';
        if(tx.platform === 'Kitar') badgeClass = 'badge-kitar';
        if(tx.platform === 'Deposit') badgeClass = 'badge-deposit';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tx.tanggal.split('-').reverse().join('/')}</td>
            <td><strong>${tx.nama}</strong></td>
            <td><span class="badge ${badgeClass}">${tx.platform}</span></td>
            <td class="number-right">${tx.jenis === 'Deposit' ? '-' : formatRp(tx.modal_keluar)}</td>
            <td class="number-right">${tx.jenis === 'Deposit' ? formatRp(tx.harga_jual) : formatRp(tx.harga_jual)}</td>
            <td class="number-right ${tx.profit > 0 ? 'text-green' : ''}">${tx.jenis === 'Deposit' ? '-' : (tx.profit > 0 ? '+' : '') + formatRp(tx.profit)}</td>
            <td class="number-right"><strong>${formatRp(kasBerjalan)}</strong></td>
            <td><button onclick="hapusBaris(${tx.id})" class="btn-danger" style="border:none; border-radius:3px; cursor:pointer;">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('val-kas').innerText = `Rp ${formatRp(kasBerjalan)}`;
    document.getElementById('val-profit').innerText = `Rp ${formatRp(totalProfit)}`;
    document.getElementById('val-modal').innerText = `Rp ${formatRp(totalModalDeposit)}`;
    document.getElementById('val-unit').innerText = `${totalUnit} Unit`;
}

fetchTransactions();