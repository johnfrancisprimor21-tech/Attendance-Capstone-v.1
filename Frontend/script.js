const API_URL = "https://localhost:7173/api/Attendance";

// ============================================
// STATE MANAGEMENT
// ============================================

let currentSection = null;
let allSections = [];
let studentsMgmtCache = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    const section = document.getElementById(id);
    if (section) {
        section.classList.add("active");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Load saved theme and initialize
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    
    showSection('dashboard');
    loadAllSections();
});

// ============================================
// SECTION MANAGEMENT
// ============================================

function switchSectionTab(tabName) {
    document.querySelectorAll("#sectionManagement .tab-content").forEach(tab => {
        tab.classList.remove("active");
    });
    document.querySelectorAll("#sectionManagement .tab-button").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById(tabName).classList.add("active");
    event.target.closest(".tab-button").classList.add("active");

    if (tabName === 'viewSectionTab') {
        loadSectionsList();
    } else if (tabName === 'editSectionTab') {
        loadSectionsForEdit();
    }
}

async function loadAllSections() {
    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        allSections = sections;
        updateSectionDropdowns();
    } catch (error) {
        console.error("Error:", error);
        allSections = [];
    }
}

function updateSectionDropdowns() {
    const selects = [
        'dashboardSectionSelect',
        'studentSectionSelect',
        'attendanceSectionSelect',
        'summarySectionSelect',
        'absentSectionSelect',
        'selectSectionToEdit'
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">-- Select Section --</option>';
            
            allSections.forEach(section => {
                const option = document.createElement("option");
                option.value = section.code;
                option.textContent = `${section.name} (${section.code})`;
                select.appendChild(option);
            });

            select.value = currentValue;
        }
    });
}

async function createSection(event) {
    event.preventDefault();

    const code = document.getElementById("sectionCode").value.trim();
    const name = document.getElementById("sectionName").value.trim();
    const description = document.getElementById("sectionDescription").value.trim();

    if (!code || !name) {
        showToast("Please enter both Code and Name", "warning");
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        
        if (sections.some(s => s.code === code)) {
            showToast("Section code already exists", "error");
            return;
        }

        sections.push({ 
            code, 
            name, 
            description, 
            students: [],
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('sections', JSON.stringify(sections));

        showToast("✓ Section created successfully", "success");
        document.getElementById("createSectionForm").reset();
        
        allSections = sections;
        updateSectionDropdowns();
        loadSectionsList();
    } catch (error) {
        console.error("Error:", error);
        showToast("Error creating section", "error");
    }
}

async function loadSectionsList() {
    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const table = document.getElementById("sectionTableBody");
        table.innerHTML = "";

        if (sections.length === 0) {
            table.innerHTML = `
                <tr class="empty-row">
                    <td colspan="4" style="text-align: center; padding: 40px;">
                        <i class="fas fa-inbox"></i> No sections found
                    </td>
                </tr>
            `;
            document.getElementById("totalSections").textContent = "0";
            return;
        }

        sections.forEach(section => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${escapeHtml(section.code)}</strong></td>
                <td>${escapeHtml(section.name)}</td>
                <td><span class="stat-badge">${section.students ? section.students.length : 0}</span></td>
                <td>
                    <button class="btn btn-secondary" onclick="editSectionClick('${section.code}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            `;
            table.appendChild(row);
        });

        document.getElementById("totalSections").textContent = sections.length;
        showToast(`✓ Loaded ${sections.length} sections`, "success");
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading sections", "error");
    }
}

function filterSections() {
    const searchValue = document.getElementById("searchSection").value.toLowerCase();
    const rows = document.getElementById("sectionTableBody").getElementsByTagName("tr");

    Array.from(rows).forEach(row => {
        if (row.classList.contains("empty-row")) return;
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? "" : "none";
    });
}

