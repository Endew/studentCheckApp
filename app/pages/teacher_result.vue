<template>
    <div style="background-color: #ececec; height: 100%;">
        <!-- Header Section -->
        <div class="sticky-header">
            <v-sheet
                class="custom-bg"
                style="display: flex; padding: 1rem; padding-top: -2rem;  border-radius: 0px 0px 14px 14px;"
                elevation="3"
            >
                <v-icon
                    style="margin-right: 0.75rem;"
                    icon="mdi-keyboard-backspace"
                    @click="goback"
                ></v-icon>
                <h3>ผลการเข้าแถว</h3>
            </v-sheet>

            <div>
                <div style="margin-left: 1rem; padding-top: 0.75rem; padding-bottom: 0.5rem;">
                    <div class="text-body">
                        <span style="font-weight: bold;">รายละเอียดการมาเข้าแถว</span><br>
                        ห้อง : {{ roomName}} {{ depName }}<br>
                        ครูที่ปรึกษา : {{ teacherFirstName }} {{ teacherLastName }}
                        <v-btn
                            variant="text"
                            class="custom-bg-btn"
                            :style="{
                                letterSpacing: '0.03rem',
                                backgroundColor: '#DBEBFF',
                                borderRadius: '15px',
                                border: 'solid 1px #c5d5e8',
                                margin: '1rem 0 0 0'
                            }"
                            elevation="1"
                            @click="goTable"
                        >
                            ดูผลกิจกรรมแบบตาราง
                        </v-btn>
                    </div>
                </div>
            </div>
        </div>

        <div style="margin-top: 0.5rem; margin-bottom: 4rem;">
            <div 
                v-for="(student, index) in students" 
                :key="index" 
                style="display: flex; justify-content: center; align-items: center;"
            >
                <v-btn
                    class="custom-bg-btn"
                    :style="{
                        letterSpacing: '0.03rem',
                        lineHeight: '1.25rem',
                        height: '4.75rem',
                        backgroundColor: '#DBEBFF',
                        borderRadius: '15px',
                        border: 'solid 1px #c5d5e8',
                        margin: '5px',
                        width: '400px',
                        maxWidth: '90%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textAlign: 'left'
                    }"
                    elevation="1"
                    @click="goStdResult(student)"
                >
                    <img 
                        :src="`/api/profilePic/${student.profilePic}` || '/img/profile.png'" 
                        alt="Avatar" 
                        class="avatar"
                    />
                    <span style="margin-left: 1rem; font-size: 16px;">
                        
                        {{ student.stdFirstName }} {{ student.stdLastName }}<br>
                        <span v-if="student.attendancePercentage >= 60" style="color: green; font-weight: bold;  font-size: 14px;">
                            ผ่าน
                        </span>
                        <span v-else style="color: darkred; font-weight: bold;">
                            ไม่ผ่าน
                        </span>
                        <span style="color: gray; font-style: italic; font-size: 14px;">
                            - คิดเป็น {{ student.attendancePercentage }}%
                        </span>
                    </span>
                </v-btn>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const stdFirstName = ref('')
const stdLastName = ref('')
const depName = ref('')
const roomName = ref('')
const groupID = ref('')
const username = ref('')
const previousPage = ref('')
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

        // ตรวจสอบ response.data.data ว่ามีค่าหรือไม่
        if (!response.data || !response.data.data) {
            console.error("Error: response.data.data is undefined");
            students.value = [];
            return;
        }

        students.value = response.data.data.map(student => {
            const totalDays = student.activities.length;
            let cameDays = 0;
            let leaveDays = 0;

            student.activities.forEach(activity => {
                if (activity.checkStatus === 1) {
                    cameDays += 1;
                } else if (activity.checkStatus === 0.5) {
                    leaveDays += 1;
                }
            });

            const attendancePercentage = ((cameDays + (leaveDays * 0.5)) / totalDays) * 100;

            return {
                ...student,
                attendancePercentage: attendancePercentage.toFixed(2), // เก็บเปอร์เซ็นต์ในรูปแบบทศนิยม 2 ตำแหน่ง
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

const goTable = () => {
    localStorage.setItem('previousPage2','/teacher_result')
    router.push('/teacher_result_table')
}

const goStdResult = (student) => {
    localStorage.setItem('stdID',student.stdID)
    localStorage.setItem('stdFirstName',student.stdFirstName)
    localStorage.setItem('stdLastName',student.stdLastName)

    localStorage.setItem('previousPage','/teacher_result')
    router.push('/student_result')
}

const goback = () => {
    previousPage1.value = localStorage.getItem('previousPage1')
    router.push(`${previousPage1.value}`);
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
    top: 0; /* ติดด้านบนของหน้าจอ */
    z-index: 10; /* เพื่อให้ลอยอยู่ด้านบน */
    background-color: white; /* เพิ่มสีพื้นหลังเพื่อความชัดเจน */
}

.custom-bg-btn {
    background: rgb(219,235,255);
    background: linear-gradient(131deg, rgba(219,235,255,1) 0%, rgba(209,225,245,1) 58%, rgba(200,216,236,1) 94%);
}

</style>