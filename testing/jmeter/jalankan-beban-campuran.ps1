# Pengujian beban campuran: 2 arsitektur x 3 tingkat beban.
#
# Berbeda dari jalankan-pengujian.ps1 yang menguji endpoint satu per satu,
# di sini keempat kelompok beban ditembakkan BERSAMAAN. Yang diuji bukan
# kecepatan tiap endpoint, melainkan apakah beban berat pada modul penanganan
# ikut menyeret jalur pelaporan publik.
#
# Prasyarat: kontainer dijalankan dengan berkas timpaan sumber daya —
#   docker compose -f docker-compose.yml -f docker-compose.campuran.yml up -d
#
# Pemakaian:
#   .\jalankan-beban-campuran.ps1 -JMeterBin "C:\apache-jmeter-5.6.3\bin\jmeter.bat"
#   .\jalankan-beban-campuran.ps1 -Arsitektur mono

param(
    [int]$Durasi = 35,
    [int]$Rampup = 5,
    [string]$JMeterBin = "jmeter",
    [string[]]$Arsitektur = @('micro', 'mono'),
    [int[]]$Vu = @(50, 100, 150)
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

if (-not (Get-Command $JMeterBin -ErrorAction SilentlyContinue)) {
    throw "JMeter tidak ditemukan di '$JMeterBin'. Berikan lokasi jmeter.bat lewat -JMeterBin."
}

# Nama variabel dibedakan jauh dari nama parameter: nama variabel PowerShell
# tidak membedakan huruf besar-kecil, sehingga $arsitektur dan $Arsitektur
# adalah variabel yang sama dan akan saling menimpa.
$daftarArsitektur = @(
    @{ Nama = "micro"; Port = 8080; Csv = "laporan_ids_micro.csv" },
    @{ Nama = "mono";  Port = 8090; Csv = "laporan_ids_mono.csv" }
) | Where-Object { $Arsitektur -contains $_.Nama }
$daftarBeban = @(50, 100, 150) | Where-Object { $Vu -contains $_ }

if (@($daftarArsitektur).Count -eq 0 -or @($daftarBeban).Count -eq 0) {
    throw "Tidak ada kombinasi yang cocok. -Arsitektur menerima micro/mono, -Vu menerima 50/100/150."
}

if (-not (Test-Path "hasil-campuran")) { New-Item -ItemType Directory "hasil-campuran" | Out-Null }

foreach ($a in @($daftarArsitektur)) {
    foreach ($beban in @($daftarBeban)) {
        # Komposisi beban: 50% baca berat petugas, 20% pelaporan publik,
        # 20% master data publik, 10% registrasi lintas-service.
        $vuBerat   = [int]($beban * 0.5)
        $vuLaporan = [int]($beban * 0.2)
        $vuMaster  = [int]($beban * 0.2)
        $vuLintas  = $beban - $vuBerat - $vuLaporan - $vuMaster

        $tag = "$($a.Nama)-campuran-vu$beban"
        Write-Host "`n=== $tag ===" -ForegroundColor Cyan
        Write-Host ("Komposisi: berat={0} laporan={1} master={2} lintas={3} (total {4})" -f
            $vuBerat, $vuLaporan, $vuMaster, $vuLintas, $beban) -ForegroundColor DarkGray

        Write-Host "Menyiapkan ulang data uji..." -ForegroundColor DarkGray
        node seed-loadtest-data.js $a.Nama --yes
        if ($LASTEXITCODE -ne 0) { throw "Gagal menyiapkan data uji untuk $tag" }

        $jtl = "hasil-campuran/$tag.jtl"
        $report = "hasil-campuran/report-$tag"
        if (Test-Path $jtl) { Remove-Item $jtl -Force }
        if (Test-Path $report) { Remove-Item $report -Recurse -Force }

        $argJMeter = @(
            '-n',
            '-t', 'sipeka-beban-campuran.jmx',
            "-Jhost=localhost",
            "-Jport=$($a.Port)",
            "-JvuBerat=$vuBerat",
            "-JvuLaporan=$vuLaporan",
            "-JvuMaster=$vuMaster",
            "-JvuLintas=$vuLintas",
            "-Jdurasi=$Durasi",
            "-Jrampup=$Rampup",
            "-Jcsvfile=$($a.Csv)",
            '-l', $jtl,
            '-e', '-o', $report
        )
        & $JMeterBin @argJMeter

        if (-not (Test-Path $jtl)) { throw "JMeter tidak menghasilkan $jtl pada $tag" }
        $baris = @(Import-Csv $jtl)
        if ($baris.Count -eq 0) { throw "Berkas hasil $jtl kosong pada $tag" }

        $gagal = @($baris | Where-Object { $_.success -ne 'true' }).Count
        $persen = [math]::Round(($gagal / $baris.Count) * 100, 2)
        Write-Host ("Selesai: {0} sampel, {1} gagal ({2}%)" -f $baris.Count, $gagal, $persen) -ForegroundColor Green

        # Ringkasan per kelompok langsung ditampilkan, karena inti pengujian ini
        # adalah membandingkan jalur publik terhadap jalur berat pada saat yang
        # sama — bukan angka keseluruhan.
        foreach ($grup in ($baris | Where-Object { $_.label -notlike 'Login*' } | Group-Object label | Sort-Object Name)) {
            $rata = [math]::Round((($grup.Group | Measure-Object elapsed -Average).Average), 0)
            $err = [math]::Round(((@($grup.Group | Where-Object { $_.success -ne 'true' }).Count / $grup.Count) * 100), 2)
            "    {0,-42} {1,7} ms  {2,6} sampel  {3,5}% gagal" -f $grup.Name, $rata, $grup.Count, $err
        }
    }
}

Write-Host "`nPengujian beban campuran selesai. Hasil ada di folder hasil-campuran\." -ForegroundColor Cyan
