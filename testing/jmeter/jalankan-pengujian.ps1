# Menjalankan seluruh matriks pengujian beban: 2 arsitektur x 3 tingkat beban.
#
# Data uji disiapkan ulang sebelum SETIAP run. Ini bukan kehati-hatian berlebih:
# EP5 membuat dokumen Kasus baru setiap kali dijalankan, sehingga volume data
# yang dibaca EP4 akan berbeda di run berikutnya kalau sisa data dibiarkan.
#
# Pemakaian:
#   .\jalankan-pengujian.ps1 -JMeterBin "C:\apache-jmeter-5.6.3\bin\jmeter.bat"
#   .\jalankan-pengujian.ps1 -Loops 5

param(
    # Durasi total tiap endpoint dalam detik, sudah termasuk ramp-up. Pengujian
    # dibuat berbasis durasi supaya jumlah pengguna bersamaan benar-benar
    # tercapai dan bertahan; dengan jumlah iterasi tetap, endpoint cepat selesai
    # sebelum seluruh thread sempat menyala sehingga konkurensinya tidak pernah
    # mendekati target.
    [int]$Durasi = 35,
    [int]$Rampup = 5,
    [string]$JMeterBin = "jmeter",

    # Penyaring untuk mengulang sebagian kombinasi saja, misalnya ketika satu
    # run harus diambil ulang tanpa membuang hasil lain yang sudah sah:
    #   .\jalankan-pengujian.ps1 -Arsitektur micro -Vu 50
    [string[]]$Arsitektur = @('micro', 'mono'),
    [int[]]$Vu = @(50, 100, 150)
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

# Gagal cepat kalau JMeter tidak ditemukan, daripada baru ketahuan setelah
# data uji terlanjur disiapkan ulang.
if (-not (Get-Command $JMeterBin -ErrorAction SilentlyContinue)) {
    throw "JMeter tidak ditemukan di '$JMeterBin'. Berikan lokasi jmeter.bat lewat -JMeterBin."
}

# Nama variabel di sini sengaja dibedakan jauh dari nama parameternya. Nama
# variabel PowerShell tidak membedakan huruf besar-kecil, sehingga $arsitektur
# dan $Arsitektur adalah variabel yang sama — menyaring parameter ke dalam
# variabel bernama mirip membuat keduanya saling menimpa.
$daftarArsitektur = @(
    @{ Nama = "micro"; Port = 8080; Csv = "laporan_ids_micro.csv" },
    @{ Nama = "mono";  Port = 8090; Csv = "laporan_ids_mono.csv" }
) | Where-Object { $Arsitektur -contains $_.Nama }
$daftarBeban = @(50, 100, 150) | Where-Object { $Vu -contains $_ }

if (@($daftarArsitektur).Count -eq 0 -or @($daftarBeban).Count -eq 0) {
    throw "Tidak ada kombinasi yang cocok. -Arsitektur menerima micro/mono, -Vu menerima 50/100/150."
}
Write-Host ("Akan dijalankan: {0} x {1} = {2} kombinasi" -f
    ((@($daftarArsitektur) | ForEach-Object { $_.Nama }) -join ','), (@($daftarBeban) -join ','),
    (@($daftarArsitektur).Count * @($daftarBeban).Count)) -ForegroundColor Cyan

if (-not (Test-Path "hasil")) { New-Item -ItemType Directory "hasil" | Out-Null }

foreach ($a in @($daftarArsitektur)) {
    foreach ($beban in @($daftarBeban)) {
        $tag = "$($a.Nama)-vu$beban"
        Write-Host "`n=== $tag ===" -ForegroundColor Cyan

        Write-Host "Menyiapkan ulang data uji..." -ForegroundColor DarkGray
        node seed-loadtest-data.js $a.Nama --yes
        if ($LASTEXITCODE -ne 0) { throw "Gagal menyiapkan data uji untuk $tag" }

        $jtl = "hasil/$tag.jtl"
        $report = "hasil/report-$tag"
        if (Test-Path $jtl) { Remove-Item $jtl -Force }
        if (Test-Path $report) { Remove-Item $report -Recurse -Force }

        # Argumen dikirim sebagai array lalu di-splat. Kalau ditulis langsung
        # di baris perintah, PowerShell memecah token seperti -Jport=$(...)
        # pada tanda '=' sehingga JMeter menerima nilainya sebagai argumen
        # lepas dan menolaknya dengan "Unknown arg".
        #
        # Properti `results` sengaja tidak dikirim supaya Simple Data Writer di
        # dalam test plan tidak ikut menulis ke berkas yang sama dengan -l.
        $argJMeter = @(
            '-n',
            '-t', 'sipeka-load-test.jmx',
            "-Jhost=localhost",
            "-Jport=$($a.Port)",
            "-Jvu=$beban",
            "-Jdurasi=$Durasi",
            "-Jrampup=$Rampup",
            "-Jcsvfile=$($a.Csv)",
            '-l', $jtl,
            '-e', '-o', $report
        )
        & $JMeterBin @argJMeter

        # jmeter.bat menelan kode keluar setelah menampilkan "pause", jadi
        # $LASTEXITCODE tidak bisa dipercaya. Keberhasilan dinilai dari berkas
        # hasil yang benar-benar terbentuk.
        if (-not (Test-Path $jtl)) { throw "JMeter tidak menghasilkan $jtl pada $tag" }

        $baris = @(Import-Csv $jtl)
        if ($baris.Count -eq 0) { throw "Berkas hasil $jtl kosong pada $tag" }

        $gagal = @($baris | Where-Object { $_.success -ne 'true' }).Count
        $persen = [math]::Round(($gagal / $baris.Count) * 100, 2)
        Write-Host ("Selesai: {0} sampel, {1} gagal ({2}%)" -f $baris.Count, $gagal, $persen) -ForegroundColor Green

        if ($persen -gt 5) {
            Write-Host "PERINGATAN: tingkat kegagalan tinggi, periksa $report sebelum memakai datanya." -ForegroundColor Yellow
        }

        # Konkurensi yang benar-benar tercapai diperiksa dari kolom allThreads.
        # Tanpa pemeriksaan ini, pengujian bisa selesai mulus dan melaporkan
        # angka yang rapi padahal beban sesungguhnya jauh di bawah target —
        # kegagalan yang tidak memunculkan pesan error apa pun.
        foreach ($grup in ($baris | Where-Object { $_.label -like 'EP*' } | Group-Object label)) {
            $puncak = ($grup.Group | ForEach-Object { [int]$_.allThreads } | Measure-Object -Maximum).Maximum
            if ($puncak -lt ($beban * 0.8)) {
                Write-Host ("PERINGATAN: {0} hanya mencapai {1} pengguna bersamaan dari target {2}." -f $grup.Name, $puncak, $beban) -ForegroundColor Red
            }
        }
    }
}

Write-Host "`nSeluruh matriks pengujian selesai. Hasil ada di folder hasil\." -ForegroundColor Cyan