async function loadSectionsForEdit() {
    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const select = document.getElementById("selectSectionToEdit");
        select.innerHTML = '<option value="">-- Select a Section --</option>';

        sections.forEach(section => {
            const option = document.createElement("option");
            option.value = section.code;
            option.textContent = `${section.name} (${section.code})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading sections", "error");
    }
}

function loadSectionToEdit() {
    const sectionCode = document.getElementById("selectSectionToEdit").value;

    if (!sectionCode) {
        document.getElementById("editSectionForm").style.display = "none";
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === sectionCode);

        if (section) {
            document.getElementById("editSectionCode").value = section.code;
            document.getElementById("editSectionName").value = section.name;
            document.getElementById("editSectionDescription").value = section.description || '';
            document.getElementById("editSectionForm").style.display = "block";
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function updateSection(event) {
    event.preventDefault();

    const sectionCode = document.getElementById("editSectionCode").value;
    const newName = document.getElementById("editSectionName").value.trim();
    const newDescription = document.getElementById("editSectionDescription").value.trim();

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const sectionIndex = sections.findIndex(s => s.code === sectionCode);

        if (sectionIndex > -1) {
            sections[sectionIndex].name = newName;
            sections[sectionIndex].description = newDescription;
            localStorage.setItem('sections', JSON.stringify(sections));

            showToast("✓ Section updated successfully", "success");
            allSections = sections;
            updateSectionDropdowns();
            loadSectionsList();
            loadSectionsForEdit();
            document.getElementById("selectSectionToEdit").value = "";
            document.getElementById("editSectionForm").style.display = "none";
        }
    } catch (error) {
        console.error("Error:", error);
        showToast("Error updating section", "error");
    }
}

async function deleteSection() {
    const sectionCode = document.getElementById("editSectionCode").value;

    if (!confirm(`Delete section ${sectionCode}? This cannot be undone.`)) return;

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const filteredSections = sections.filter(s => s.code !== sectionCode);
        localStorage.setItem('sections', JSON.stringify(filteredSections));

        showToast("✓ Section deleted successfully", "success");
        allSections = filteredSections;
        updateSectionDropdowns();
        loadSectionsList();
        loadSectionsForEdit();
        document.getElementById("selectSectionToEdit").value = "";
        document.getElementById("editSectionForm").style.display = "none";
    } catch (error) {
        console.error("Error:", error);
        showToast("Error deleting section", "error");
    }
}

function editSectionClick(sectionCode) {
    document.getElementById("selectSectionToEdit").value = sectionCode;
    loadSectionToEdit();
    switchSectionTab('editSectionTab');
}

// ============================================
// DASHBOARD
// ============================================

async function switchDashboardSection() {
    const selectedSection = document.getElementById("dashboardSectionSelect").value;
    currentSection = selectedSection;
    loadDashboardStats();
}

async function loadDashboardStats() {
    if (!currentSection) {
        document.getElementById("totalStudents").textContent = "0";
        document.getElementById("totalPresent").textContent = "0";
        document.getElementById("totalAbsent").textContent = "0";
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        const students = section.students || [];
        document.getElementById("totalStudents").textContent = students.length;

        // Calculate attendance
        let present = 0, absent = 0;
        students.forEach(student => {
            if (student.attendance) {
                present += student.attendance.filter(a => a.status === 'Present').length;
                absent += student.attendance.filter(a => a.status === 'Absent').length;
            }
        });

        document.getElementById("totalPresent").textContent = present;
        document.getElementById("totalAbsent").textContent = absent;
    } catch (error) {
        console.error("Error:", error);
    }
}

// ============================================
// STUDENT MANAGEMENT
// ============================================

function switchStudentSection() {
    const selectedSection = document.getElementById("studentSectionSelect").value;
    currentSection = selectedSection;

    const studentTabsContainer = document.getElementById("studentTabsContainer");
    if (selectedSection) {
        studentTabsContainer.style.display = "flex";
        switchStudentTab('addStudentTab');
        loadStudentsMgmt();
    } else {
        studentTabsContainer.style.display = "none";
    }
}

function switchStudentTab(tabName) {
    document.querySelectorAll("#studentManagement .tab-content").forEach(tab => {
        tab.classList.remove("active");
    });
    document.querySelectorAll("#studentManagement .tab-button").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById(tabName).classList.add("active");
    event.target.closest(".tab-button").classList.add("active");

    if (tabName === 'viewStudentTab') {
        loadStudentsMgmt();
    } else if (tabName === 'editStudentTab') {
        loadStudentsForEditTab();
    } else if (tabName === 'studentStatsTab') {
        loadStudentsForStatsTab();
    }
}

async function addStudentMgmt(event) {
    event.preventDefault();

    if (!currentSection) {
        showToast("Please select a section first", "warning");
        return;
    }

    const id = document.getElementById("studentIdMgmt").value.trim();
    const name = document.getElementById("studentNameMgmt").value.trim();

    if (!id || !name) {
        showToast("Please enter both ID and Name", "warning");
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const sectionIndex = sections.findIndex(s => s.code === currentSection);

        if (sectionIndex === -1) {
            showToast("Section not found", "error");
            return;
        }

        if (!sections[sectionIndex].students) {
            sections[sectionIndex].students = [];
        }

        if (sections[sectionIndex].students.some(s => s.id === id)) {
            showToast("Student already exists in this section", "error");
            return;
        }

        sections[sectionIndex].students.push({ 
            id, 
            name, 
            attendance: [],
            enrolledAt: new Date().toISOString()
        });
        localStorage.setItem('sections', JSON.stringify(sections));

        showToast("✓ Student added to section", "success");
        document.getElementById("addStudentFormMgmt").reset();
        allSections = sections;
        loadStudentsMgmt();
        loadStudentsForEditTab();
        loadStudentsForStatsTab();
    } catch (error) {
        console.error("Error:", error);
        showToast("Error adding student", "error");
    }
}

async function loadStudentsMgmt() {
    if (!currentSection) return;

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        const students = section.students || [];
        const table = document.getElementById("studentTableMgmt");
        table.innerHTML = "";

        if (students.length === 0) {
            table.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <i class="fas fa-inbox"></i> No students in this section
                    </td>
                </tr>
            `;
            document.getElementById("totalStudentsMgmt").textContent = "0";
            return;
        }

        students.forEach(student => {
            const present = student.attendance ? student.attendance.filter(a => a.status === 'Present').length : 0;
            const absent = student.attendance ? student.attendance.filter(a => a.status === 'Absent').length : 0;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${escapeHtml(student.id)}</strong></td>
                <td>${escapeHtml(student.name)}</td>
                <td><span class="stat-badge present">${present}</span></td>
                <td><span class="stat-badge absent">${absent}</span></td>
                <td>
                    <button class="btn btn-secondary" onclick="viewStudentDetails('${student.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            table.appendChild(row);
        });

        document.getElementById("totalStudentsMgmt").textContent = students.length;
        studentsMgmtCache = students;
        showToast(`✓ Loaded ${students.length} students`, "success");
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading students", "error");
    }
}

