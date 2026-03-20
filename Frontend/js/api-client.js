// ============================================
// API CLIENT FOR ATTENDANCE SYSTEM
// ============================================

class AttendanceAPI {
    constructor(baseURL = null) {
        this.baseURL = baseURL || 'http://localhost:7173/api';
        this.sessionId = null;
        this.sessionToken = null;
        this.userId = 'default_user';
        this.config = null;
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    async setupPin(pin) {
        try {
            const response = await fetch(`${this.baseURL}/authentication/setup-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: pin,
                    userId: this.userId
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Setup failed');
            }
            return data;
        } catch (error) {
            console.error('Setup PIN Error:', error);
            throw error;
        }
    }

    async loginWithPin(pin) {
        try {
            const response = await fetch(`${this.baseURL}/authentication/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: pin,
                    userId: this.userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            this.sessionId = data.sessionId;
            this.sessionToken = data.sessionToken;

            localStorage.setItem('attendanceSession', JSON.stringify({
                sessionId: this.sessionId,
                sessionToken: this.sessionToken,
                userId: this.userId,
                loginTime: data.loginTime
            }));

            return data;
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    }

    async verifyPin(pin) {
        try {
            const response = await fetch(`${this.baseURL}/authentication/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: pin,
                    userId: this.userId
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Verify PIN Error:', error);
            throw error;
        }
    }

    async resetPin(oldPin, newPin) {
        try {
            const response = await fetch(`${this.baseURL}/authentication/reset-pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': this.sessionId
                },
                body: JSON.stringify({
                    userId: this.userId,
                    oldPin: oldPin,
                    newPin: newPin
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Reset PIN Error:', error);
            throw error;
        }
    }

    async changePin(currentPin, newPin, confirmPin) {
        try {
            const response = await fetch(`${this.baseURL}/authentication/change-pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': this.sessionId
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    currentPin: currentPin,
                    newPin: newPin,
                    confirmPin: confirmPin
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Change PIN Error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            const response = await fetch(`${this.baseURL}/authentication/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': this.sessionId
                },
                body: JSON.stringify({
                    sessionId: this.sessionId
                })
            });

            localStorage.removeItem('attendanceSession');
            this.sessionId = null;
            this.sessionToken = null;

            return await response.json();
        } catch (error) {
            console.error('Logout Error:', error);
            throw error;
        }
    }

    async validateSession() {
        try {
            const response = await fetch(`${this.baseURL}/authentication/validate-session/${this.sessionId}`, {
                method: 'GET',
                headers: {
                    'X-Session-Id': this.sessionId
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Validate Session Error:', error);
            return { valid: false };
        }
    }

    // ============================================
    // STUDENT METHODS
    // ============================================

    async addStudent(id, name) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/add-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': this.sessionId
                },
                body: JSON.stringify({ id: id, name: name })
            });
            return await response.json();
        } catch (error) {
            console.error('Add Student Error:', error);
            throw error;
        }
    }

    async getStudents() {
        try {
            const response = await fetch(`${this.baseURL}/attendance/students`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Students Error:', error);
            throw error;
        }
    }

    async removeStudent(id) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/remove-student/${id}`, {
                method: 'DELETE',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Remove Student Error:', error);
            throw error;
        }
    }

    // ============================================
    // ATTENDANCE METHODS
    // ============================================

    async markAttendance(studentId, status, date = null) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/mark-attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': this.sessionId
                },
                body: JSON.stringify({ studentId: studentId, status: status, date: date })
            });
            return await response.json();
        } catch (error) {
            console.error('Mark Attendance Error:', error);
            throw error;
        }
    }

    async markAttendanceBatch(records) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/mark-attendance-batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': this.sessionId
                },
                body: JSON.stringify(records)
            });
            return await response.json();
        } catch (error) {
            console.error('Batch Attendance Error:', error);
            throw error;
        }
    }

    async getSummary() {
        try {
            const response = await fetch(`${this.baseURL}/attendance/summary`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Summary Error:', error);
            throw error;
        }
    }

    async getSummaryByDate(date) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/summary-by-date?date=${date}`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Summary By Date Error:', error);
            throw error;
        }
    }

    async getSummaryByStudent(studentId) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/summary-by-student?id=${studentId}`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Summary By Student Error:', error);
            throw error;
        }
    }

    async getAbsentByDate(date) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/absent-by-date?date=${date}`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Absent By Date Error:', error);
            throw error;
        }
    }

    async getPresentByDate(date) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/present-by-date?date=${date}`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Present By Date Error:', error);
            throw error;
        }
    }

    async getStudentHistory(studentId) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/student-history/${studentId}`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Student History Error:', error);
            throw error;
        }
    }

    async getAttendanceByDateRange(startDate, endDate) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/attendance-range?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Attendance Range Error:', error);
            throw error;
        }
    }

    async getStatistics() {
        try {
            const response = await fetch(`${this.baseURL}/attendance/statistics`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Statistics Error:', error);
            throw error;
        }
    }

    async getAttendanceDates() {
        try {
            const response = await fetch(`${this.baseURL}/attendance/attendance-dates`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Get Attendance Dates Error:', error);
            throw error;
        }
    }

    async exportAttendanceAsCSV(date = '') {
        try {
            const response = await fetch(`${this.baseURL}/attendance/export-csv?date=${date}`, {
                method: 'GET',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Export CSV Error:', error);
            throw error;
        }
    }

    async deleteAttendanceRecord(studentId, date) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/delete-record/${studentId}/${date}`, {
                method: 'DELETE',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Delete Attendance Record Error:', error);
            throw error;
        }
    }

    async updateAttendanceStatus(studentId, date, newStatus) {
        try {
            const response = await fetch(`${this.baseURL}/attendance/update-record/${studentId}/${date}/${newStatus}`, {
                method: 'PUT',
                headers: { 'X-Session-Id': this.sessionId }
            });
            return await response.json();
        } catch (error) {
            console.error('Update Attendance Status Error:', error);
            throw error;
        }
    }

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    restoreSession() {
        const session = localStorage.getItem('attendanceSession');
        if (session) {
            try {
                const data = JSON.parse(session);
                this.sessionId = data.sessionId;
                this.sessionToken = data.sessionToken;
                this.userId = data.userId;
                return true;
            } catch (error) {
                console.error('Error restoring session:', error);
                return false;
            }
        }
        return false;
    }

    clearSession() {
        this.sessionId = null;
        this.sessionToken = null;
        localStorage.removeItem('attendanceSession');
    }

    isSessionActive() {
        return this.sessionId !== null && this.sessionToken !== null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttendanceAPI;
}