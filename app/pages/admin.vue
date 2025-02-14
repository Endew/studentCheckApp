<template>
    <div style="background-color: #ececec; height: 100%;">
        <div>
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
            <v-card class="profile-card" elevation="1">
                <div class="profile-container pa-4">
                    <div class="avatar-container">
                        <img 
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkSSLdQo3hX5LFAqOloLfjYDHXtW_fMF_bQg&s"
                            alt="Avatar"
                            class="avatar"
                        />
                        <br>
                        <b style="font-size: 20px;">{{ adminUserName }}</b><br>
                        <span style="color: grey;">ผู้ดูแลระบบ</span>
                    </div>
                </div>
                <div 
                    class="d-flex align-center justify-center" 
                    style="flex-direction: column; margin-bottom: 4rem;"
                >
                    <v-btn 
                        style="letter-spacing: 0.04em;"
                        color="blue-lighten-3"
                        elevation="3"
                        size="large"
                        class="ma-2 custom-bg-main-btn"
                        width="70%"
                        @click="ManageGroup"
                    >
                        จัดการกลุ่มห้องเรียน
                    </v-btn>
                </div>
            </v-card>
        </div>

        <!-- Logout Confirmation Dialog -->
        <v-dialog v-model="logoutDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">ยืนยันการออกจากระบบ</v-card-title>
                <v-card-text>คุณต้องการออกจากระบบหรือไม่?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="" text @click="logoutDialog = false">ยกเลิก</v-btn>
                    <v-btn color="red" text @click="confirmLogout">ออกจากระบบ</v-btn>
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
const adminUserName = ref('')
const previousPage = ref('')
const logoutDialog = ref(false)

const loadadminUserName = () => {
    const storedFirstName = localStorage.getItem('adminUserName')
    adminUserName.value = storedFirstName
}

onMounted( async () => {
    loadadminUserName();
    const token = localStorage.getItem('token');
    
    try {
    const response = await axios.get('/api/checkToken', {
        headers: {
            Authorization: `Bearer ${token}`
        },
    })
    console.log('data = ',response.data)
    } catch(error) {
        console.error('Error:', error.response.data);
        // alert('คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อน');
        router.push('/login');
    }
    console.log(adminUserName)
})

const confirmLogout = () => {
    localStorage.clear()
    router.push('/login')
}

const ManageGroup = () => {
    previousPage.value = localStorage.setItem('previousPage', "/admin")
    router.push('/manage_group')
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
    margin-left: auto;
    margin-right: auto;
    margin-top: 5rem;
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