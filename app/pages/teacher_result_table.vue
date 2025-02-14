<template>
    <div style="background-color: #ececec; height: 100%;">
        <!-- Header Section -->
        <div class="sticky-header" style="background-color: #ececec;">
            <v-sheet class="custom-bg"
                style="display: flex; padding: 1rem; padding-top: -2rem;  border-radius: 0px 0px 14px 14px;"
                elevation="3">
                <v-icon 
                    style="margin-right: 0.75rem;" 
                    icon="mdi-keyboard-backspace" 
                    @click="goback">
                </v-icon>
                <h3>ผลการเข้าแถว</h3>

                <!-- Export Button -->
                <v-btn class="ml-auto" @click="exportToPDF">
                    ดาวน์โหลด PDF
                </v-btn>
            </v-sheet>

            <!-- Rest of the header content -->
            <div class="text-body">
                <span style="font-weight: bold;">รายละเอียดการมาเข้าแถว</span><br>
                ห้อง : {{ roomName }} {{ depName }}<br>
                ครูที่ปรึกษา : {{ teacherFirstName }} {{ teacherLastName }}
            </div>
        </div>
        
        <!-- Existing table content -->
        <div class="table-container">
            <v-data-table ref="dataTable" :headers="headers" :items="students" :items-per-page="-1" item-key="index"
                class="custom-table" hide-default-footer>
                <template v-slot:item="{ item }">
                    <tr class="table-row">
                        <td>{{ item.stdFirstName }}</td>
                        <td>{{ item.stdLastName }}</td>
                        <td class="text-center">
                            <span>
                                {{ item.cameDays }}
                            </span>
                        </td>
                        <td class="text-center">
                            <span>
                                {{ item.absentDays }}
                            </span>
                        </td>
                        <td class="text-center">
                            <span>
                                {{ item.leaveDays }}
                            </span>
                        </td>
                        <td class="text-center">
                            <span :class="getPercentageClass(item.attendancePercentage)">
                                {{ item.attendancePercentage }}%
                            </span>
                        </td>
                        <td class="text-center">
                            <span :class="getActivityResultClass(item.attendancePercentage)">
                                {{ getActivityResult(item.attendancePercentage) }}
                            </span>
                        </td>
                    </tr>
                </template>
            </v-data-table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const router = useRouter()
const stdFirstName = ref('')
const stdLastName = ref('')
const depName = ref('')
const roomName = ref('')
const groupID = ref('')
const username = ref('')
const previousPage2 = ref('')
const previousPage1 = ref('')
const teacherFirstName = ref('')
const teacherLastName = ref('')
const day = ref([])
const students = ref([])

const profilePic = ref([])

const cameDays = ref(0);  // จำนวนวันที่มา
const leaveDays = ref(0); // จำนวนวันที่ลา
const absentDays = ref(0); // จำนวนวันที่ขาด
const totalDays = ref(0); // จำนวนวันที่ทั้งหมด
const attendancePercentage = ref(0); // เปอร์เซ็นต์การเข้าแถว

// const students = ref([
//     { stdFirstName: 'John', stdLastName: 'Doe', attendancePercentage: 75 },
//     { stdFirstName: 'Jane', stdLastName: 'Smith', attendancePercentage: 85 },
//     { stdFirstName: 'Michael', stdLastName: 'Johnson', attendancePercentage: 90 }
// ])

const headers = [
    { title: 'ชื่อจริง', align: 'start', key: 'stdFirstName', class: 'header-cell' },
    { title: 'นามสกุล', align: 'start', key: 'stdLastName', class: 'header-cell' },
    { title: 'มา', align: 'center', key: 'cameDays', class: 'header-cell' },
    { title: 'ขาด', align: 'center', key: 'absentDays', class: 'header-cell' },
    { title: 'ลา/สาย', align: 'center', key: 'leaveDays', class: 'header-cell' },
    { title: 'เปอร์เซนต์', align: 'center', key: 'attendancePercentage', class: 'header-cell' },
    { title: 'ผลกิจกรรม', align: 'center', key: 'activityResult', class: 'header-cell' }
]

