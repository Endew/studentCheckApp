<template>
    <div style="background-color: #ececec; height: 100%;">
        <div class="sticky-header" style="background-color: #fff; ">
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
                <h3>จัดการห้องเรียน</h3>
            </v-sheet>
            <div style="text-align: left; margin: 2rem 1rem 0rem 3rem;">
                <b>รายละเอียดห้องเรียน</b><br>
                {{ selectedRoom.roomName }} {{ selectedRoom.depName }}<br>
                ครูที่ปรึกษา : {{ teacherFirstName }} {{ teacherLastName }}
            </div>
            <div style="text-align: center; background-color: #fff;" class="pa-5">
                <v-btn 
                    style="letter-spacing: 0.04em;"
                    color="blue-lighten-3"
                    elevation="3"
                    size="large"
                    class="ma-2 custom-bg-main-btn"
                    width="70%"
                    @click="advisorButtonAction"
                >
                    {{ advisorButtonText }}
                </v-btn>
                <v-btn 
                    style="letter-spacing: 0.04em;"
                    color="blue-lighten-3"
                    elevation="3"
                    size="large"
                    class="ma-2 custom-bg-main-btn"
                    width="70%"
                    @click="dialogAddStudent = true"
                >
                    เพิ่มรายชื่อนักศึกษา
                </v-btn>
                <v-btn 
                    style="letter-spacing: 0.04em;"
                    color="blue-lighten-3"
                    elevation="3"
                    size="large"
                    class="ma-2 custom-bg-main-btn"
                    width="70%"
                    @click="dialogUploadExcel = true"
                >
                    เพิ่มรายชื่อจาก Excel
                </v-btn>
            </div>
        </div>
        <div style="margin-top: 0.75rem; margin-bottom: 6rem;">
            <div 
                v-for="(student, index) in list" 
                :key="index" 
                style="display: flex; justify-content: center; align-items: center;"
            >
                <v-btn
                    class="custom-bg-btn"
                    :style="{
                        letterSpacing: '0.03rem',
                        height: '4.5rem',
                        backgroundColor: '#DBEBFF',
                        borderRadius: '15px',
                        border: 'solid 1px #c5d5e8',
                        margin: '5px',
                        width: '400px',
                        maxWidth: '90%'
                    }"
                    elevation="1"
                    @click="selectStudent(student)"
                >
                    <span style="position: absolute; left: 1.5rem; font-size: medium; text-align: left; display: flex;">
                        <img :src="`/api/profilePic/${student.profilePic}`" 
                            class="avatar"
                            style="width: 40px; height: 40px; border-radius: 50%; margin-right: 1rem;" />
                        <div>
                            <div style="padding-top: 0px;">
                                {{ student.stdFirstName }} {{ student.stdLastName }}
                            </div>
                            <div style="padding-top: 4px;;">
                                <span v-if="student.statusID === '1'" style="color: #999999;">นักศึกษา</span>
                                <span v-else-if="student.statusID === '2'" style="font-weight: bold; color: #727272">ผู้ช่วยครู <v-icon icon="mdi-star" style="color: #ffc300;"></v-icon></span>
                                <span v-else>อื่น ๆ</span>
                            </div>
                    </div>
                        
                    </span>
                    <span></span>
                </v-btn>
            </div>
        </div>

        <!-- Dialog เพิ่มนักศึกษา -->
        <v-dialog v-model="dialogAddStudent" max-width="500px">
            <v-card>
                <v-card-title>เพิ่มรายชื่อนักศึกษา</v-card-title>
                <v-card-text>
                    <v-select v-model="title" :items="titles" item-value="value" item-title="title" label="คำนำหน้า" />
                    <v-text-field v-model="fname" label="ชื่อจริง" />
                    <v-text-field v-model="lname" label="นามสกุล" />
                    <v-text-field v-model="studentid" label="รหัสนักศึกษา" />
                    <v-text-field v-model="id" label="รหัสประจำตัวประชาชน" />
                </v-card-text>
                <v-card-actions class="d-flex justify-end">
                    <v-btn color="primary" @click="addStudent">บันทึก</v-btn>
                    <v-btn text @click="dialogAddStudent = false">ยกเลิก</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Dialog to edit student info -->
        <v-dialog v-model="dialogVisible" max-width="500px">
            <v-card>
                <v-card-title>แก้ไขข้อมูลนักศึกษา</v-card-title>
                <v-card-text>
                    <v-text-field v-model="selectedStudentFname" label="ชื่อ" />
                    <v-text-field v-model="selectedStudentLname" label="นามสกุล" />
                    <v-select v-model="editedStatus" :items="statusOptions" item-title="text" item-value="value" label="สถานะ" />
                </v-card-text>
                <v-card-actions class="d-flex justify-space-between">
                    <v-btn color="red" @click="confirmDelete">ลบ</v-btn>
                    <div>
                        <v-btn color="primary" @click="saveStatus">บันทึก</v-btn>
                        <v-btn text @click="dialogVisible = false">ยกเลิก</v-btn>
                    </div>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogTeacher" max-width="500px">
            <v-card>
                <v-card-title>แก้ไขข้อมูลครูที่ปรึกษา</v-card-title>
                <v-card-text>
                    <v-text-field v-model="teacherFirstName" label="ชื่อ" />
                    <v-text-field v-model="teacherLastName" label="นามสกุล" />
                </v-card-text>
                <v-card-actions class="d-flex">
                    <v-btn color="primary" @click="saveTeacher">บันทึก</v-btn>
                    <v-btn text @click="dialogTeacher = false">ยกเลิก</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="deleteDialog" max-width="400px">
            <v-card>
                <v-card-title>ยืนยันการลบ</v-card-title>
                <v-card-text>
                    ต้องการลบรายชื่อนักศึกษาคนนี้หรือไม่ ?<br>
                    <span style="color: red;">- {{ selectedStudentFname }} {{ selectedStudentLname }}</span>
                </v-card-text>
                <v-card-actions class="d-flex justify-end">
                    <v-btn color="red" @click="deleteStudent">ยืนยันการลบ</v-btn>
                    <v-btn text @click="deleteDialog = false">ยกเลิก</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Dialog แจ้งเตือน -->
        <v-dialog v-model="dialogAlert" max-width="400px">
            <v-card>
                <v-card-title>แจ้งเตือน</v-card-title>
                <v-card-text>{{ alertMessage }}</v-card-text>
                <v-card-actions class="d-flex justify-end">
                    <v-btn color="primary" @click="dialogAlert = false">ตกลง</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogUploadExcel" max-width="500px">
            <v-card>
                <v-card-title>อัปโหลดรายชื่อจากไฟล์ Excel</v-card-title>
                <v-card-text>
                    <v-file-input 
                        v-model="selectedFile" 
                        label="เลือกไฟล์ Excel" 
                        accept=".xlsx, .xls" 
                        show-size 
                    />
                </v-card-text>
                <v-card-actions class="d-flex justify-space-between">
                    <v-btn 
                        @click="downloadTemplate" color="grey"
                    >
                        โหลดไฟล์ตัวอย่าง
                    </v-btn>
                    <div>
                        <v-btn color="primary" @click="uploadExcel">อัปโหลด</v-btn>
                        <v-btn text @click="dialogUploadExcel = false">ยกเลิก</v-btn>
                    </div>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const selectedRoom = ref({});
