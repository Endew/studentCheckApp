<template>
    <div style="background-color: #ececec; height: 100%;">
        <div class="sticky-header">
            <v-sheet
                class="custom-bg"
                style="display: flex; padding: 1rem; padding-top: -1rem;  border-radius: 0px 0px 14px 14px;"
                elevation="3"
            >
                <div 
                    class="d-flex align-center justify-space-between ma-2"
                >
                    <div>
                        <h3>หน้าแรก</h3>
                    </div>
                    <div style="position: absolute; right: 1.5rem;">
                        <v-icon
                            icon="mdi-logout"
                            size="2rem"
                            color="white"
                            @click="logoutDialog = true"
                        ></v-icon>
                    </div>
                </div>
            </v-sheet>
        </div>
        <div class="profile-container pa-4">
            <div class="avatar-container">
                <img 
                    :src="profileImageUrl ? `/api/profilePic/${profileImageUrl}` : '/img/profile.png'" 
                    alt="Avatar" 
                    class="avatar"
                    @click="openDialog"
                />
                <br>
                <b style="font-size: 20px;">{{ teacherFirstName }} {{ teacherLastName }}</b><br>
                <span style="color: grey;">{{ statusName }}</span>

                <!-- Dialog for Image Upload -->
                <v-dialog v-model="dialog" max-width="400px">
                    <v-card>
                        <v-card-title>
                            <span>อัพโหลดรูปโปรไฟล์</span>
                        </v-card-title>
                        <v-card-text>
                            <div>
                                <v-file-input
                                    accept="image/*"
                                    label="เลือกรูปภาพ"
                                    @change="onFileChange"
                                />
                                <div v-if="previewImage" style="text-align: center; margin-top: 1rem;">
                                    <img :src="previewImage" alt="Preview" style="max-width: 100%; border-radius: 10px;" />
                                </div>
                            </div>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn color="blue" text @click="dialog = false">ยกเลิก</v-btn>
                            <v-btn color="green" text @click="uploadImage">อัพโหลด</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </div>
            <v-card class="profile-card" elevation="1">
                <div style="margin-left: 1rem;">
                    <div class="text-body">
                        ชื่อผู้ใช้ : {{ username }}<br>
                        ครูที่ปรึกษาประจำห้อง : {{ roomName}}<br>
                        แผนก : {{ depName }}<br>
                        เบอร์โทรศัพท์ : {{ tel }}<br>
                        อีเมล : {{ email }}
                    </div>
                    <v-icon
                        style="letter-spacing: 0.04em; position: absolute; top: 20px; right: 20px;"
                        color="grey"
                        @click="openEditDialog"
                    >
                        mdi-pencil
                    </v-icon>
                </div>
            </v-card>
            <v-card class="profile-card" elevation="1" style="margin-top: 1rem;">
                <div style="margin-left: 1rem;">
                    
                </div>
            </v-card>
            
            <div
                class="d-flex align-center justify-center"
                style="flex-direction: column; width: 90%; max-width: 350px;"
            >
                <v-btn 
                    style="width: 100%; letter-spacing: 0.04em;"
                    elevation="3"
                    class="ma-4 custom-bg-main-btn"
                    @click="goResult"
                >
                    ผลการเข้าแถว
                </v-btn>

                <v-btn 
                    style="width: 100%; letter-spacing: 0.04em;"
                    class="custom-bg-main-btn"
                    elevation="3"
                    @click="goCheck"
                >
                    เช็คชื่อ
                </v-btn>

                <v-btn 
                    style="width: 100%; letter-spacing: 0.04em;"
                    elevation="3"
                    class="ma-4 custom-bg-main-btn"
                    @click="loadSelectedRoom"
                >
                    จัดการรายชื่อนักเรียน
                </v-btn>
            </div>
        </div>

        <!-- Logout Confirmation Dialog -->
        <v-dialog v-model="logoutDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">ยืนยันการออกจากระบบ</v-card-title>
                <v-card-text>คุณต้องการออกจากระบบหรือไม่?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="logoutDialog = false">ยกเลิก</v-btn>
                    <v-btn color="red" text @click="confirmLogout">ออกจากระบบ</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- แสดง Dialog สำหรับการแก้ไขข้อมูล -->
        <v-dialog v-model="editDialog" max-width="400px">
            <v-card>
                <v-card-title>
                    <span>แก้ไขข้อมูล</span>
                </v-card-title>
                <v-card-text>
                    <v-text-field v-model="teacherFirstName" label="ชื่อ" />
                    <v-text-field v-model="teacherLastName" label="นามสกุล" />
                    <v-text-field v-model="tel" label="เบอร์โทรศัพท์" />
                    <v-text-field v-model="email" label="อีเมล" />
                </v-card-text>
                <v-card-actions>
                    <v-btn color="blue" text @click="editDialog = false">ยกเลิก</v-btn>
                    <v-btn color="green" text @click="saveChanges">บันทึก</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>       
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const teacherFirstName = ref('')
const teacherLastName = ref('')
const adviserID = ref('')
const statusName = ref('')
const groupID = ref('')
const depName = ref('')
const roomName = ref('')
const logoutDialog = ref(false)
const tel = ref('')
const email = ref('')

