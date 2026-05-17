# Envia leituras fake para popular o banco de dados
# Uso: .\scripts\seed-fake-data.ps1

$API_URL = $env:API_URL ?? "http://localhost:3000/api/readings"
$API_KEY  = $env:API_SECRET_KEY   # defina no ambiente antes de rodar
$TOTAL    = 100   # quantidade de leituras
$DELAY_MS = 100   # ms entre cada envio

$headers = @{
    "Content-Type" = "application/json"
    "x-api-key"    = $API_KEY
}

Write-Host "Enviando $TOTAL leituras fake..." -ForegroundColor Cyan

$ok    = 0
$erros = 0

for ($i = 1; $i -le $TOTAL; $i++) {
    # Variação suave — simula sensor real ao longo do tempo
    $temp     = [math]::Round(22 + (Get-Random -Minimum -40 -Maximum 60) / 20, 1)   # 20–25°C
    $humidity = [math]::Round(58 + (Get-Random -Minimum -80 -Maximum 80) / 10, 1)   # 50–66%
    $soil     = Get-Random -Minimum 35 -Maximum 65

    $body = @{
        temperature = $temp
        humidity    = $humidity
        soil        = $soil
    } | ConvertTo-Json

    try {
        $res = Invoke-RestMethod -Uri $API_URL -Method POST -Headers $headers -Body $body
        $ok++
        Write-Host "[$i/$TOTAL] Temp=$temp°C  Umid=$humidity%  Solo=$soil%  VPD=$($res.vpd)" -ForegroundColor Green
    } catch {
        $erros++
        Write-Host "[$i/$TOTAL] ERRO: $_" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds $DELAY_MS
}

Write-Host ""
Write-Host "Concluido: $ok enviados, $erros erros." -ForegroundColor Cyan