const list = ref([]);
const previousPage2 = ref('');

const dialogVisible = ref(false);
const editedStatus = ref('');
const selectedStudentID = ref('')
const selectedStudentFname = ref('')
const selectedStudentLname = ref('')
const advisorName = ref('');
const alertMessage = ref('');
const teacherFirstName = ref('')
const teacherLastName = ref('')

const title = ref('');
const fname = ref('');
const lname = ref('');
const studentid = ref('');
const id = ref('');

const deleteDialog = ref(false);
const dialogAddStudent = ref(false);
const dialogTeacher = ref(false)
const dialogAlert = ref(false);

const titles = [
  { title: "นาย", value: "นาย" },
  { title: "นาง", value: "นาง" },
  { title: "นางสาว", value: "นางสาว" }
];

const dialogUploadExcel = ref(false);
const selectedFile = ref(null);

const downloadTemplate = () => {
    window.open('/api/templates/student_template.xlsx', '_blank');
};


// Computed properties เพื่อตรวจสอบค่า adviserID
const isAdvisorEmpty = computed(() => localStorage.getItem('adviserID') === '0');

const advisorButtonText = computed(() => isAdvisorEmpty.value ? 'เพิ่มรายชื่อครูที่ปรึกษา' : 'แก้ไขรายชื่อครูที่ปรึกษา');
const advisorButtonAction = computed(() => isAdvisorEmpty.value ? goAddTeacher : goEditTeacher);

const goEditTeacher = () => {
    dialogTeacher.value = true
}

const saveTeacher = async () => {
    const data = {
        teacherFirstName: teacherFirstName.value,
        teacherLastName: teacherLastName.value,
        adviserID: localStorage.getItem('adviserID')
    }
    const response = await axios.post('/api/editTeacher', data)

    if (response.data.message) {
        console.log('Edit successful')
        dialogTeacher.value = false
        loadData()
    } else {
        console.log("Can't edit teacher")
    }
}

const uploadExcel = async () => {
    if (!selectedFile.value) {
        alertMessage.value = "กรุณาเลือกไฟล์ก่อน!";
        dialogAlert.value = true;
        return;
    }

    // ดึง groupID จาก localStorage
    const groupID = localStorage.getItem('groupID');
    if (!groupID) {
        alertMessage.value = "ไม่พบข้อมูลกลุ่มในระบบ!";
        dialogAlert.value = true;
        return;
    }

    let formData = new FormData();
    formData.append("file", selectedFile.value);
    formData.append("groupID", groupID);

    try {
        const response = await axios.post('/api/uploadExcel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.status === 1) {
            alertMessage.value = "อัปโหลดสำเร็จ!";
            dialogUploadExcel.value = false;
            listStudent(); // รีเฟรชรายชื่อ
        } else {
            alertMessage.value = `เกิดข้อผิดพลาด: ${response.data.error}`;
        }
    } catch (error) {
        alertMessage.value = "เกิดข้อผิดพลาดในการอัปโหลด!";
    }

    dialogAlert.value = true;
};

