<template>
    <div style="background-color: #ececec; height: 100%;">
        <v-sheet
            class="custom-bg"
            style="display: flex; background-color: #1E88E5; padding: 1rem; padding-top: 2rem; margin-top: -1rem;"
            rounded="lg"
            elevation="3"
        >
        <v-icon
            style="margin-right: 0.75rem;"
            icon="mdi-keyboard-backspace"
            @click="goback"
        ></v-icon>
        <h3>จัดการกลุ่มห้องเรียน</h3>
        </v-sheet>
        
        <!-- ปุ่มเพิ่มห้องเรียน -->
        <div style="text-align: center;" class="pa-5">
            <v-btn 
                style="letter-spacing: 0.04em;"
                color="blue-lighten-3"
                elevation="3"
                size="large"
                class="ma-2"
                width="70%"
                @click="addRoom"
            >
                เพิ่มห้องเรียน
            </v-btn>
        </div>
        
        <!-- การแสดงผลข้อมูลกลุ่มห้องเรียน -->
        <div 
            v-for="(roomGroup, index) in groupDep" 
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
                    margin: '5px',
                    width: '400px',
                    maxWidth: '90%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }"
                elevation="1"
                @click="saveRoomGroup(roomGroup)"
            >
                <span style="position: absolute; left: 2rem; font-size: medium;">
                    {{ roomGroup.roomName }} : {{ roomGroup.depName }}
                </span>
                <v-icon
                    @click.stop="confirmDeleteRoomGroup(roomGroup.groupID)"
                    color="grey"
                    class="custom-delete-btn"
                >
                    mdi-delete
                </v-icon>
            </v-btn>
        </div>

        <!-- Dialog สำหรับยืนยันการลบ -->
        <v-dialog v-model="dialogVisible" max-width="500px">
            <v-card>
                <v-card-title>
                    <span class="headline">{{ dialogTitle }}</span>
                </v-card-title>
                <v-card-text>{{ dialogMessage }}</v-card-text>
                <v-card-actions>
                    <v-btn color="red darken-1" text @click="handleConfirmDelete">
                        ยืนยัน
                    </v-btn>
                    <v-btn text @click="dialogVisible = false">
                        ยกเลิก
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const group = ref([])
const groupID = ref([])
const dep = ref([])
const groupDep = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const selectedGroupID = ref(null) // ตัวแปรเก็บ groupID ของห้องที่ต้องการลบ

const saveRoomGroup = async (roomGroup) => {
    localStorage.setItem('selectedRoom', JSON.stringify(roomGroup));
    localStorage.setItem('groupID', roomGroup.groupID);
    localStorage.setItem('previousPage2', "/manage_group");

    const ID = localStorage.getItem('groupID');
    const response = await axios.get(`/api/getAdviserID?groupID=${ID}`);
    localStorage.setItem('adviserID', response.data.adviserID);
    localStorage.setItem('teacherFirstName', response.data.teacherFirstName);
    localStorage.setItem('teacherLastName', response.data.teacherLastName);

    router.push('/manage_room');
};

const confirmDeleteRoomGroup = (groupID) => {
    // ตั้งค่ากล่อง dialog ก่อนแสดง
    selectedGroupID.value = groupID;
    dialogTitle.value = "ยืนยันการลบ";
    dialogMessage.value = "คุณต้องการลบข้อมูลห้องเรียนนี้หรือไม่?";
    dialogVisible.value = true;
};

const handleConfirmDelete = async () => {
    try {
        // ส่งคำขอลบข้อมูล
        const response = await axios.post('/api/deleteRoomGroup', {
            groupID: selectedGroupID.value
        });

        console.log(response.data.message);
        
        // ลบข้อมูลจากหน้าจอ
        groupDep.value = groupDep.value.filter(room => room.groupID !== selectedGroupID.value);

        // แสดง dialog แจ้งเตือนการลบสำเร็จ
        dialogTitle.value = "สำเร็จ";
        dialogMessage.value = "ลบข้อมูลกลุ่มห้องเรียนสำเร็จ!";

        dialogVisible.value = false; // ปิด dialog หลังจากแสดงแจ้งเตือน

    } catch (error) {
        console.error('Error deleting group:', error);
        dialogTitle.value = "ข้อผิดพลาด";
        dialogMessage.value = "ไม่สามารถลบข้อมูลได้ กรุณาลองอีกครั้ง!";
    }
};

const getCombinedData = async () => {
    try {
        const [roomsResponse, depsResponse, groupsResponse] = await Promise.all([
            axios.get('/api/getRoomName'),
            axios.get('/api/getDepName'),
            axios.get('/api/getGroup')
        ]);

        groupDep.value = roomsResponse.data.map((room, index) => {
            const department = depsResponse.data.find(dep => dep.depID === room.depID);
            const groupID = groupsResponse.data[index]?.groupID || null;
            return {
                ...room,
                depName: department ? department.depName : 'ไม่ระบุแผนก',
                groupID: groupID
            };
        });

        localStorage.setItem('groupDep', JSON.stringify(groupDep.value));
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

const getRoomName = async () => {
    try {
        const response = await axios.get('/api/getRoomName');
        group.value = response.data;
    } catch (error) {
        console.error('Error fetching room name:', error);
    }
};

const getDepName = async () => {
    try {
        const response = await axios.get('/api/getDepName');
        dep.value = response.data;
    } catch (error) {
        console.error('Error fetching room name:', error);
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
    getRoomName();
    getDepName();
    getCombinedData();
});

const goback = () => {
    const previousPage = localStorage.getItem('previousPage');
    router.push(`${previousPage}`);
};

const addRoom = () => {
    router.push('/add_room');
};
</script>

<style lang="scss" scoped>
.custom-bg {
    background: rgb(25, 118, 210);
    background: linear-gradient(350deg, rgba(25, 118, 210, 1) 0%, rgba(33, 150, 243, 1) 50%, rgba(33, 150, 243, 1) 70%, rgba(100, 181, 246, 1) 100%);
}

.custom-bg-btn {
    background: rgb(219,235,255);
    background: linear-gradient(131deg, rgba(219,235,255,1) 0%, rgba(209,225,245,1) 58%, rgba(200,216,236,1) 94%);
    border: solid 1px #c5d5e8;
}

.custom-delete-btn {
    margin-right: auto; margin-left: 17.75rem;
}
</style>