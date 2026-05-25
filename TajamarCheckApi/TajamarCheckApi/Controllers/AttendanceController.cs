using Microsoft.AspNetCore.Mvc;
using TajamarCheckApi.Services;

namespace TajamarCheckApi.Controllers;

[ApiController]
public sealed class AttendanceController : ControllerBase
{
    private readonly IAttendanceService attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        this.attendanceService = attendanceService;
    }

    public sealed class ManualAttendanceRequest
    {
        public Guid ExternalStudentId { get; set; }
        public Guid SessionId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    [HttpPost("/api/admin/attendance-manual")]
    public async Task<IActionResult> RegisterManual([FromBody] ManualAttendanceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var attendance = await attendanceService.RegisterManualAttendanceAsync(request.ExternalStudentId, request.SessionId, request.Reason, cancellationToken);
            return Ok(new { success = true, message = "Fichaje manual registrado.", attendanceId = attendance.Id });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
