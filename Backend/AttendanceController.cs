using Microsoft.AspNetCore.Mvc;
using AttendanceAPI.Models;
using AttendanceAPI.Services;
using System.Collections.Generic;

namespace AttendanceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        [HttpPost("add-student")]
        public IActionResult AddStudent([FromBody] Student student)
        {
            if (string.IsNullOrWhiteSpace(student.Id) ||
                string.IsNullOrWhiteSpace(student.Name))
                return BadRequest("Student ID and Name are required.");

            if (DataService.StudentExists(student.Id))
                return BadRequest("Student already exists.");

            DataService.AddStudent(student);

            return Ok("Student added successfully.");
        }

        [HttpGet("students")]
        public IActionResult GetStudents()
        {
            return Ok(DataService.GetStudents());
        }

        [HttpDelete("remove-student/{id}")]
        public IActionResult RemoveStudent(string id)
        {
            if (!DataService.StudentExists(id))
                return NotFound("Student not found.");

            DataService.RemoveStudent(id);

            return Ok("Student removed successfully.");
        }

        [HttpPost("mark-attendance")]
        public IActionResult MarkAttendance([FromBody] Attendance attendance)
        {
            if (string.IsNullOrWhiteSpace(attendance.StudentId) ||
                string.IsNullOrWhiteSpace(attendance.Status))
                return BadRequest("Student ID and Status required.");

            if (!DataService.StudentExists(attendance.StudentId))
                return BadRequest("Student not found.");

            DataService.AddAttendance(attendance);

            return Ok("Attendance recorded.");
        }

        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            var (present, absent) = DataService.GetAttendanceSummary();
            return Ok(new { Present = present, Absent = absent });
        }

        [HttpGet("summary-by-date")]
        public IActionResult GetSummaryByDate(string date)
        {
            var (present, absent) = DataService.GetSummaryByDate(date);
            return Ok(new { Present = present, Absent = absent });
        }

        [HttpGet("summary-by-student")]
        public IActionResult GetSummaryByStudent(string id)
        {
            var (present, absent) = DataService.GetSummaryByStudent(id);
            return Ok(new { Present = present, Absent = absent });
        }

        [HttpGet("absent-by-date")]
        public IActionResult GetAbsentByDate(string date)
        {
            if (string.IsNullOrWhiteSpace(date))
                return BadRequest("Date is required.");

            var absentStudents = DataService.GetAbsentByDate(date);
            return Ok(absentStudents);
        }

        // NEW ENDPOINT: Get sections
        [HttpGet("sections")]
        public IActionResult GetSections()
        {
            var sections = DataService.GetSections();
            return Ok(sections);
        }

        // NEW ENDPOINT: Create section
        [HttpPost("create-section")]
        public IActionResult CreateSection([FromBody] dynamic section)
        {
            try
            {
                DataService.CreateSection(section);
                return Ok("Section created successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}