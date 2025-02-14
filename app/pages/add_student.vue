<template>
    <div>
        <v-sheet
            style="display: flex; background-color: #1E88E5; padding: 1rem; padding-top: 2rem; margin-top: -1rem;"
            rounded="lg"
        >
            <v-icon
                style="margin-right: 0.75rem;"
                icon="mdi-keyboard-backspace"
                @click="goback"
            ></v-icon>
            <h3>เพิ่มรายชื่อ</h3>
        </v-sheet>
        <div>
            <div style="text-align: center; max-width: 500px; margin: 0 auto 0 auto;" class="pa-6 pt-10">
                <v-select
                    v-model="title"
                    :items="titles"
                    item-value="value"
                    item-title="title"
                    variant="outlined"
                    rounded="xl"
                    label="คำนำหน้า"
                ></v-select>
                <v-text-field v-model="fname" variant="outlined" rounded="xl" label="ชื่อจริง"></v-text-field>
                <v-text-field v-model="lname" variant="outlined" rounded="xl" label="นามสกุล"></v-text-field>
                <v-text-field v-model="studentid" variant="outlined" rounded="xl" label="รหัสนักศึกษา"></v-text-field>
                <v-text-field v-model="id" variant="outlined" rounded="xl" label="รหัสประจำตัวประชาชน"></v-text-field>
                <v-btn
                    style="padding-left: 25%; padding-right: 25%; letter-spacing: 0.04em;" 
                    color="#99CCFF"
                    width="100%"
                    rounded="xl"
                    size="large"
                    elevation="0"
                    @click="addStudent"
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
const title = ref('')
const fname = ref('')
const lname = ref('')
const studentid = ref('')
const id = ref('')
const dialogVisible = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');

const titles = ref([
  { title: "นาย", value: "นาย" },
  { title: "นาง", value: "นาง" },
  { title: "นางสาว", value: "นางสาว" }
]);

// ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
const isFormValid = computed(() => {
    return title.value && fname.value && lname.value && studentid.value && id.value;
});

const addStudent = async () => {
    if (!isFormValid.value) {
        dialogTitle.value = "ข้อผิดพลาด";
        dialogMessage.value = "กรุณากรอกข้อมูลให้ครบถ้วน!";
        dialogVisible.value = true;
        return;
    }

    const groupIDFromStorage = localStorage.getItem('groupID');
    const data = {
        title: title.value,
        fname: fname.value,
        lname: lname.value,
        studentid: studentid.value,
        id: id.value,
        groupID: groupIDFromStorage,
        profilePic: "profile.png"
    };

    try {
        const response = await axios.post('/api/addStudent', data);
        dialogTitle.value = "สำเร็จ";
        dialogMessage.value = "เพิ่มข้อมูลนักศึกษาเรียบร้อยแล้ว!";
        dialogVisible.value = true;
        
        // ล้างค่าในฟอร์ม
        title.value = '';
        fname.value = '';
        lname.value = '';
        studentid.value = '';
        id.value = '';
    } catch (error) {
        dialogTitle.value = "ข้อผิดพลาด";
        dialogMessage.value = "ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองอีกครั้ง!";
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

</style>