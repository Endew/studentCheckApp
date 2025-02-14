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
                <div style="margin-left: 1rem;">
                    <div class="text-body">
                        <b>{{ stdFirstName }} {{ stdLastName }}</b><br>
                        {{ roomName}} {{ depName }}<br>
                        ครูที่ปรึกษา : {{ teacherFirstName }} {{ teacherLastName }}
                    </div>
                    <div class="text-body" style="margin-bottom: -14px;">
                        <b>จำนวนวันที่มาเข้าแถว</b><br>
                        <span>มา {{ cameDays.toFixed(0) }} วัน</span><br>
                        <span>ลา / สาย {{ leaveDays.toFixed(0) }} วัน</span><br>
                        <span>ขาด {{ absentDays.toFixed(0) }} วัน</span><br>
                    </div>
                    
                    <div class="text-body">
                        <b>ผลกิจกรรม</b><br>
                        <template v-if="totalDays === 0">
                            <span style="color: darkred; font-weight: bold;">ยังไม่เคยเข้าร่วมกิจกรรมเข้าแถว</span>
                        </template>
                        <template v-else-if="attendancePercentage >= 60">
                            <span style="color: green; font-weight: bold;">ผ่าน</span>
                        </template>
                        <template v-else>
                            <span style="color: darkred; font-weight: bold;">ไม่ผ่าน</span>
                        </template>
                        <template v-if="totalDays > 0">
                            <span style="color: #676767; font-style: italic;">
                                - คิดเป็น {{ attendancePercentage.toFixed(2) }}% จากทั้งหมด {{ totalDays }} วัน
                            </span><br>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 4rem;">
            <div 
                v-for="(day, index) in day" 
                :key="index"
                style="display: flex; justify-content: center; align-items: center;"
            >
                <v-btn 
                    class="custom-bg-btn"
                    :style="{
                        letterSpacing: '0.03rem',
                        height: '3.75rem',
                        borderRadius: '15px',
                        border: 'solid 1px #c5d5e8',
                        margin: '5px',
                        width: '400px',
                        maxWidth: '90%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }" 
                    elevation="1" 
                    @click="goStudentActivity(day)"
                >
                <span style="position: absolute; left: 1rem;">
                    <v-icon 
                        v-if="day.checkStatus === 1" 
                        icon="mdi-checkbox-marked" 
                        style="color: #6deb48; font-size: 45px;"
                    ></v-icon>
                    <v-icon 
                        v-if="day.checkStatus === 0" 
                        icon="mdi-close-box" 
                        style="color: #ff6f6f; font-size: 45px;"
                    ></v-icon>
                    <v-icon 
                        v-if="day.checkStatus === 0.5" 
                        icon="mdi-close-box" 
                        style="color: #ffd218; font-size: 45px;"
                    ></v-icon>
                    <!-- {{ getStatusLabel(day.checkStatus) }} :  -->
                    วันที่ {{ day.date }}
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
const teacherFirstName = ref('')
const teacherLastName = ref('')
const day = ref([])

const getStatusLabel = (checkStatus) => {
    if (checkStatus === 1) {
        return 'มา';
    } else if (checkStatus === 0) {
        return 'ขาด';
    } else if (checkStatus === 0.5) {
        return 'ลา';
    } else {
        return 'ไม่ทราบ';
    }
};

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
    username.value = storedUsername
    stdLastName.value = storedLastName
    stdFirstName.value = storedFirstName
    groupID.value = storedGroupID
    depName.value = storedDepName
    roomName.value = storedRoomName
    teacherFirstName.value = storedTeacherFname
    teacherLastName.value = storedTeacherLname
}

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
})

const goStudentActivity = (day) => {
    localStorage.setItem('dateID',day.dateID)
    localStorage.setItem('selectedDay',day.date)

    localStorage.setItem('previousPage2','/student_result')
    router.push('/student_activity')
}

const goback = () => {
    previousPage.value = localStorage.getItem('previousPage')
    router.push(`${previousPage.value}`);
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
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 4px solid white;
    object-fit: cover;
    box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.35);
    margin-bottom: 1rem;
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