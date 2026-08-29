# Menjalankan pengujian ketahanan penyelarasan status saat report-service mati.
#
# Skrip ini hanya pembungkus: seluruh logika pengukuran ada di uji-ketahanan.js.
# Tugasnya memeriksa prasyarat lebih dulu supaya kegagalan ketahuan sebelum
# report-service sempat dimatikan, bukan di tengah jalan saat sistem sudah
# terlanjur dalam keadaan setengah hidup.
#
# Pemakaian:
#   .\jalankan-uji-ketahanan.ps1
#   .\jalankan-uji-ketahanan.ps1 -N 200
#   .\jalankan-uji-ketahanan.ps1 -Kondisi broker
#   .\jalankan-uji-ketahanan.ps1 -Seed          (siapkan ulang data uji dulu)

param(
    # Jumlah perubahan status yang dikirim selagi report-service mati.
    [int]$N = 100,

    # keduanya | sinkron | broker
    [ValidateSet('keduanya', 'sinkron', 'broker')]
    [string]$Kondisi = 'keduanya',

    # Jalankan penyiap data uji lebih dulu. Perlu kalau basis data sudah
    # dipakai pengujian lain atau laporan sasaran sudah habis teregistrasi.
    [switch]$Seed
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$akar = Resolve-Path (Join-Path $here "..\..")
$compose = Join-Path $akar "docker-compose.yml"
$csv = Join-Path $akar "testing\jmeter\laporan_ids_micro.csv"

function Tulis($pesan, $warna = "Gray") {
    Write-Host $pesan -ForegroundColor $warna
}

# --- Prasyarat ---------------------------------------------------------------

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js tidak ditemukan di PATH."
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker tidak ditemukan di PATH."
}
if (-not (Test-Path $compose)) {
    throw "docker-compose.yml tidak ditemukan di '$compose'."
}

# Menjalankan executable native sambil membungkam stderr. Di Windows PowerShell
# 5.1, stderr dari program luar dibungkus jadi ErrorRecord dan dengan
# ErrorActionPreference 'Stop' akan menghentikan skrip meski exit code-nya 0,
# jadi preferensinya diturunkan sementara dan hasilnya dinilai dari exit code.
function Invoke-Diam {
    param([scriptblock]$Perintah)

    $sebelumnya = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
        $keluaran = & $Perintah 2>&1
        return [pscustomobject]@{
            Sukses   = ($LASTEXITCODE -eq 0)
            Keluaran = $keluaran
        }
    }
    finally {
        $ErrorActionPreference = $sebelumnya
    }
}

# Daemon diperiksa terpisah supaya pesannya jelas. Tanpa ini, Docker Desktop
# yang belum menyala hanya memunculkan galat named pipe yang panjang dan
# menyesatkan sebelum pemeriksaan kontainer sempat berjalan.
$daemon = Invoke-Diam { docker info --format '{{.ServerVersion}}' }
if (-not $daemon.Sukses) {
    throw "Docker Desktop belum berjalan. Nyalakan dulu, tunggu sampai statusnya running, lalu ulangi."
}

Tulis "Memeriksa kontainer yang berjalan..." "Cyan"
$ps = Invoke-Diam { docker compose -f $compose ps --services --filter "status=running" }
if (-not $ps.Sukses) {
    throw "Gagal membaca status kontainer dari '$compose'."
}
$berjalan = @($ps.Keluaran | ForEach-Object { "$_".Trim() })
foreach ($wajib in @("report-service", "case-service", "rabbitmq", "mongodb", "api-gateway")) {
    if ($berjalan -notcontains $wajib) {
        throw "Kontainer '$wajib' tidak berjalan. Jalankan dulu: docker compose up -d"
    }
}

# Yang menentukan bukan ada tidaknya folder node_modules, melainkan apakah
# driver mongodb benar-benar bisa dimuat. uji-ketahanan.js meminjamnya dari
# testing/jmeter kalau folder ini belum punya sendiri, jadi pemeriksaannya
# harus lewat resolusi Node, bukan lewat Test-Path.
$pinjaman = Join-Path $akar "testing\jmeter\node_modules\mongodb"
if (-not (Test-Path "node_modules") -and -not (Test-Path $pinjaman)) {
    throw ("Driver mongodb belum tersedia. Jalankan penyiap data di testing\jmeter " +
           "lebih dulu, atau pasang dependensi di folder ini.")
}

if ($Seed) {
    Tulis "Menyiapkan ulang data uji (arsitektur micro)..." "Cyan"
    node ..\jmeter\seed-loadtest-data.js micro --yes
    if ($LASTEXITCODE -ne 0) { throw "Penyiapan data uji gagal." }
}

if (-not (Test-Path $csv)) {
    throw "Berkas sasaran belum ada: '$csv'. Jalankan ulang dengan -Seed."
}

# Kondisi 'keduanya' memakai dua blok id yang tidak bertumpang tindih, jadi
# kebutuhan barisnya dua kali lipat.
$butuh = $N
if ($Kondisi -eq 'keduanya') { $butuh = $N * 2 }
$tersedia = (Get-Content $csv | Measure-Object -Line).Lines
if ($tersedia -lt $butuh) {
    throw "CSV hanya berisi $tersedia baris, dibutuhkan $butuh. Kurangi -N atau jalankan dengan -Seed."
}

# --- Jalankan ----------------------------------------------------------------

Tulis "`nKondisi : $Kondisi" "Cyan"
Tulis "Jumlah  : $N perubahan status" "Cyan"
Tulis "Catatan : report-service akan dimatikan sementara oleh skrip.`n" "Yellow"

node uji-ketahanan.js "--n=$N" "--kondisi=$Kondisi"
$kode = $LASTEXITCODE

# Jangan pernah meninggalkan sistem dalam keadaan mati, termasuk kalau skrip
# Node berhenti di tengah jalan.
Tulis "`nMemastikan report-service hidup kembali..." "Cyan"
docker compose -f $compose start report-service | Out-Null

if ($kode -ne 0) {
    throw "Pengujian gagal (exit code $kode). Periksa keluaran di atas."
}

Tulis "`nSelesai. Hasil mentah tersimpan di folder 'hasil'." "Green"
Tulis "Salin angka pada ringkasan ke Tabel 7 naskah jurnal." "Green"
