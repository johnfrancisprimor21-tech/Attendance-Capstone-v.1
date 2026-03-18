namespace AttendanceAPI.Models
{
    public class Attendance
    {
        public string StudentId { get; set; } = "";
        public string Status { get; set; } = ""; // Present or Absent
        public string Date { get; set; } = DateTime.Now.ToString("yyyy-MM-dd"); // standardized date
    }
}