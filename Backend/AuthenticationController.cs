using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Cryptography;
using System.Text;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace AttendanceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        // PIN storage file paths
        private static readonly string pinFile = Path.Combine(Directory.GetCurrentDirectory(), "Data", "user_pin.txt");
        private static readonly string sessionFile = Path.Combine(Directory.GetCurrentDirectory(), "Data", "sessions.txt");
        private static readonly string logFile = Path.Combine(Directory.GetCurrentDirectory(), "Data", "failed_attempts.txt");

        // Ensure Data directory exists
        static AuthenticationController()
        {
            string dataDir = Path.Combine(Directory.GetCurrentDirectory(), "Data");
            if (!Directory.Exists(dataDir))
            {
                Directory.CreateDirectory(dataDir);
            }
        }

        // ============================================
        // PIN SETUP
        // ============================================

        [HttpPost("setup-pin")]
        public IActionResult SetupPin([FromBody] dynamic request)
        {
            try
            {
                string pin = request.pin;
                string userId = request.userId ?? "default_user";

                if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4)
                    return BadRequest(new { message = "PIN must be 4 digits" });

                if (!pin.All(char.IsDigit))
                    return BadRequest(new { message = "PIN must contain only digits" });

                // Check if PIN already exists
                if (PinExists(userId))
                    return BadRequest(new { message = "PIN already set for this user" });

                // Hash and store PIN
                string hashedPin = HashPin(pin);
                StorePinSecurely(userId, hashedPin);

                return Ok(new { message = "PIN setup successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // PIN LOGIN
        // ============================================

        [HttpPost("login")]
        public IActionResult LoginWithPin([FromBody] dynamic request)
        {
            try
            {
                string pin = request.pin;
                string userId = request.userId ?? "default_user";

                if (string.IsNullOrWhiteSpace(pin))
                    return BadRequest(new { message = "PIN is required" });

                // Verify PIN
                if (!VerifyPin(userId, pin))
                {
                    LogFailedAttempt(userId);
                    return Unauthorized(new { message = "Invalid PIN" });
                }

                // Generate session token
                string sessionToken = GenerateSessionToken();
                string sessionId = CreateSession(userId, sessionToken);

                return Ok(new
                {
                    message = "Login successful",
                    sessionId = sessionId,
                    sessionToken = sessionToken,
                    userId = userId,
                    loginTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // PIN VERIFICATION
        // ============================================

        [HttpPost("verify-pin")]
        public IActionResult VerifyPin([FromBody] dynamic request)
        {
            try
            {
                string pin = request.pin;
                string userId = request.userId ?? "default_user";

                if (VerifyPin(userId, pin))
                {
                    return Ok(new { verified = true, message = "PIN is correct" });
                }

                return Unauthorized(new { verified = false, message = "PIN is incorrect" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // RESET PIN
        // ============================================

        [HttpPost("reset-pin")]
        public IActionResult ResetPin([FromBody] dynamic request)
        {
            try
            {
                string userId = request.userId ?? "default_user";
                string oldPin = request.oldPin;
                string newPin = request.newPin;

                if (string.IsNullOrWhiteSpace(newPin) || newPin.Length != 4)
                    return BadRequest(new { message = "New PIN must be 4 digits" });

                // Verify old PIN
                if (!VerifyPin(userId, oldPin))
                    return Unauthorized(new { message = "Current PIN is incorrect" });

                // Update PIN
                string hashedPin = HashPin(newPin);
                UpdatePin(userId, hashedPin);

                return Ok(new { message = "PIN reset successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // LOGOUT
        // ============================================

        [HttpPost("logout")]
        public IActionResult Logout([FromBody] dynamic request)
        {
            try
            {
                string sessionId = request.sessionId;
                InvalidateSession(sessionId);

                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // SESSION VALIDATION
        // ============================================

        [HttpGet("validate-session/{sessionId}")]
        public IActionResult ValidateSession(string sessionId)
        {
            try
            {
                var session = GetSession(sessionId);
                if (session == null || IsSessionExpired(session))
                {
                    return Unauthorized(new { valid = false, message = "Session invalid or expired" });
                }

                return Ok(new
                {
                    valid = true,
                    userId = session["userId"],
                    loginTime = session["loginTime"]
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // CHANGE PIN
        // ============================================

        [HttpPost("change-pin")]
        public IActionResult ChangePin([FromBody] dynamic request)
        {
            try
            {
                string sessionId = request.sessionId;
                string currentPin = request.currentPin;
                string newPin = request.newPin;
                string confirmPin = request.confirmPin;

                // Validate session
                var session = GetSession(sessionId);
                if (session == null)
                    return Unauthorized(new { message = "Invalid session" });

                string userId = session["userId"];

                // Validate new PIN
                if (string.IsNullOrWhiteSpace(newPin) || newPin.Length != 4)
                    return BadRequest(new { message = "New PIN must be 4 digits" });

                if (newPin != confirmPin)
                    return BadRequest(new { message = "PINs do not match" });

                // Verify current PIN
                if (!VerifyPin(userId, currentPin))
                    return Unauthorized(new { message = "Current PIN is incorrect" });

                // Update PIN
                string hashedPin = HashPin(newPin);
                UpdatePin(userId, hashedPin);

                return Ok(new { message = "PIN changed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // HELPER METHODS
        // ============================================

        private string HashPin(string pin)
        {
            using (var sha256 = SHA256.Create())
            {
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(pin));
                return Convert.ToBase64String(hash);
            }
        }

        private bool VerifyPin(string userId, string pin)
        {
            try
            {
                if (!File.Exists(pinFile))
                    return false;

                string hashedPin = HashPin(pin);
                var lines = File.ReadAllLines(pinFile);

                foreach (var line in lines)
                {
                    var parts = line.Split('|');
                    if (parts.Length >= 2 && parts[0].Trim() == userId)
                    {
                        return parts[1].Trim() == hashedPin;
                    }
                }

                return false;
            }
            catch
            {
                return false;
            }
        }

        private bool PinExists(string userId)
        {
            try
            {
                if (!File.Exists(pinFile))
                    return false;

                var lines = File.ReadAllLines(pinFile);
                return lines.Any(l => l.StartsWith(userId + "|"));
            }
            catch
            {
                return false;
            }
        }

        private void StorePinSecurely(string userId, string hashedPin)
        {
            try
            {
                string entry = $"{userId}|{hashedPin}|{DateTime.Now:yyyy-MM-dd HH:mm:ss}\n";
                File.AppendAllText(pinFile, entry);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error storing PIN: {ex.Message}");
            }
        }

        private void UpdatePin(string userId, string hashedPin)
        {
            try
            {
                if (!File.Exists(pinFile))
                    return;

                var lines = File.ReadAllLines(pinFile).ToList();
                for (int i = 0; i < lines.Count; i++)
                {
                    var parts = lines[i].Split('|');
                    if (parts[0].Trim() == userId)
                    {
                        lines[i] = $"{userId}|{hashedPin}|{DateTime.Now:yyyy-MM-dd HH:mm:ss}";
                        break;
                    }
                }

                File.WriteAllLines(pinFile, lines);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating PIN: {ex.Message}");
            }
        }

        private string GenerateSessionToken()
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes);
        }

        private string CreateSession(string userId, string token)
        {
            try
            {
                string sessionId = Guid.NewGuid().ToString();
                string sessionEntry = $"{sessionId}|{userId}|{token}|{DateTime.Now:yyyy-MM-dd HH:mm:ss}|active\n";

                File.AppendAllText(sessionFile, sessionEntry);
                return sessionId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating session: {ex.Message}");
                return null;
            }
        }

        private Dictionary<string, string> GetSession(string sessionId)
        {
            try
            {
                if (!File.Exists(sessionFile))
                    return null;

                var lines = File.ReadAllLines(sessionFile);
                foreach (var line in lines)
                {
                    var parts = line.Split('|');
                    if (parts.Length >= 5 && parts[0].Trim() == sessionId)
                    {
                        return new Dictionary<string, string>
                        {
                            { "sessionId", parts[0].Trim() },
                            { "userId", parts[1].Trim() },
                            { "token", parts[2].Trim() },
                            { "loginTime", parts[3].Trim() },
                            { "status", parts[4].Trim() }
                        };
                    }
                }

                return null;
            }
            catch
            {
                return null;
            }
        }

        private bool IsSessionExpired(Dictionary<string, string> session)
        {
            // Session expires after 24 hours
            const int SESSION_TIMEOUT_HOURS = 24;

            if (!DateTime.TryParse(session["loginTime"], out DateTime loginTime))
                return true;

            return DateTime.Now.Subtract(loginTime).TotalHours > SESSION_TIMEOUT_HOURS;
        }

        private void InvalidateSession(string sessionId)
        {
            try
            {
                if (!File.Exists(sessionFile))
                    return;

                var lines = File.ReadAllLines(sessionFile).ToList();
                for (int i = 0; i < lines.Count; i++)
                {
                    var parts = lines[i].Split('|');
                    if (parts[0].Trim() == sessionId)
                    {
                        // Mark as inactive instead of deleting
                        var newLine = string.Join("|", parts.Take(4)) + "|inactive";
                        lines[i] = newLine;
                        break;
                    }
                }

                File.WriteAllLines(sessionFile, lines);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error invalidating session: {ex.Message}");
            }
        }

        private void LogFailedAttempt(string userId)
        {
            try
            {
                string entry = $"{userId}|{DateTime.Now:yyyy-MM-dd HH:mm:ss}\n";
                File.AppendAllText(logFile, entry);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error logging failed attempt: {ex.Message}");
            }
        }
    }
}