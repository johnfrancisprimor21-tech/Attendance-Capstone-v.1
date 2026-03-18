using AttendanceAPI.Models;
using System.IO;
using System.Linq;
using System.Collections.Generic;

namespace AttendanceAPI.Services
{
    public static class DataService
    {
        private static string studentFile = "students.txt";
        private static string attendanceFile = "attendance.txt";

        // ============================================
        // STUDENT MANAGEMENT
        // ============================================

        public static void AddStudent(Student student)
        {
            File.AppendAllText(studentFile, $"{student.Id},{student.Name}\n");
        }

        public static bool StudentExists(string id)
        {
            if (!File.Exists(studentFile)) return false;
            return File.ReadAllLines(studentFile).Any(s => s.StartsWith(id + ","));
        }

        public static List<string> GetStudents()
        {
            if (!File.Exists(studentFile))
                return new List<string>();

            return File.ReadAllLines(studentFile).ToList();
        }

        public static void RemoveStudent(string id)
        {
            if (!File.Exists(studentFile))
                return;

            var students = File.ReadAllLines(studentFile);

            using (StreamWriter writer = new StreamWriter(studentFile))
            {
                foreach (var student in students)
                {
                    if (!student.StartsWith(id + ","))
                        writer.WriteLine(student);
                }
            }
        }

        // ============================================
        // ATTENDANCE MANAGEMENT
        // ============================================

        public static void AddAttendance(Attendance attendance)
        {
            // Set default date if not provided
            if (string.IsNullOrWhiteSpace(attendance.Date))
            {
                attendance.Date = System.DateTime.Now.ToString("yyyy-MM-dd");
            }

            File.AppendAllText(attendanceFile,
                $"{attendance.StudentId},{attendance.Status},{attendance.Date}\n");
        }

        // ============================================
        // ATTENDANCE SUMMARY - ALL RECORDS
        // ============================================

        public static (int present, int absent) GetAttendanceSummary()
        {
            if (!File.Exists(attendanceFile))
                return (0, 0);

            int present = 0;
            int absent = 0;

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');
                if (parts.Length < 2)
                    continue;

                var status = parts[1].Trim().ToLower();

                if (status == "present")
                    present++;
                else if (status == "absent")
                    absent++;
            }

            return (present, absent);
        }

        // ============================================
        // ATTENDANCE SUMMARY - BY DATE
        // ============================================

        public static (int present, int absent) GetSummaryByDate(string date)
        {
            if (!File.Exists(attendanceFile))
                return (0, 0);

            int present = 0;
            int absent = 0;

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                // Exact match with standardized format (YYYY-MM-DD)
                if (parts[2].Trim() != date)
                    continue;

                var status = parts[1].Trim().ToLower();

                if (status == "present" || status == "p")
                    present++;
                else if (status == "absent" || status == "a")
                    absent++;
            }

