<template>
    <div>
        <v-sheet
            class="custom-bg"
            style="display: flex; background-color: #1E88E5; padding: 1rem; padding-top: 2rem; margin-top: -1rem;"
            rounded="lg"
            elevation="2"
        >
            <v-icon
                style="margin-right: 0.75rem;"
                icon="mdi-keyboard-backspace"
                @click="goback"
            ></v-icon>
            <h3>เพิ่มครูที่ปรึกษา</h3>
        </v-sheet>
        <div style="margin-top: 1.5rem;">
            <span style="font-size: 18px; font-weight: bold; margin: 0 2rem 0 2rem;">เพิ่มจากรายชื่อที่มี</span>
            <v-select
                variant="outlined"
                rounded="xl"
                style="margin: 0.5rem 2rem 0.5rem 2rem;"
                placeholder="เลือกครูที่ปรึกษา"
            >

            </v-select>
            <span style="font-size: 18px; font-weight: bold; margin: 0rem 2rem 0 2rem;">เพิ่มรายชื่อใหม่</span>
            <div style="max-width: 500px; margin: 0.5rem 2rem 0 2rem;">
                <v-text-field v-model="fname" variant="outlined" rounded="xl" label="ชื่อจริง"></v-text-field>
                <v-text-field v-model="lname" variant="outlined" rounded="xl" label="นามสกุล"></v-text-field>
                <v-text-field v-model="teacherID" variant="outlined" rounded="xl" label="ชื่อผู้ใช้"></v-text-field>
                <v-text-field v-model="id" variant="outlined" rounded="xl" label="รหัสผ่าน"></v-text-field>
                <v-btn
                    style="padding-left: 25%; padding-right: 25%; letter-spacing: 0.04em;" 
                    color="#99CCFF"
                    width="100%"
                    rounded="xl"
                    size="large"
                    elevation="2"
                    class="custom-bg-main-btn"
                    @click="addTeacher"
                >บันทึก</v-btn>
            </div>
        </div>

        <!-- Dialog แจ้งเตือน -->
        <v-dialog v-model="dialogVisible" max-width="400px">
            <v-card>
                <v-card-title>{{ dialogTitle }}</v-card-title>
                <v-card-text>{{ dialogMessage }}</v-card-text>
                <v-card-actions>
                    <v-btn color="primary" @click="dialogVisible = false">ตกลง</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const title = ref('ครู');
const fname = ref('')
const lname = ref('')
const teacherID = ref('')
const id = ref('')
const dialogVisible = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');

// const titles = ref([
//   { title: "นาย", value: "นาย" },
//   { title: "นาง", value: "นาง" },
//   { title: "นางสาว", value: "นางสาว" }
// ]);

// ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
const isFormValid = computed(() => {
    return title.value && fname.value && lname.value && teacherID.value && id.value;
});

const addTeacher = async () => {
    if (!isFormValid.value) {
        dialogTitle.value = "ข้อผิดพลาด";
        dialogMessage.value = "กรุณากรอกข้อมูลให้ครบถ้วน!";
        dialogVisible.value = true;
        return;
    }

    const groupIDFromStorage = localStorage.getItem('groupID');
    if (!groupIDFromStorage) {
        dialogTitle.value = "ข้อผิดพลาด";
        dialogMessage.value = "ไม่พบ groupID ในระบบ!";
        dialogVisible.value = true;
        return;
    }

    const data = {
        title: title.value,
        fname: fname.value,
        lname: lname.value,
        teacherID: teacherID.value,
        id: id.value,
        profilePic: "profile.png"
    };

    try {
        const response = await axios.post('/api/addTeacher', data);
        const teacherUserName = response.data.teacherUserName;

        const findID = await axios.post('/api/getAdviserID', { teacherUserName });
        
        if (!findID.data.adviserID) {
            throw new Error("ไม่พบ adviserID");
        }
        const adviserID = findID.data.adviserID;

        await axios.post('/api/addTeacherGroup', { 
            adviserID, 
            groupID: groupIDFromStorage // ใช้ groupID จาก localStorage
        });

        // แจ้งเตือนสำเร็จ
        dialogTitle.value = "สำเร็จ";
        dialogMessage.value = "เพิ่มข้อมูลอาจารย์และอัปเดตกลุ่มสำเร็จ!";
        dialogVisible.value = true;

        // ล้างค่าในฟอร์ม
        fname.value = '';
        lname.value = '';
        teacherID.value = '';
        id.value = '';

        // เปลี่ยนเส้นทางไปหน้า /manage_group
        setTimeout(() => {
            router.push('/manage_group');
        }, 3000); // ให้เวลา 2 วินาทีสำหรับการแสดงผลแจ้งเตือนก่อน

    } catch (error) {
        dialogTitle.value = "ข้อผิดพลาด";
        dialogMessage.value = error.response?.data?.message || "ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองอีกครั้ง!";
        dialogVisible.value = true;
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

});

const goback = () => {
    router.push('/manage_room');
};
</script>

<style lang="scss" scoped>
.custom-bg {
    background: rgb(25, 118, 210);
    background: linear-gradient(350deg, rgba(25, 118, 210, 1) 0%, rgba(33, 150, 243, 1) 50%, rgba(33, 150, 243, 1) 70%, rgba(100, 181, 246, 1) 100%);
}

.custom-bg-main-btn {
    background: rgb(156,214,255);
    background: linear-gradient(131deg, rgba(156,214,255,1) 0%, rgba(147,205,246,1) 50%, rgba(147,205,246,1) 100%);
    border: solid 1px #87bbe0;
}
</style>