const getActivityResult = (percentage) => {
    return parseFloat(percentage) >= 60 ? 'ผ่าน' : 'ไม่ผ่าน';
}

const getActivityResultClass = (percentage) => {
    return parseFloat(percentage) >= 60 ? 'result-pass' : 'result-fail';
}

const getPercentageClass = (percentage) => {
    const value = parseFloat(percentage);
    if (value >= 60) return 'percentage-excellent';
    // if (value >= 80) return 'percentage-good';
    // if (value >= 70) return 'percentage-fair';
    return 'percentage-poor';
}

const exportToPDF = async () => {
    try {
        // Create PDF with UTF-8 encoding
        const doc = new jsPDF('p', 'mm', 'a4', true);

        // Load Thai font
        try {
            // Convert the font to base64
            const fontResponse = await fetch('/fonts/THSarabunNew.ttf');
            const fontBuffer = await fontResponse.arrayBuffer();
            const fontBase64 = arrayBufferToBase64(fontBuffer);

            // Add font to PDF
            doc.addFileToVFS('THSarabunNew.ttf', fontBase64);
            doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
            doc.setFont('THSarabunNew');
        } catch (fontError) {
            console.error('Failed to load Thai font:', fontError);
            // Fallback to default font
            doc.setFont('helvetica');
        }

        // Set initial position and styling
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);

        // Add headers with Thai text
        doc.text('รายงานผลการเข้าแถว', 15, 15);

        // Add class info
        doc.setFontSize(12);
        doc.text(`ห้อง: ${roomName.value} ${depName.value}`, 15, 25);
        doc.text(`ครูที่ปรึกษา: ${teacherFirstName.value} ${teacherLastName.value}`, 15, 32);

        // Configure table headers and data
        const tableHeaders = [
            [
                'ชื่อ-นามสกุล',
                'มา',
                'ขาด',
                'ลา',
                'เปอร์เซ็นต์',
                'ผลกิจกรรม'
            ]
        ];

        // Prepare table data
        const tableData = students.value.map(student => [
            `${student.stdFirstName} ${student.stdLastName}`,
            student.cameDays.toString(),
            student.absentDays.toString(),
            student.leaveDays.toString(),
            `${student.attendancePercentage}%`,
            parseFloat(student.attendancePercentage) >= 60 ? 'ผ่าน' : 'ไม่ผ่าน'
        ]);

        // Create table
        doc.autoTable({
            startY: 40,
            head: tableHeaders,
            body: tableData,
            theme: 'grid',
            styles: {
                font: 'THSarabunNew',
                fontSize: 12,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [25, 118, 210],
                textColor: 255,
                fontSize: 12,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 30, halign: 'center' },
                5: { cellWidth: 25, halign: 'center' }
            },
            didDrawCell: (data) => {
                if (data.column.index === 5 && data.cell.section === 'body') {
                    const value = data.cell.raw;
                    if (value === 'ผ่าน') {
                        doc.setTextColor(46, 125, 50);
                    } else {
                        doc.setTextColor(211, 47, 47);
                    }
                }
            },
            willDrawCell: (data) => {
                if (data.column.index === 5) {
                    doc.setTextColor(0);
                }
            }
        });

        // Add footer with Thai date
        const today = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.setFontSize(10);
        doc.text(`พิมพ์เมื่อ: ${today}`, 15, doc.lastAutoTable.finalY + 10);

        // Save the PDF with Thai filename
        const filename = `รายงานผลการเข้าแถว_${roomName.value}_${today.replace(/\s/g, '_')}.pdf`;
        doc.save(filename);

    } catch (error) {
        console.error('Error generating PDF:', error);
        // You might want to show an error message to the user here
    }
};

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const loadActivity = async () => {
    const ID = localStorage.getItem('stdID')
    const response = await axios.get(`/api/listActivity?stdID=${ID}`)
    day.value = response.data.activity
    console.log('date', response.data.activity)

    // คำนวณจำนวนวันที่มา, ขาด, ลา และเปอร์เซ็นต์
    totalDays.value = day.value.length;  // จำนวนวันที่ทั้งหมด

    // คำนวณจำนวนวันที่มา, ลา, ขาด
    cameDays.value = 0;
    leaveDays.value = 0;
    absentDays.value = 0;

    day.value.forEach(d => {
        if (d.checkStatus === 1) {
            cameDays.value += 1;  // เพิ่ม 1 วันหากมา
        } else if (d.checkStatus === 0.5) {
            leaveDays.value += 1;  // เพิ่ม 1 วันหากลา
        } else if (d.checkStatus === 0) {
            absentDays.value += 1;  // เพิ่ม 1 วันหากขาด
        }
    });

    // คำนวณเปอร์เซ็นต์การเข้าแถว (จากวันที่มา + วันที่ลา/2) / วันที่ทั้งหมด
    attendancePercentage.value = ((cameDays.value + (leaveDays.value * 0.5)) / totalDays.value) * 100;
}

