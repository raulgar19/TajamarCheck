# Integration Verification Script for TajamarCheck Double Factor and PC registry
$baseUrl = "http://localhost:5081/api/attendance"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "STARTING TAJAMARCHECK VERIFICATION TESTS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Helper to print responses
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body
    )
    $url = "$baseUrl/$Path"
    Write-Host "Testing $Method $url ..." -ForegroundColor Yellow
    try {
        $params = @{
            Uri = $url
            Method = $Method
            ContentType = "application/json"
        }
        if ($Body) {
            $params["Body"] = ConvertTo-Json $Body
        }
        $response = Invoke-RestMethod @params
        Write-Host "SUCCESS (20x):" -ForegroundColor Green
        $response | ConvertTo-Json | Write-Host -ForegroundColor Gray
        return $response
    } catch {
        Write-Host "FAILED (StatusCode: $($_.Exception.Response.StatusCode.value__)): " -ForegroundColor Red
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $errBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host $errBody -ForegroundColor Gray
        return $null
    }
}

# 1. Verify PC registration when no round exists
Write-Host "`nTest 1: Register PC when no round exists" -ForegroundColor White
$res1 = Test-Endpoint -Method Post -Path "equipos/registrar-alumno" -Body @{
    studentId = 101
    nombreDispositivo = "AULA-01-PC-05"
    direccionIP = "10.203.1.20"
}

# 2. Open a Session (Round) for today
Write-Host "`nTest 2: Opening today's round (PermitirCambioPC = false)" -ForegroundColor White
$res2 = Test-Endpoint -Method Post -Path "rondas/abrir" -Body @{
    tipoClase = "Presencial"
    cursoId = 99
    permitirCambioPC = $false
}

# 3. Verify PC registration when PermitirCambioPC is false
Write-Host "`nTest 3: Register PC when round exists but PermitirCambioPC = false" -ForegroundColor White
$res3 = Test-Endpoint -Method Post -Path "equipos/registrar-alumno" -Body @{
    studentId = 101
    nombreDispositivo = "AULA-01-PC-05"
    direccionIP = "10.203.1.20"
}

# 4. Update the round to PermitirCambioPC = true
Write-Host "`nTest 4: Updating round to PermitirCambioPC = true" -ForegroundColor White
$res4 = Test-Endpoint -Method Post -Path "rondas/abrir" -Body @{
    tipoClase = "Presencial"
    cursoId = 99
    permitirCambioPC = $true
}

# 5. Register PC successfully (student 101 -> PC-05)
Write-Host "`nTest 5: Register PC successfully with student 101" -ForegroundColor White
$res5 = Test-Endpoint -Method Post -Path "equipos/registrar-alumno" -Body @{
    studentId = 101
    nombreDispositivo = "AULA-01-PC-05"
    direccionIP = "10.203.1.20"
}

# 6. Verify whitelist now shows student 101 associated with AULA-01-PC-05
Write-Host "`nTest 6: Fetching Equipos to verify mapping" -ForegroundColor White
$res6 = Test-Endpoint -Method Get -Path "equipos"

# 7. Try to register another student to the same PC (this should override/clear the mapping)
# Wait, let's register student 102 to another PC, or see if student 101 can move to AULA-01-PC-06
Write-Host "`nTest 7: Move student 101 to AULA-01-PC-06 (should unbind from PC-05)" -ForegroundColor White
$res7 = Test-Endpoint -Method Post -Path "equipos/registrar-alumno" -Body @{
    studentId = 101
    nombreDispositivo = "AULA-01-PC-06"
    direccionIP = "10.203.1.21"
}

# Fetch whitelist again to see new status
Write-Host "`nTest 8: Fetching Equipos again to verify 101 is on PC-06 and PC-05 is unassigned" -ForegroundColor White
$res8 = Test-Endpoint -Method Get -Path "equipos"

# 9. Verify Check-in with incorrect PC assignment
Write-Host "`nTest 9: Fichar Alumno 101 from PC-05 (which is no longer theirs)" -ForegroundColor White
# We pass devHostname in body to simulate the detection
$res9 = Test-Endpoint -Method Post -Path "fichar/alumno" -Body @{
    studentId = 101
    type = "Entrada"
    devHostname = "AULA-01-PC-05"
    devIp = "10.203.1.20"
}

# 10. Verify Check-in with correct PC assignment
Write-Host "`nTest 10: Fichar Alumno 101 from PC-06 (correct PC)" -ForegroundColor White
$res10 = Test-Endpoint -Method Post -Path "fichar/alumno" -Body @{
    studentId = 101
    type = "Entrada"
    devHostname = "AULA-01-PC-06"
    devIp = "10.203.1.21"
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "VERIFICATION TESTS COMPLETED" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
