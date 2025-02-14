<template>
    <div>
        <div class="sticky-header">
            <v-sheet
                class="custom-bg"
                style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; padding-top: -2rem; border-radius: 0px 0px 14px 14px;"
                elevation="3"
            >
                <div style="display: flex; align-items: center;">
                    <v-icon
                        style="margin-right: 0.75rem;"
                        icon="mdi-keyboard-backspace"
                        @click="goback"
                    ></v-icon>
                    <h3>{{ selectedDay }}</h3>
                </div>
                <!-- <v-btn
                    @click="saveActivity"
                >
                    บันทึก
                </v-btn> -->
            </v-sheet>
            <div class="image-container" style="margin-top: 2rem; padding-bottom: 2rem;">
                <img 
                    :src="`/api/pic/${CheckPicture}`" 
                    class="check-picture"
                    @click="openLightbox(CheckPicture)"
                />

                <VueEasyLightbox
                    :visible="showLightbox"
                    :imgs="imageSrc"
                    @hide="showLightbox = false"
                />
            </div>
            <!-- <div style=" display: flex; justify-content: center; align-items: center;">
                <v-btn 
                    style="width: 100%; letter-spacing: 0.04em; max-width: 300px; margin-bottom: 1.5rem;"
                    class="custom-bg-main-btn"
                    @click="openDialog"
                >
                    อัพโหลดรูปภาพ
                </v-btn>
            </div> -->
        </div>
        
        <div style="margin-top: -0.75rem; margin-bottom: 4rem;">
            <div 
                v-for="(student, index) in list"
                :key="index" 
                style="display: flex; justify-content: center; align-items: center;"
            >
                <v-btn
                    class="custom-bg-btn"
                    :style="{
                        letterSpacing: '0.03rem',
                        height: '3.75rem',
                        backgroundColor: '#DBEBFF',
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
                >
                    <div style="display: flex; align-items: center; flex: 1;">
                        <img :src="`/api/profilePic/${student.profilePic}`" 
                            class="avatar"
                            style="width: 40px; height: 40px; border-radius: 50%;" />
                        <div style="margin-left: 10px; display: flex; flex-direction: column; justify-content: center;">
                            <div style="font-size: 1rem; font-weight: normal;">
                                {{ student.stdFirstName }} {{ student.stdLastName }}
                            </div>
                        </div>
                    </div>
                    
                    <span style="position: absolute; right: 1rem;">
                        <v-icon v-if="student.selectedValue === 'มา'" color="#6deb48" size="45">mdi-checkbox-marked</v-icon>
                        <v-icon v-else-if="student.selectedValue === 'ลา'" color="#ffd218" size="45">mdi-close-box</v-icon>
                        <v-icon v-else color="#ff6f6f" size="45">mdi-close-box</v-icon>
                    </span>
                </v-btn>
            </div>
        </div>
        <!-- Dialog for Image Upload -->
        <v-dialog v-model="dialog" max-width="400px">
            <v-card>
                <v-card-title>
                    <span>อัพโหลดรูปภาพ</span>
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
</template>

<script setup>
import VueEasyLightbox from 'vue-easy-lightbox'
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const list = ref([]); // Array สำหรับเก็บรายชื่อจากเซิร์ฟเวอร์
const selectedDay = ref('')
const previousPage2 = ref('')
const CheckPicture = ref('')

const profileImageUrl = ref('') // URL สำหรับรูปภาพโปรไฟล์
const dialog = ref(false) // เปิด/ปิด dialog
const previewImage = ref(null) // พรีวิวรูปภาพ
const selectedFile = ref(null) // ไฟล์ที่เลือก

const showLightbox = ref(false)
const imageSrc = ref('')