const loadData = async () => {
    const storedFirstName = localStorage.getItem('stdFirstName')
    const storedLastName = localStorage.getItem('stdLastName')
    const storedGroupID = localStorage.getItem('groupID')
    const storedUsername = localStorage.getItem('username')
    const storedDepName = localStorage.getItem('depName')
    const storedRoomName = localStorage.getItem('roomName')
    const storedTeacherFname = localStorage.getItem('teacherFirstName')
    const storedTeacherLname = localStorage.getItem('teacherLastName')
    const storedPic = localStorage.getItem('profilePic')
    profilePic.value = storedPic
    username.value = storedUsername
    stdLastName.value = storedLastName
    stdFirstName.value = storedFirstName
    groupID.value = storedGroupID
    depName.value = storedDepName
    roomName.value = storedRoomName
    teacherFirstName.value = storedTeacherFname
    teacherLastName.value = storedTeacherLname
}

const loadActivityStudent = async () => {
    const groupID = localStorage.getItem('groupID')
    try {
        const response = await axios.get(`/api/listActivityStudent?groupID=${groupID}`);

        if (!response.data || !response.data.data) {
            console.error("Error: response.data.data is undefined");
            students.value = [];
            return;
        }

        students.value = response.data.data.map(student => {
            const totalDays = student.activities.length;
            let cameDays = 0;
            let leaveDays = 0;
            let absentDays = 0;

            student.activities.forEach(activity => {
                if (activity.checkStatus === 1) {
                    cameDays += 1;
                } else if (activity.checkStatus === 0.5) {
                    leaveDays += 1;
                } else if (activity.checkStatus === 0) {
                    absentDays += 1;
                }
            });

            const attendancePercentage = ((cameDays + (leaveDays * 0.5)) / totalDays) * 100;

            return {
                stdFirstName: student.stdFirstName,
                stdLastName: student.stdLastName,
                cameDays,
                leaveDays,
                absentDays,
                attendancePercentage: attendancePercentage.toFixed(2),
            };
        });
    } catch (error) {
        console.error('Error loading activity student:', error);
    }
};

onMounted( async () => {
    const token = localStorage.getItem('token')
    console.log('check token from api = ',token)
    
    try {
    const response = await axios.get('/api/checkToken', {
        headers: {
            Authorization: `Bearer ${token}`
        },
    })
    console.log('data = ',response.data)
    } catch(error) {
        console.error('Error:', error.response.data)
        // alert('คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อน')
        router.push('/login');
    }
    loadData()
    loadActivity()
    loadActivityStudent()
})