const profileImageUrl = ref('') // URL สำหรับรูปภาพโปรไฟล์
const dialog = ref(false) // เปิด/ปิด dialog
const previewImage = ref(null) // พรีวิวรูปภาพ
const selectedFile = ref(null) // ไฟล์ที่เลือก

const editDialog = ref(false)  // เปิด/ปิด dialog แก้ไขข้อมูล

// เปิด dialog แก้ไขข้อมูล
const openEditDialog = () => {
    editDialog.value = true
}

// บันทึกการเปลี่ยนแปลง
const saveChanges = async () => {
    const updatedData = {
        adviserID: localStorage.getItem('adviserID'),
        teacherFirstName: teacherFirstName.value,
        teacherLastName: teacherLastName.value,
        tel: tel.value,
        email: email.value,
    }

    console.log(updatedData); // ตรวจสอบค่าที่ส่งไป

    try {
        // ส่งข้อมูลการเปลี่ยนแปลงไปยัง API
        const response = await axios.post('/api/updateTeacherProfile', updatedData)

        // ตรวจสอบว่าอัปเดตสำเร็จ
        if (response.data.status) {
            // ปิด dialog
            editDialog.value = false
            // อัปเดตข้อมูลใน localStorage
            localStorage.setItem('teacherFirstName', teacherFirstName.value)
            localStorage.setItem('teacherLastName', teacherLastName.value)
            localStorage.setItem('tel', tel.value)
            localStorage.setItem('email', email.value)

            // โหลดข้อมูลใหม่เพื่ออัปเดต UI
            loadData()
        } else {
            console.error('ไม่สามารถบันทึกการเปลี่ยนแปลงได้')
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล', error)
    }
}

// เปิด dialog
const openDialog = () => {
  dialog.value = true
}

// เมื่อเลือกไฟล์
const onFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// อัพโหลดรูปภาพ
const uploadImage = async () => {
    if (!selectedFile.value) return;

    const formData = new FormData();
    formData.append('profileImage', selectedFile.value);

    // ดึง adviserID จาก localStorage
    const adviserID = localStorage.getItem('adviserID');
    if (!adviserID) {
        console.error('adviserID หายไป');
        return;
    }

    formData.append('adviserID', adviserID);

    try {
        // ส่งคำขออัปโหลดไปยัง API
        const response = await axios.post('/api/uploadProfileTeacher', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('อัพโหลดสำเร็จ', response.data);
        getProfile()

        // อัปเดต URL ของรูปภาพโปรไฟล์ใหม่
        profileImageUrl.value = response.data.imageUrl;

        // ปิด dialog
        dialog.value = false;

        // โหลดข้อมูลใหม่เพื่ออัปเดต UI
        loadData();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัพโหลด', error);
    }
};

const loadSelectedRoom = async () => {
    const ID = localStorage.getItem('groupID')
    const response = await axios.get(`/api/getSelectedRoom?groupID=${ID}`)
    console.log(response.data)
    const data = {
        roomName: response.data.roomName,
        depName: response.data.depName,
        groupID: Number(response.data.groupID)
    }
    localStorage.setItem('selectedRoom', JSON.stringify(data))

    localStorage.setItem('previousPage2', "/teacher")
    router.push('/manage_room')
}

const loadadviserID = () => {
    const storedAdviserID = localStorage.getItem('adviserID')
    adviserID.value = storedAdviserID
}

const loadStatus = async () => {
    const ID = localStorage.getItem('statusID')
    const response = await axios.get(`/api/getStatus?statusID=${ID}`)
    console.log("response=",response.data)
    const storedStatusName = response.data.statusName
    localStorage.setItem("statusName", storedStatusName)
    statusName.value = storedStatusName
}

const loadData = async () => {
    const storedFirstName = localStorage.getItem('teacherFirstName')
    const storedLastName = localStorage.getItem('teacherLastName')
    const storedGroupID = localStorage.getItem('groupID')
    const storedUsername = localStorage.getItem('username')
    const storedPic = localStorage.getItem('profilePic')
    const storedTel = localStorage.getItem('tel')
    const storedEmail = localStorage.getItem('email')
    profileImageUrl.value = storedPic
    username.value = storedUsername
    teacherFirstName.value = storedFirstName
    teacherLastName.value = storedLastName
    groupID.value = storedGroupID
    tel.value = storedTel
    email.value = storedEmail

    const ID = localStorage.getItem('groupID')
    const response = await axios.get(`/api/getSelectedRoom?groupID=${ID}`)
    console.log(response.data)

    const storedDepName = response.data.depName
    const storedRoomName = response.data.roomName
    localStorage.setItem("depName",storedDepName)
    localStorage.setItem("roomName",storedRoomName)
    depName.value = storedDepName
    roomName.value = storedRoomName
}

const getProfile = async () => {
    const ID = localStorage.getItem('adviserID');
    if (!ID) {
        console.error('adviserID is missing');
        return;
    }

    try {
        const response = await axios.get(`/api/getProfileTeacher?adviserID=${ID}`);
        const newProfilePic = response.data.profilePic;

        // อัปเดตใน localStorage
        localStorage.setItem('profilePic', newProfilePic);

        // อัปเดต URL ของรูปโปรไฟล์
        profileImageUrl.value = newProfilePic; // ใช้ .value สำหรับ reactive ref
        loadData(); // โหลดข้อมูลใหม่
    } catch (error) {
        console.error('Error fetching profile:', error);
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

    loadadviserID();
    loadStatus()
    loadData()
})

const goResult = () => {
    localStorage.setItem('previousPage1', "/teacher")
    router.push('/teacher_result')
}

const goCheck = () => {
    localStorage.setItem('previousPage', "/teacher")
    router.push('/listchecker')
}

const confirmLogout = () => {
    localStorage.clear()
    router.push('/login')
}

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

.sticky-header {
    position: sticky;
    top: 0; /* ติดด้านบนของหน้าจอ */
    z-index: 10; /* เพื่อให้ลอยอยู่ด้านบน */
    background-color: white; /* เพิ่มสีพื้นหลังเพื่อความชัดเจน */
}

.custom-bg-main-btn {
    background: rgb(156,214,255);
    background: linear-gradient(131deg, rgba(156,214,255,1) 0%, rgba(147,205,246,1) 50%, rgba(147,205,246,1) 100%);
    border: solid 1px #87bbe0;
}
</style>