const openLightbox = (img) => {
  imageSrc.value = `/api/pic/${img}`
  showLightbox.value = true
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

    // ดึง dateID จาก localStorage
    const dateID = localStorage.getItem('dateID');
    if (!dateID) {
        console.error('dateID หายไป');
        return;
    }

    formData.append('dateID', dateID);

    try {
        // ส่งคำขออัปโหลดไปยัง API
        const response = await axios.post('/api/uploadPicture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('อัพโหลดสำเร็จ', response.data);

        // อัปเดต URL ของรูปภาพโปรไฟล์ใหม่
        profileImageUrl.value = response.data.imageUrl;

        // เก็บ imgID ที่ได้จากการอัปโหลด
        const imgID = response.data.imgID;
        localStorage.setItem('imgID', imgID);

        // ปิด dialog
        dialog.value = false;

        // โหลดข้อมูลใหม่เพื่ออัปเดต UI
        loadData();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัพโหลด', error);
    }
};

const loadData = async () => {
    try {
        const storedSelectedDay = localStorage.getItem('selectedDay');
        const groupID = localStorage.getItem('groupID')
        selectedDay.value = storedSelectedDay;

        const response = await axios.get(`/api/getDateID?date=${storedSelectedDay}&groupID=${groupID}`);
        localStorage.setItem('dateID', response.data.dateID);
        console.log(response.data);

        const getImgID = await axios.get(`/api/getImgID?dateID=${response.data.dateID}&groupID=${groupID}`);
        localStorage.setItem('imgID', getImgID.data.imgID);
        console.log('imgID=', getImgID.data.imgID);

        const getImgName = await axios.get(`/api/getImgName?imgID=${getImgID.data.imgID}`);
        localStorage.setItem('imgName', getImgName.data.imgName); // Removed extra '=' in key
        console.log('imgName=', getImgName.data.imgName);

        CheckPicture.value = getImgName.data.imgName
    } catch (error) {
        console.error('Error loading data:', error);
    }
};

const listStudent = async () => {
    const groupID = localStorage.getItem('groupID');
    const dateID = localStorage.getItem('dateID'); // ดึง dateID จาก localStorage

    try {
        const [studentsResponse, attendanceResponse] = await Promise.all([
            axios.get(`/api/listStudent?groupID=${groupID}`),
            axios.get(`/api/getAttendance?groupID=${groupID}&dateID=${dateID}`)
        ]);

        const attendanceMap = {};
        attendanceResponse.data.forEach(record => {
            attendanceMap[record.stdID] = record.checkStatus;
        });

        list.value = studentsResponse.data.map(student => ({
            ...student,
            selectedValue: attendanceMap[student.stdID] !== undefined
                ? (attendanceMap[student.stdID] === 1 ? 'มา' : attendanceMap[student.stdID] === 0.5 ? 'ลา' : 'ขาด')
                : 'มา'
        }));

    } catch (error) {
        console.error('Error fetching student list or attendance:', error);
    }
};

// ฟังก์ชันสำหรับบันทึกข้อมูล
const saveActivity = async () => {
    // รวบรวม stdID, selectedValue, และ checkStatus ของแต่ละ student
    const studentData = list.value.map(student => {
        let checkStatus = 1; // กำหนดค่าเริ่มต้นเป็น 0
        if (student.selectedValue === 'มา') {
            checkStatus = 1;
        } else if (student.selectedValue === 'ลา') {
            checkStatus = 0.5;
        } else if (student.selectedValue === 'ขาด') {
            checkStatus = 0;
        }

        return {
            stdID: student.stdID,
            checkStatus: checkStatus,
            groupID: Number(localStorage.getItem('groupID')),
            dateID: Number(localStorage.getItem('dateID'))
        };
    });

    console.log('studentData=', studentData);
    try {
        const response = await axios.post('/api/insertActivity', { studentData });
        console.log('Save activity response:', response.data);
        console.log('บันทึกข้อมูลสำเร็จ!');
    } catch (error) {
        console.error('Error saving activity:', error);
        console.log('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
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
    listStudent() // เรียกหลังจาก groupID พร้อม
});

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

.avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 1px solid white;
    object-fit: cover;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.35);
}

.image-container {
    display: flex;
    justify-content: center;  /* จัดให้อยู่กลางในแนวนอน */
    align-items: center;      /* จัดให้อยู่กลางในแนวตั้ง */
    height: 15rem;            /* กำหนดความสูงของ container ให้เต็มหน้าจอ */
    margin-bottom: 1rem;
}

.check-picture {
    max-width: 100%;   /* ปรับขนาดให้เหมาะสม */
    height: 15rem;      /* ป้องกันไม่ให้ภาพยืด */
    border-radius: 10%;
    border: 1px solid white;
    object-fit: cover;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.35);
}

.custom-bg-main-btn {
    background: rgb(156,214,255);
    background: linear-gradient(131deg, rgba(156,214,255,1) 0%, rgba(147,205,246,1) 50%, rgba(147,205,246,1) 100%);
    border: solid 1px #87bbe0;
}
</style>
