param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,
  [int]$TimeoutSec = 15,
  [switch]$SkipFrontendCheck
)

$ErrorActionPreference = 'Stop'

function Normalize-BaseUrl {
  param([string]$Value)

  $normalized = $Value.Trim()
  if (-not $normalized) {
    throw 'BaseUrl is required.'
  }

  return $normalized.TrimEnd('/')
}

function Invoke-CheckedRequest {
  param(
    [string]$Url,
    [string]$Label,
    [switch]$ExpectJson
  )

  Write-Host "Checking ${Label}: $Url"
  $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing

  if ($response.StatusCode -ne 200) {
    throw "$Label returned status code $($response.StatusCode)"
  }

  $requestId = $response.Headers['X-Request-Id']
  if ([string]::IsNullOrWhiteSpace($requestId) -and $Label -eq 'api-health') {
    throw "$Label response is missing X-Request-Id"
  }

  if ($ExpectJson) {
    $body = $response.Content | ConvertFrom-Json
    return [pscustomobject]@{
      StatusCode = $response.StatusCode
      RequestId = $requestId
      Body = $body
      ContentType = $response.Headers['Content-Type']
    }
  }

  return [pscustomobject]@{
    StatusCode = $response.StatusCode
    RequestId = $requestId
    ContentType = $response.Headers['Content-Type']
  }
}

$baseUrl = Normalize-BaseUrl $BaseUrl
$healthResult = Invoke-CheckedRequest -Url "$baseUrl/api/health" -Label 'api-health' -ExpectJson

if (-not $healthResult.Body.ok) {
  throw "api-health returned ok=$($healthResult.Body.ok)"
}

if ($healthResult.Body.service -and $healthResult.Body.service -ne 'lowcode-editor-server') {
  throw "Unexpected service name: $($healthResult.Body.service)"
}

$report = [ordered]@{
  baseUrl = $baseUrl
  apiHealth = [ordered]@{
    statusCode = $healthResult.StatusCode
    requestId = $healthResult.RequestId
    service = $healthResult.Body.service
    timestamp = $healthResult.Body.timestamp
  }
}

if (-not $SkipFrontendCheck) {
  $frontendResult = Invoke-CheckedRequest -Url "$baseUrl/" -Label 'frontend-home'
  if ($frontendResult.ContentType -notmatch 'text/html') {
    throw "frontend-home returned unexpected content type: $($frontendResult.ContentType)"
  }

  $report.frontendHome = [ordered]@{
    statusCode = $frontendResult.StatusCode
    contentType = $frontendResult.ContentType
  }
}

$report | ConvertTo-Json -Depth 4
