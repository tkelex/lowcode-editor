param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$OutputDir = "backups",
  [string]$DockerComposeService = "",
  [string]$ContainerDatabaseUrl = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  Write-Error "DATABASE_URL is required. Pass -DatabaseUrl or set the DATABASE_URL environment variable."
}

if (!(Get-Command pg_dump -ErrorAction SilentlyContinue) -and [string]::IsNullOrWhiteSpace($DockerComposeService)) {
  Write-Error "pg_dump was not found. Install PostgreSQL client tools or pass -DockerComposeService postgres."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = Join-Path $OutputDir "lowcode-editor-$timestamp.dump"

if ([string]::IsNullOrWhiteSpace($DockerComposeService)) {
  pg_dump --format=custom --no-owner --no-acl --file $outputFile $DatabaseUrl
} else {
  $dumpDatabaseUrl = if ([string]::IsNullOrWhiteSpace($ContainerDatabaseUrl)) { $DatabaseUrl } else { $ContainerDatabaseUrl }
  $containerFile = "/tmp/lowcode-editor-$timestamp.dump"
  docker compose exec -T $DockerComposeService pg_dump --format=custom --no-owner --no-acl --file $containerFile $dumpDatabaseUrl
  docker compose cp "${DockerComposeService}:$containerFile" $outputFile
  docker compose exec -T $DockerComposeService rm -f $containerFile
}

Write-Host "Backup created: $outputFile"
