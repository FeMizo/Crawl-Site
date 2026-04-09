param(
  [string]$DumpPath = "backup_neon.dump",
  [switch]$SkipGenerate
)

$ErrorActionPreference = "Stop"

function Invoke-NativeStep {
  param(
    [string]$Description,
    [scriptblock]$Command
  )

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Description fallo con codigo de salida $LASTEXITCODE."
  }
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$dumpFile = Join-Path $projectRoot $DumpPath

if (-not (Test-Path $dumpFile)) {
  throw "No se encontro el dump: $dumpFile"
}

$containerName = "seo_crawler_db"
$dbUser = "seo_user"
$dbName = "seo_crawler"
$dumpTarget = "/tmp/backup_neon.dump"

Write-Host "Levantando Postgres local..."
Invoke-NativeStep "docker compose up" { docker compose up -d --wait db | Out-Host }

Write-Host "Esperando a que Postgres responda..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  docker exec $containerName pg_isready -U $dbUser -d $dbName *> $null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $ready) {
  throw "Postgres local no estuvo listo a tiempo."
}

Write-Host "Copiando dump al contenedor..."
Invoke-NativeStep "docker cp" { docker cp $dumpFile "${containerName}:${dumpTarget}" | Out-Host }

Write-Host "Recreando base local..."
Invoke-NativeStep "terminate active connections" {
  docker exec $containerName psql -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();" | Out-Host
}
Invoke-NativeStep "drop local database" {
  docker exec $containerName psql -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS `"${dbName}`";" | Out-Host
}
Invoke-NativeStep "create local database" {
  docker exec $containerName psql -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE `"${dbName}`";" | Out-Host
}

Write-Host "Restaurando dump..."
Invoke-NativeStep "pg_restore" {
  docker exec $containerName pg_restore -U $dbUser -d $dbName --clean --if-exists --no-owner --no-privileges $dumpTarget | Out-Host
}

Write-Host "Validando tablas restauradas..."
Invoke-NativeStep "list restored tables" {
  docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c '\dt' | Out-Host
}
Invoke-NativeStep "validate User rows" {
  docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) AS users FROM `"User`";" | Out-Host
}
Invoke-NativeStep "validate restored tables" {
  docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Project', 'CrawlRun', 'CrawlRunPage', 'CrawlRunDuplicate') ORDER BY table_name;" | Out-Host
}

if (-not $SkipGenerate) {
  Write-Host "Regenerando Prisma Client..."
  Push-Location $projectRoot
  try {
    $previousNativeErrorPreference = $PSNativeCommandUseErrorActionPreference
    $PSNativeCommandUseErrorActionPreference = $false
    $generateOutput = & npx prisma generate *>&1
    $generateOutput | Out-Host
    if ($LASTEXITCODE -ne 0) {
      $generateText = ($generateOutput | Out-String)
      if ($generateText -match 'EPERM: operation not permitted, rename .*query_engine-windows\.dll\.node') {
        Write-Warning "Prisma Client no se pudo regenerar porque el engine estaba en uso. Se conserva el cliente actual."
      } else {
        throw "prisma generate fallo con codigo de salida $LASTEXITCODE."
      }
    }
  } finally {
    $PSNativeCommandUseErrorActionPreference = $previousNativeErrorPreference
    Pop-Location
  }
}

Write-Host ""
Write-Host "Listo. La app en desarrollo usara la base local definida en .env.local."