const goStdResult = (student) => {
    localStorage.setItem('stdID', student.stdID)
    localStorage.setItem('stdFirstName', student.stdFirstName)
    localStorage.setItem('stdLastName', student.stdLastName)

    localStorage.setItem('previousPage', '/teacher_result')
    router.push('/student_result')
}

const goback = () => {
    previousPage2.value = localStorage.getItem('previousPage2')
    router.push(`${previousPage2.value}`);
};

</script>

<style lang="scss" scoped>
.custom-bg {
    background: rgb(25, 118, 210);
    background: linear-gradient(350deg, rgba(25, 118, 210, 1) 0%, rgba(33, 150, 243, 1) 50%, rgba(33, 150, 243, 1) 70%, rgba(100, 181, 246, 1) 100%);
}

.profile-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.avatar-container {
    margin-top: 1rem;
    margin-bottom: 1rem;
}

.avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 1px solid white;
    object-fit: cover;
    box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.35);
}

.profile-card {
    max-width: 350px;
    width: 90%;
    text-align: left;
}

.text-body {
    margin: 1rem;
    font-size: 1rem;
    color: #333;
    line-height: 1.5;
    padding-bottom: 8px;
}

.header {
    margin-top: 2rem;
    margin-bottom: -0.5rem;
}

.sticky-header {
    position: sticky;
    top: 0;
    /* ติดด้านบนของหน้าจอ */
    z-index: 10;
    /* เพื่อให้ลอยอยู่ด้านบน */
    background-color: white;
    /* เพิ่มสีพื้นหลังเพื่อความชัดเจน */
}

.custom-bg-btn {
    background: rgb(219, 235, 255);
    background: linear-gradient(131deg, rgba(219, 235, 255, 1) 0%, rgba(209, 225, 245, 1) 58%, rgba(200, 216, 236, 1) 94%);
}

.info-section {
    background: white;
    padding: 16px;
    border-radius: 8px;
    margin-top: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-content {
    padding: 8px;
}

.info-title {
    font-weight: 600;
    font-size: 1.1rem;
    color: #1976D2;
    display: block;
    margin-bottom: 8px;
}

.info-detail {
    color: #424242;
    line-height: 1.6;
}

.table-container {
    margin-top: 16px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.custom-table {
    border-radius: 8px;

    :deep(.v-data-table__wrapper) {
        border-radius: 8px;
    }

    :deep(.header-cell) {
        background-color: #f5f5f5 !important;
        color: #1976D2 !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    :deep(.table-row) {
        transition: background-color 0.2s;

        &:hover {
            background-color: #f8f9fa;
        }
    }
}

.attendance-badge {
    padding: 4px 12px;
    border-radius: 16px;
    font-weight: 500;
    font-size: 0.9rem;
    display: inline-block;
    min-width: 48px;

    &.came {
        background-color: #E3F2FD;
        color: #1976D2;
    }

    &.absent {
        background-color: #FFEBEE;
        color: #D32F2F;
    }

    &.leave {
        background-color: #FFF3E0;
        color: #F57C00;
    }
}

.percentage-excellent {
    color: #2E7D32;
    font-weight: 600;
}

.percentage-good {
    color: #1976D2;
    font-weight: 600;
}

.percentage-fair {
    color: #F57C00;
    font-weight: 600;
}

.percentage-poor {
    color: #D32F2F;
    font-weight: 600;
}

.text-white {
    color: white;
}

.text-center {
    text-align: center;
}

.result-pass {
    background-color: #E8F5E9;
    color: #2E7D32;
    padding: 4px 16px;
    border-radius: 16px;
    font-weight: 600;
    display: inline-block;
    min-width: 80px;
}

.result-fail {
    background-color: #FFEBEE;
    color: #D32F2F;
    padding: 4px 16px;
    border-radius: 16px;
    font-weight: 600;
    display: inline-block;
    min-width: 80px;
}

.ml-auto {
    margin-left: auto !important;
}

/* Add button hover effect */
:deep(.v-btn) {
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
}
</style>