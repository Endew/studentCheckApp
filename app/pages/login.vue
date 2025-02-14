<template>
    <div class="login-container">
      <v-sheet
        class="custom-bg"
        max-width="100%"
        height="100%"
        variant="text"
      >
        <div class="login-content">
          <!-- รูปภาพ -->
          <v-img src="/img/LogoApp.png" width="300px" class="logo mx-auto"></v-img>
  
          <!-- การ์ดที่บรรจุฟอร์ม -->
          <v-card class="pa-6 pt-3" elevation="6" rounded="xl" max-width="400px" width="100%">
            <div class="text-h6 text-center">เข้าสู่ระบบ</div>
            <div class="custom-login-field">
              <v-text-field
                v-model="username"
                class="mt-3"
                prepend-inner-icon="mdi-account"
                label="รหัสประจำตัวนักศึกษา"
                variant="outlined"
                rounded="xl"
                width="100%"
              ></v-text-field>
              <v-text-field
                v-model="password"
                prepend-inner-icon="mdi-lock"
                label="รหัสประจำตัวประชาชน"
                variant="outlined"
                rounded="xl"
                width="100%"
                type="password"
              ></v-text-field>
              <v-btn
                class="text-white mt-4"
                rounded="xl"
                color="blue"
                elevation="6"
                size="large"
                width="100%"
                @click="doLogin"
              >
                เข้าสู่ระบบ
              </v-btn>
            </div>
          </v-card>
        </div>
      </v-sheet>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import axios from 'axios'
  import { useRouter } from 'vue-router'
  import { useHead } from '#imports'

  useHead({
    link: [
      { rel: 'manifest', href: '/manifest.json' }
    ]
  })
  
  const router = useRouter()
  const username = ref('')
  const password = ref('')
  
  const doLogin = async () => {
      const forms = {
          username: username.value,
          password: password.value
      };
      console.log(forms)
      try {
          const response = await axios.post('/api/doLogin', forms);
          const data = response.data
  
          console.log(data);
          if (data.status === 'success' & data.statusID === '1') {
              const token = response.data.token
              const stdFirstName = response.data.data.stdFirstName
              const stdLastName = response.data.data.stdLastName
              const groupID = response.data.data.groupID
              const username = response.data.data.username
              const statusID = response.data.data.statusID
              const stdID = response.data.data.stdID
              const profilePic = response.data.data.profilePic
              const tel = response.data.data.tel
              const email = response.data.data.email
              localStorage.setItem("username",username)
              localStorage.setItem("stdFirstName",stdFirstName)
              localStorage.setItem("stdLastName",stdLastName)
              localStorage.setItem("token",token)
              localStorage.setItem("groupID",groupID)
              localStorage.setItem("statusID",statusID)
              localStorage.setItem("stdID",stdID)
              localStorage.setItem("profilePic",profilePic)
              localStorage.setItem("tel",tel)
              localStorage.setItem("email",email)
              router.push('/student');
          }
          if (data.status === 'success' & data.statusID === '2') {
              const token = response.data.token
              const stdFirstName = response.data.data.stdFirstName
              const stdLastName = response.data.data.stdLastName
              const groupID = response.data.data.groupID
              const username = response.data.data.username
              const statusID = response.data.data.statusID
              const stdID = response.data.data.stdID
              const profilePic = response.data.data.profilePic
              const tel = response.data.data.tel
              const email = response.data.data.email
              localStorage.setItem("username",username)
              localStorage.setItem("stdFirstName",stdFirstName)
              localStorage.setItem("stdLastName",stdLastName)
              localStorage.setItem("token",token)
              localStorage.setItem("groupID",groupID)
              localStorage.setItem("statusID",statusID)
              localStorage.setItem("stdID",stdID)
              localStorage.setItem("profilePic",profilePic)
              localStorage.setItem("tel",tel)
              localStorage.setItem("email",email)
              router.push('/checker');
          }
          if (data.status === 'success' & data.statusID === '3') {
              const token = response.data.token
              const adminUserName = response.data.data.adminUserName
              const profilePic = response.data.data.profilePic
              localStorage.setItem("adminUserName",adminUserName)
              localStorage.setItem("token",token)
              localStorage.setItem("profilePic",profilePic)
              router.push('/admin');
          }
          if (data.status === 'success' & data.statusID === '4') {
              const token = response.data.token
              const teacherFirstName = response.data.data.teacherFirstName
              const teacherLastName = response.data.data.teacherLastName
              const adviserID = response.data.data.adviserID
              const groupID = response.data.data.groupID
              const statusID = response.data.statusID
              const username = response.data.data.username
              const profilePic = response.data.data.profilePic
              const tel = response.data.data.tel
              const email = response.data.data.email
              localStorage.setItem("profilePic",profilePic)
              localStorage.setItem("teacherFirstName",teacherFirstName)
              localStorage.setItem("teacherLastName",teacherLastName)
              localStorage.setItem("token",token)
              localStorage.setItem("adviserID",adviserID)
              localStorage.setItem("groupID",groupID)
              localStorage.setItem("statusID",statusID)
              localStorage.setItem("username",username)
              localStorage.setItem("tel",tel)
              localStorage.setItem("email",email)
  
              router.push('/teacher')
          }
      } catch (error) {
          console.log(error.error)
      }
  }
  </script>
  
  <style lang="scss" scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: #f5f5f5;
  padding: 20px;
  box-sizing: border-box;
}

.custom-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    350deg,
    rgba(25, 118, 210, 1) 0%,
    rgba(33, 150, 243, 1) 50%,
    rgba(33, 150, 243, 1) 70%,
    rgba(100, 181, 246, 1) 100%
  );
  z-index: 0;
}

.login-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.custom-login-field {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.logo {
  margin-bottom: 20px;
  max-width: 300px;
  width: 100%;
  height: auto;
}

@media (max-width: 1024px) {
  .login-container {
    padding: 16px;
  }

  .login-content {
    padding: 16px;
  }
}

@media (max-width: 900px) {
  .login-content {
    max-width: 380px;
  }
}

@media (max-width: 600px) {
  .login-container {
    padding: 12px;
  }

  .login-content {
    padding: 12px;
  }
}  </style>  