const addStudent = async () => {
    if (!title.value || !fname.value || !lname.value || !studentid.value || !id.value) {
        alertMessage.value = "กรุณากรอกข้อมูลให้ครบถ้วน!";
        dialogAlert.value = true;
        return;
    }

    const groupID = localStorage.getItem('groupID');
    const data = {
        title: title.value,
        fname: fname.value,
        lname: lname.value,
        studentid: studentid.value,
        id: id.value,
        groupID,
        profilePic: "profile.png"
    };

    try {
        const response = await axios.post('/api/addStudent', data);

        if (response.data.status === 1) {
            alertMessage.value = "เพิ่มข้อมูลนักศึกษาเรียบร้อยแล้ว!";
            dialogAddStudent.value = false;
            title.value = fname.value = lname.value = studentid.value = id.value = '';
            listStudent()
        } else {
            alertMessage.value = `ไม่สามารถเพิ่มข้อมูลได้: ${response.data.error}`;
        }
    } catch (error) {
        alertMessage.value = "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง!";
    }

    dialogAlert.value = true;
};

const statusOptions = [
    { text: 'นักศึกษา', value: '1' },
    { text: 'ผู้ช่วยครู', value: '2' },
];

const selectStudent = (student) => {
    selectedStudentID.value = student.stdID;
    editedStatus.value = student.statusID; 
    selectedStudentFname.value = student.stdFirstName;
    selectedStudentLname.value = student.stdLastName;
    dialogVisible.value = true;
};

const saveStatus = async () => {
    try {
        await axios.get(`/api/updateStatus?stdID=${selectedStudentID.value}&statusID=${editedStatus.value}&stdFirstName=${selectedStudentFname.value}&stdLastName=${selectedStudentLname.value}`);
        listStudent();
    } catch (error) {
        console.error('Error update student status:', error);
    }
    dialogVisible.value = false;
}

const confirmDelete = () => {
    dialogVisible.value = false
    deleteDialog.value = true;
};

const deleteStudent = async () => {
    try {
        await axios.get(`/api/deleteStudent?stdID=${selectedStudentID.value}`);
        listStudent();
    } catch (error) {
        console.error('Error deleting student:', error);
    }
    deleteDialog.value = false;
    dialogVisible.value = false;
};

const listStudent = async () => {
    const groupID = localStorage.getItem('groupID');
    try {
        const response = await axios.get(`/api/listStudent?groupID=${groupID}`);
        list.value = response.data;
        console.log(list.value)
    } catch (error) {
        console.error('Error fetching student list:', error);
    }
};

const loadSelectedRoom = () => {
    const storedRoom = JSON.parse(localStorage.getItem('selectedRoom'));
    if (storedRoom) {
        selectedRoom.value = storedRoom;
    }
};

const loadData = async () => {
    const group = JSON.parse(localStorage.getItem('selectedRoom'));
    localStorage.setItem('groupID', group.groupID);

    const ID = localStorage.getItem('groupID')
    const response = await axios.get(`/api/getAdviserID?groupID=${ID}`)
    console.log('responseAdviserID=',response.data)
    localStorage.setItem('adviserID',response.data.adviserID)
    localStorage.setItem('teacherFirstName',response.data.teacherFirstName)
    localStorage.setItem('teacherLastName',response.data.teacherLastName)

    teacherFirstName.value = localStorage.getItem('teacherFirstName')
    teacherLastName.value = localStorage.getItem('teacherLastName')
};

const loadAdvisor = () => {
    const adviserID = localStorage.getItem('adviserID');
    const firstName = localStorage.getItem('teacherFirstName');
    const lastName = localStorage.getItem('teacherLastName');
    
    if (adviserID === '0') {
        advisorName.value = 'ยังไม่ได้กำหนดครูที่ปรึกษา';
    } else {
        advisorName.value = `${firstName} ${lastName}`;
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
    loadSelectedRoom();
    loadData();
    listStudent();
    loadAdvisor();
});

const goAddTeacher = () => {
    router.push('/add_teacher');
};

const goAddStudent = () => {
    router.push('/add_student');
};

const goback = () => {
    previousPage2.value = localStorage.getItem('previousPage2');
    router.push(previousPage2.value);
};
</script>

<style lang="scss" scoped>
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

.custom-bg {
    background: rgb(25, 118, 210);
    background: linear-gradient(350deg, rgba(25, 118, 210, 1) 0%, rgba(33, 150, 243, 1) 50%, rgba(33, 150, 243, 1) 70%, rgba(100, 181, 246, 1) 100%);
}

.custom-bg-main-btn {
    background: rgb(156,214,255);
    background: linear-gradient(131deg, rgba(156,214,255,1) 0%, rgba(147,205,246,1) 50%, rgba(147,205,246,1) 100%);
    border: solid 1px #87bbe0;
}

.avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 1px solid white;
    object-fit: cover;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.35);
}
</style>