function filterStudentsMgmt() {
    const searchValue = document.getElementById("searchStudentMgmt").value.toLowerCase();
    const rows = document.getElementById("studentTableMgmt").getElementsByTagName("tr");

    Array.from(rows).forEach(row => {
        if (row.classList.contains("empty-row")) return;
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? "" : "none";
    });
}

async function loadStudentsForEditTab() {
    if (!currentSection) return;

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        const select = document.getElementById("selectStudentToEdit");
        select.innerHTML = '<option value="">-- Select Student --</option>';

        (section.students || []).forEach(student => {
            const option = document.createElement("option");
            option.value = student.id;
            option.textContent = `${student.name} (${student.id})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

function loadStudentToEdit() {
    const studentId = document.getElementById("selectStudentToEdit").value;

    if (!studentId) {
        document.getElementById("editStudentForm").style.display = "none";
        return;
    }

    const student = studentsMgmtCache.find(s => s.id === studentId);

    if (student) {
        document.getElementById("editStudentId").value = student.id;
        document.getElementById("editStudentName").value = student.name;
        document.getElementById("editStudentForm").style.display = "block";
    }
}

async function updateStudent(event) {
    event.preventDefault();

    if (!currentSection) return;

    const studentId = document.getElementById("editStudentId").value;
    const newName = document.getElementById("editStudentName").value.trim();

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const sectionIndex = sections.findIndex(s => s.code === currentSection);

        if (sectionIndex > -1) {
            const studentIndex = sections[sectionIndex].students.findIndex(s => s.id === studentId);
            if (studentIndex > -1) {
                sections[sectionIndex].students[studentIndex].name = newName;
                localStorage.setItem('sections', JSON.stringify(sections));

                showToast("✓ Student updated successfully", "success");
                allSections = sections;
                loadStudentsMgmt();
                loadStudentsForEditTab();
                document.getElementById("selectStudentToEdit").value = "";
                document.getElementById("editStudentForm").style.display = "none";
            }
        }
    } catch (error) {
        console.error("Error:", error);
        showToast("Error updating student", "error");
    }
}

async function deleteStudentFromEdit() {
    if (!currentSection) return;

    const studentId = document.getElementById("editStudentId").value;

    if (!confirm(`Remove student ${studentId} from section?`)) return;

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const sectionIndex = sections.findIndex(s => s.code === currentSection);

        if (sectionIndex > -1) {
            sections[sectionIndex].students = sections[sectionIndex].students.filter(s => s.id !== studentId);
            localStorage.setItem('sections', JSON.stringify(sections));

            showToast("✓ Student removed from section", "success");
            allSections = sections;
            loadStudentsMgmt();
            loadStudentsForEditTab();
            document.getElementById("selectStudentToEdit").value = "";
            document.getElementById("editStudentForm").style.display = "none";
        }
    } catch (error) {
        console.error("Error:", error);
        showToast("Error removing student", "error");
    }
}

async function loadStudentsForStatsTab() {
    if (!currentSection) return;

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        const select = document.getElementById("selectStudentForStats");
        select.innerHTML = '<option value="">-- Select Student --</option>';

        (section.students || []).forEach(student => {
            const option = document.createElement("option");
            option.value = student.id;
            option.textContent = `${student.name} (${student.id})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

async function loadStudentStats() {
    const studentId = document.getElementById("selectStudentForStats").value;

    if (!studentId) {
        document.getElementById("studentStatsContainer").style.display = "none";
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        const student = section.students.find(s => s.id === studentId);

        if (student && student.attendance) {
            const present = student.attendance.filter(a => a.status === 'Present').length;
            const absent = student.attendance.filter(a => a.status === 'Absent').length;
            const total = present + absent;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            document.getElementById("studentPresentCount").textContent = present;
            document.getElementById("studentAbsentCount").textContent = absent;
            document.getElementById("studentAttendancePercentage").textContent = percentage + "%";
            document.getElementById("studentStatsContainer").style.display = "block";
            showToast("✓ Statistics loaded", "success");
        }
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading statistics", "error");
    }
}

function viewStudentDetails(studentId) {
    document.getElementById("selectStudentForStats").value = studentId;
    loadStudentStats();
    switchStudentTab('studentStatsTab');
}

function exportStudentsCSV() {
    if (!currentSection || studentsMgmtCache.length === 0) {
        showToast("No students to export", "warning");
        return;
    }

    let csv = "Student ID,Name\n";
    studentsMgmtCache.forEach(student => {
        csv += `${student.id},${student.name}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${currentSection}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast("✓ Exported successfully", "success");
}

// ============================================
// MARK ATTENDANCE
// ============================================

async function switchAttendanceSection() {
    const selectedSection = document.getElementById("attendanceSectionSelect").value;
    currentSection = selectedSection;

    const form = document.getElementById("markAttendanceForm");
    if (selectedSection) {
        form.style.display = "flex";
        form.style.flexDirection = "column";
        loadStudentsForDropdown();
    } else {
        form.style.display = "none";
    }
}

async function loadStudentsForDropdown() {
    if (!currentSection) return;

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        const dropdown = document.getElementById("studentNameDropdown");
        dropdown.innerHTML = '<option value="">-- Select Student --</option>';

        (section.students || []).forEach(student => {
            const option = document.createElement("option");
            option.value = student.id;
            option.textContent = `${student.name} (${student.id})`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading students", "error");
    }
}

function onStudentNameSelected() {
    const selectedId = document.getElementById("studentNameDropdown").value;
    document.getElementById("attendanceId").value = selectedId;
}

async function markAttendance(event) {
    event.preventDefault();

    if (!currentSection) {
        showToast("Please select a section", "warning");
        return;
    }

    const id = document.getElementById("attendanceId").value.trim();
    const status = document.getElementById("status").value;
    const date = document.getElementById("attendanceDate").value || new Date().toISOString().split('T')[0];

    if (!id || !status) {
        showToast("Please select student and status", "warning");
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const sectionIndex = sections.findIndex(s => s.code === currentSection);

        if (sectionIndex > -1) {
            const studentIndex = sections[sectionIndex].students.findIndex(s => s.id === id);
            if (studentIndex > -1) {
                if (!sections[sectionIndex].students[studentIndex].attendance) {
                    sections[sectionIndex].students[studentIndex].attendance = [];
                }

                sections[sectionIndex].students[studentIndex].attendance.push({ 
                    status, 
                    date,
                    recordedAt: new Date().toISOString()
                });
                localStorage.setItem('sections', JSON.stringify(sections));

                showToast("✓ Attendance recorded", "success");
                document.getElementById("markAttendanceForm").reset();
                document.getElementById("studentNameDropdown").focus();
                allSections = sections;
                loadStudentsMgmt();
            }
        }
    } catch (error) {
        console.error("Error:", error);
        showToast("Error marking attendance", "error");
    }
}

// ============================================
// ATTENDANCE SUMMARY
// ============================================

async function switchSummarySection() {
    const selectedSection = document.getElementById("summarySectionSelect").value;
    currentSection = selectedSection;
}

async function loadSummary() {
    if (!currentSection) {
        showToast("Please select a section", "warning");
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        let present = 0, absent = 0;
        (section.students || []).forEach(student => {
            if (student.attendance) {
                present += student.attendance.filter(a => a.status === 'Present').length;
                absent += student.attendance.filter(a => a.status === 'Absent').length;
            }
        });

        document.getElementById("presentCount").textContent = present;
        document.getElementById("absentCount").textContent = absent;
        showToast("✓ Summary loaded", "success");
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading summary", "error");
    }
}

async function loadSummaryByDate() {
    if (!currentSection) {
        showToast("Please select a section", "warning");
        return;
    }

    const date = document.getElementById("summaryDate").value;

    if (!date) {
        showToast("Please select a date", "warning");
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        let present = 0, absent = 0;
        (section.students || []).forEach(student => {
            if (student.attendance) {
                present += student.attendance.filter(a => a.date === date && a.status === 'Present').length;
                absent += student.attendance.filter(a => a.date === date && a.status === 'Absent').length;
            }
        });

        document.getElementById("presentCount").textContent = present;
        document.getElementById("absentCount").textContent = absent;
        showToast(`✓ Summary for ${date} loaded`, "success");
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading summary", "error");
    }
}

async function loadStudentSummary() {
    if (!currentSection) {
        showToast("Please select a section", "warning");
        return;
    }

    const id = document.getElementById("summaryStudentId").value.trim();

    if (!id) {
        showToast("Please enter Student ID", "warning");
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        const student = section.students.find(s => s.id === id);

        if (student && student.attendance) {
            const present = student.attendance.filter(a => a.status === 'Present').length;
            const absent = student.attendance.filter(a => a.status === 'Absent').length;

            document.getElementById("presentCount").textContent = present;
            document.getElementById("absentCount").textContent = absent;
            showToast(`✓ Summary loaded`, "success");
        }
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading summary", "error");
    }
}

// ============================================
// ABSENT BY DATE
// ============================================

async function switchAbsentSection() {
    const selectedSection = document.getElementById("absentSectionSelect").value;
    currentSection = selectedSection;

    const form = document.getElementById("absentByDateForm");
    if (selectedSection) {
        form.style.display = "flex";
        form.style.flexDirection = "column";
    } else {
        form.style.display = "none";
    }
}

async function loadAbsentByDate(event) {
    event.preventDefault();

    if (!currentSection) {
        showToast("Please select a section", "warning");
        return;
    }

    const date = document.getElementById("absentDate").value;

    if (!date) {
        showToast("Please select a date", "warning");
        return;
    }

    try {
        const sections = JSON.parse(localStorage.getItem('sections')) || [];
        const section = sections.find(s => s.code === currentSection);

        if (!section) return;

        const absentStudents = [];
        (section.students || []).forEach(student => {
            if (student.attendance) {
                const absent = student.attendance.find(a => a.date === date && a.status === 'Absent');
                if (absent) {
                    absentStudents.push({ id: student.id, name: student.name, date });
                }
            }
        });

        const table = document.getElementById("absentTable");
        table.innerHTML = "";

        if (absentStudents.length === 0) {
            table.innerHTML = `
                <tr class="empty-row">
                    <td colspan="3" style="text-align: center; padding: 40px;">
                        <i class="fas fa-check-circle"></i> No absent students on this date
                    </td>
                </tr>
            `;
            document.getElementById("absentDateCount").textContent = "0";
            document.getElementById("absentStatsInfo").style.display = "block";
            showToast("✓ No absent students", "success");
            return;
        }

        absentStudents.forEach(student => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${escapeHtml(student.id)}</strong></td>
                <td>${escapeHtml(student.name)}</td>
                <td>${student.date}</td>
            `;
            table.appendChild(row);
        });

        document.getElementById("absentDateCount").textContent = absentStudents.length;
        document.getElementById("absentStatsInfo").style.display = "block";
        showToast(`✓ Found ${absentStudents.length} absent student(s)`, "success");
    } catch (error) {
        console.error("Error:", error);
        showToast("Error loading absent students", "error");
    }
}