            return (present, absent);
        }

        // ============================================
        // ATTENDANCE SUMMARY - BY STUDENT
        // ============================================

        public static (int present, int absent) GetSummaryByStudent(string id)
        {
            if (!File.Exists(attendanceFile))
                return (0, 0);

            int present = 0;
            int absent = 0;

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                if (parts[0].Trim() != id)
                    continue;

                var status = parts[1].Trim().ToLower();

                if (status == "present")
                    present++;
                else if (status == "absent")
                    absent++;
            }

            return (present, absent);
        }

        // ============================================
        // ABSENT BY DATE
        // ============================================

        public static List<string> GetAbsentByDate(string date)
        {
            if (!File.Exists(attendanceFile))
                return new List<string>();

            List<string> absentStudents = new List<string>();
            Dictionary<string, string> studentNames = new Dictionary<string, string>();

            // Build a dictionary of student IDs to names
            if (File.Exists(studentFile))
            {
                foreach (var line in File.ReadAllLines(studentFile))
                {
                    var parts = line.Split(',');
                    if (parts.Length >= 2)
                    {
                        studentNames[parts[0].Trim()] = parts[1].Trim();
                    }
                }
            }

            // Get all absent students for the specified date
            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                // Match the date
                if (parts[2].Trim() != date)
                    continue;

                // Check if status is absent
                var status = parts[1].Trim().ToLower();
                if (status == "absent" || status == "a")
                {
                    var studentId = parts[0].Trim();
                    var studentName = studentNames.ContainsKey(studentId)
                        ? studentNames[studentId]
                        : "Unknown";

                    absentStudents.Add($"{studentId},{studentName}");
                }
            }

            return absentStudents;
        }

        // ============================================
        // PRESENT BY DATE (NEW)
        // ============================================

        public static List<string> GetPresentByDate(string date)
        {
            if (!File.Exists(attendanceFile))
                return new List<string>();

            List<string> presentStudents = new List<string>();
            Dictionary<string, string> studentNames = new Dictionary<string, string>();

            // Build a dictionary of student IDs to names
            if (File.Exists(studentFile))
            {
                foreach (var line in File.ReadAllLines(studentFile))
                {
                    var parts = line.Split(',');
                    if (parts.Length >= 2)
                    {
                        studentNames[parts[0].Trim()] = parts[1].Trim();
                    }
                }
            }

            // Get all present students for the specified date
            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                // Match the date
                if (parts[2].Trim() != date)
                    continue;

                // Check if status is present
                var status = parts[1].Trim().ToLower();
                if (status == "present" || status == "p")
                {
                    var studentId = parts[0].Trim();
                    var studentName = studentNames.ContainsKey(studentId)
                        ? studentNames[studentId]
                        : "Unknown";

                    presentStudents.Add($"{studentId},{studentName}");
                }
            }

            return presentStudents;
        }

        // ============================================
        // ATTENDANCE BY STUDENT AND DATE (NEW)
        // ============================================

        public static string GetStudentAttendanceByDate(string studentId, string date)
        {
            if (!File.Exists(attendanceFile))
                return "Not Recorded";

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                if (parts[0].Trim() == studentId && parts[2].Trim() == date)
                {
                    return parts[1].Trim();
                }
            }

            return "Not Recorded";
        }

        // ============================================
        // GET ALL ATTENDANCE RECORDS (NEW)
        // ============================================

        public static List<dynamic> GetAllAttendanceRecords()
        {
            if (!File.Exists(attendanceFile))
                return new List<dynamic>();

            List<dynamic> records = new List<dynamic>();
            Dictionary<string, string> studentNames = new Dictionary<string, string>();

            // Build a dictionary of student IDs to names
            if (File.Exists(studentFile))
            {
                foreach (var line in File.ReadAllLines(studentFile))
                {
                    var parts = line.Split(',');
                    if (parts.Length >= 2)
                    {
                        studentNames[parts[0].Trim()] = parts[1].Trim();
                    }
                }
            }

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                var studentId = parts[0].Trim();
                var studentName = studentNames.ContainsKey(studentId)
                    ? studentNames[studentId]
                    : "Unknown";

                records.Add(new
                {
                    StudentId = studentId,
                    StudentName = studentName,
                    Status = parts[1].Trim(),
                    Date = parts[2].Trim()
                });
            }

            return records;
        }

        // ============================================
        // GET ATTENDANCE RECORDS BY DATE RANGE (NEW)
        // ============================================

        public static List<dynamic> GetAttendanceByDateRange(string startDate, string endDate)
        {
            if (!File.Exists(attendanceFile))
                return new List<dynamic>();

            List<dynamic> records = new List<dynamic>();
            Dictionary<string, string> studentNames = new Dictionary<string, string>();

            // Build a dictionary of student IDs to names
            if (File.Exists(studentFile))
            {
                foreach (var line in File.ReadAllLines(studentFile))
                {
                    var parts = line.Split(',');
                    if (parts.Length >= 2)
                    {
                        studentNames[parts[0].Trim()] = parts[1].Trim();
                    }
                }
            }

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                var recordDate = parts[2].Trim();

                // Check if date is within range
                if (recordDate.CompareTo(startDate) >= 0 && recordDate.CompareTo(endDate) <= 0)
                {
                    var studentId = parts[0].Trim();
                    var studentName = studentNames.ContainsKey(studentId)
                        ? studentNames[studentId]
                        : "Unknown";

                    records.Add(new
                    {
                        StudentId = studentId,
                        StudentName = studentName,
                        Status = parts[1].Trim(),
                        Date = recordDate
                    });
                }
            }

            return records;
        }

        // ============================================
        // GET STUDENT ATTENDANCE HISTORY (NEW)
        // ============================================

        public static List<dynamic> GetStudentAttendanceHistory(string studentId)
        {
            if (!File.Exists(attendanceFile))
                return new List<dynamic>();

            List<dynamic> records = new List<dynamic>();

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                if (parts[0].Trim() == studentId)
                {
                    records.Add(new
                    {
                        StudentId = parts[0].Trim(),
                        Status = parts[1].Trim(),
                        Date = parts[2].Trim()
                    });
                }
            }

            return records.OrderByDescending(r => r.Date).ToList();
        }

        // ============================================
        // GET UNIQUE DATES WITH ATTENDANCE (NEW)
        // ============================================

        public static List<string> GetAttendanceDates()
        {
            if (!File.Exists(attendanceFile))
                return new List<string>();

            HashSet<string> dates = new HashSet<string>();

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                dates.Add(parts[2].Trim());
            }

            return dates.OrderByDescending(d => d).ToList();
        }

        // ============================================
        // GET ATTENDANCE PERCENTAGE (NEW)
        // ============================================

        public static (double percentage, int present, int absent, int total) GetAttendancePercentage(string studentId)
        {
            if (!File.Exists(attendanceFile))
                return (0, 0, 0, 0);

            int present = 0;
            int absent = 0;

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                if (parts[0].Trim() != studentId)
                    continue;

                var status = parts[1].Trim().ToLower();

                if (status == "present")
                    present++;
                else if (status == "absent")
                    absent++;
            }

            int total = present + absent;
            double percentage = total > 0 ? (double)present / total * 100 : 0;

            return (Math.Round(percentage, 2), present, absent, total);
        }

        // ============================================
        // DELETE ATTENDANCE RECORD (NEW)
        // ============================================

        public static bool DeleteAttendanceRecord(string studentId, string date)
        {
            if (!File.Exists(attendanceFile))
                return false;

            var records = File.ReadAllLines(attendanceFile).ToList();
            var initialCount = records.Count;

            records = records.Where(r =>
            {
                var parts = r.Split(',');
                if (parts.Length < 3)
                    return true;

                return !(parts[0].Trim() == studentId && parts[2].Trim() == date);
            }).ToList();

            if (records.Count < initialCount)
            {
                File.WriteAllLines(attendanceFile, records);
                return true;
            }

            return false;
        }

        // ============================================
        // UPDATE ATTENDANCE STATUS (NEW)
        // ============================================

        public static bool UpdateAttendanceStatus(string studentId, string date, string newStatus)
        {
            if (!File.Exists(attendanceFile))
                return false;

            var records = File.ReadAllLines(attendanceFile).ToList();
            bool updated = false;

            for (int i = 0; i < records.Count; i++)
            {
                var parts = records[i].Split(',');

                if (parts.Length < 3)
                    continue;

                if (parts[0].Trim() == studentId && parts[2].Trim() == date)
                {
                    records[i] = $"{studentId},{newStatus},{date}";
                    updated = true;
                    break;
                }
            }

            if (updated)
            {
                File.WriteAllLines(attendanceFile, records);
                return true;
            }

            return false;
        }

        // ============================================
        // EXPORT DATA (NEW)
        // ============================================

        public static string ExportAttendanceAsCSV(string date = "")
        {
            if (!File.Exists(attendanceFile))
                return "";

            List<string> csvLines = new List<string>();
            csvLines.Add("StudentID,StudentName,Status,Date");

            Dictionary<string, string> studentNames = new Dictionary<string, string>();

            // Build a dictionary of student IDs to names
            if (File.Exists(studentFile))
            {
                foreach (var line in File.ReadAllLines(studentFile))
                {
                    var parts = line.Split(',');
                    if (parts.Length >= 2)
                    {
                        studentNames[parts[0].Trim()] = parts[1].Trim();
                    }
                }
            }

            foreach (var record in File.ReadAllLines(attendanceFile))
            {
                var parts = record.Split(',');

                if (parts.Length < 3)
                    continue;

                if (!string.IsNullOrEmpty(date) && parts[2].Trim() != date)
                    continue;

                var studentId = parts[0].Trim();
                var studentName = studentNames.ContainsKey(studentId)
                    ? studentNames[studentId]
                    : "Unknown";

                csvLines.Add($"{studentId},{studentName},{parts[1].Trim()},{parts[2].Trim()}");
            }

            return string.Join("\n", csvLines);
        }

        // ============================================
        // CLEAR ALL DATA (NEW - USE WITH CAUTION)
        // ============================================

        public static void ClearAllData()
        {
            if (File.Exists(studentFile))
                File.Delete(studentFile);

            if (File.Exists(attendanceFile))
                File.Delete(attendanceFile);
        }

        // ============================================
        // GET STATISTICS (NEW)
        // ============================================

        public static dynamic GetAttendanceStatistics()
        {
            var allRecords = GetAllAttendanceRecords();

            int totalRecords = allRecords.Count;
            int presentCount = allRecords.Where(r => ((string)r.Status).ToLower() == "present").Count();
            int absentCount = allRecords.Where(r => ((string)r.Status).ToLower() == "absent").Count();
            int lateCount = allRecords.Where(r => ((string)r.Status).ToLower() == "late").Count();

            var students = GetStudents();
            int totalStudents = students.Count;

            double attendancePercentage = totalRecords > 0 ? (double)presentCount / totalRecords * 100 : 0;

            return new
            {
                TotalStudents = totalStudents,
                TotalAttendanceRecords = totalRecords,
                PresentCount = presentCount,
                AbsentCount = absentCount,
                LateCount = lateCount,
                AttendancePercentage = Math.Round(attendancePercentage, 2),
                TotalDatesWithAttendance = GetAttendanceDates().Count
            };
        }

        // ============================================
        // PLACEHOLDER METHODS FOR FUTURE SECTION MANAGEMENT
        // ============================================

        public static List<dynamic> GetSections()
        {
            // This will be implemented when moving to a proper database
            // For now, sections are managed in the frontend using localStorage
            return new List<dynamic>();
        }

        public static void CreateSection(dynamic section)
        {
            // This will be implemented when moving to a proper database
            // Placeholder for future database integration
        }
    }
}