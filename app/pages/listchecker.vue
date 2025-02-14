<template>
  <div style="background-color: #ececec; height: 100%;">
    <div class="sticky-header">
      <v-sheet class="custom-bg"
        style="display: flex; padding: 1rem; padding-top: -2rem; border-radius: 0px 0px 14px 14px;">
        <v-icon 
          style="margin-right: 0.75rem;" 
          icon="mdi-keyboard-backspace" 
          @click="goback"></v-icon>
        <h3>เช็คชื่อ</h3>
      </v-sheet>
      <div style="text-align: center; background-color: #ececec;" class="pa-5">
        <v-btn 
          style="letter-spacing: 0.04em; padding-left: 20%; padding-right: 20%;" 
          color="#99CCFF" 
          @click="addDate"
        >
          เพิ่มวันที่ปัจุบัน
        </v-btn>
        <v-btn 
          style="letter-spacing: 0.04em; padding-left: 14.5%; padding-right: 14.5%; margin-top: 1rem;" 
          color="#99CCFF" 
          @click="addDateSelect"
        >
          เพิ่มวันที่แบบเลือกวัน
        </v-btn>
      </div>
    </div>

    <div style="margin-top: 0.5rem; margin-bottom: 6rem;">
      <div 
        v-for="(day, index) in day" 
        :key="index" 
        style="display: flex; justify-content: center; align-items: center; position: relative; gap: 10px;"
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
            justifyContent: 'flex-start',
            alignItems: 'center',
            textAlign: 'left',
            paddingLeft: '1rem',
          }"
          elevation="1" 
          @click="selectedDay(day.date)">
          วันที่ {{ day.date }}
        </v-btn>

        <v-btn 
          style="position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%);" 
          rounded="xl" 
          variant="text" 
          @click.stop="openDialog(day)">
          <v-icon color="#97a9bf">mdi-text-box-edit-outline</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Dialog to add date -->
    <v-dialog v-model="addDateDialog" max-width="500px">
      <v-card>
        <v-card-title>เพิ่มวันที่</v-card-title>
        <v-card-text>
          <v-text-field v-model="date" label="วันที่" type="date"/>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="insertDate">บันทึก</v-btn>
          <v-btn text @click="addDateDialog = false">ยกเลิก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog to edit date -->
    <v-dialog v-model="dialogVisible" max-width="500px">
      <v-card>
        <v-card-title>แก้ไข {{ editedDate }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="editedDate" label="วันที่" type="date"/>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="saveDate">บันทึก</v-btn>
          <v-btn text @click="dialogVisible = false">ยกเลิก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog for result message -->
    <v-dialog v-model="resultDialogVisible" max-width="400px">
      <v-card>
        <v-card-title>{{ resultMessage.title }}</v-card-title>
        <v-card-text>{{ resultMessage.message }}</v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="resultDialogVisible = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const previousPage = ref('')
const router = useRouter('')
const day = ref([]); // ใช้ ref([]) เพื่อป้องกัน undefined
const dialogVisible = ref(false)
const addDateDialog = ref(false)
const date = ref('')
const editedDate = ref('')
const resultDialogVisible = ref(false)
const resultMessage = ref({ title: '', message: '' })

const listData = async () => {
  try {
    const groupID = localStorage.getItem('groupID')
    const response = await axios.get(`/api/listDateStudent?groupID=${groupID}`)
    const list = response.data
    console.log("list = ", list);
    day.value = list.datas
  } catch (error) {
    location.reload();
  }
}

const tokenCheck = async () => {
  // ทำการตรวจสอบ token ต่อไป
  const token = localStorage.getItem('token')
  console.log('check token from api = ', token)
  try {
    const response = await axios.get('/api/checkToken', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log('data = ', response.data)
  } catch (error) {
    console.error('Error:', error.response.data)
    router.push('/login');
  }
}
onMounted(() => {
  listData()
  tokenCheck()
})

const selectedDay = async (date) => {
  if (date) {
    localStorage.setItem('selectedDay', date)

    const storedSelectedDay = localStorage.getItem('selectedDay')
    const groupID = localStorage.getItem('groupID')
    selectedDay.value = storedSelectedDay
    const response = await axios.get(`/api/getDateID?date=${storedSelectedDay}&groupID=${groupID}`)
    localStorage.setItem('dateID', response.data.dateID)
  } else {
    console.error('Invalid date:', date)
  }
  router.push('/activity')
}

const insertDate = async () => {
  addDateDialog.value = false
  const selectDate = date.value
  const isDateExists = day.value?.some(item => item.date === selectDate);
  if (isDateExists) {
    resultMessage.value = {
      title: 'เพิ่มวันที่ไม่สำเร็จ',
      message: 'วันที่นี้มีอยู่แล้วในรายการ'
    }
    resultDialogVisible.value = true
    return
  }
  try {
  const response = await axios.post('/api/addDate', {
    date: date.value,
    groupID: localStorage.getItem('groupID')
  })
  if (response.data.status === 1) {  // เช็คสถานะจาก API
      listData()
      resultMessage.value = {
        title: 'เพิ่มวันที่สำเร็จ',
        message: `วันที่ปัจุบันได้ถูกเพิ่มแล้ว`
      }
    } else {
      resultMessage.value = {
        title: 'เพิ่มวันที่ไม่สำเร็จ',
        message: response.data.message || 'ไม่สามารถเพิ่มวันที่ได้'
      }
    }

    resultDialogVisible.value = true
  } catch (error) {
    console.error("Error adding date:", error)
    resultMessage.value = {
      title: 'เกิดข้อผิดพลาด',
      message: 'ไม่สามารถเพิ่มวันที่ได้ โปรดลองใหม่'
    }
    resultDialogVisible.value = true
  }
}

const addDateSelect = () => {
  addDateDialog.value = true
}

const addDate = async () => {
  const now = new Date()
  const dayOfMonth = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear()

  const formattedDate = `${year}-${month}-${dayOfMonth}`

  console.log("day.value:", day.value);
  const isDateExists = day.value?.some(item => item.date === formattedDate);

  const groupID = localStorage.getItem('groupID')

  if (isDateExists) {
    resultMessage.value = {
      title: 'เพิ่มวันที่ไม่สำเร็จ',
      message: 'วันที่นี้มีอยู่แล้วในรายการ'
    }
    resultDialogVisible.value = true
    return
  }

  try {
    const response = await axios.post("/api/addDate", {
      date: formattedDate,
      groupID: groupID
    });

    if (response.data.status === 1) {  // เช็คสถานะจาก API
      listData()
      resultMessage.value = {
        title: 'เพิ่มวันที่สำเร็จ',
        message: `วันที่ปัจุบันได้ถูกเพิ่มแล้ว`
      }
    } else {
      resultMessage.value = {
        title: 'เพิ่มวันที่ไม่สำเร็จ',
        message: response.data.message || 'ไม่สามารถเพิ่มวันที่ได้'
      }
    }

    resultDialogVisible.value = true
  } catch (error) {
    console.error("Error adding date:", error)
    resultMessage.value = {
      title: 'เกิดข้อผิดพลาด',
      message: 'ไม่สามารถเพิ่มวันที่ได้ โปรดลองใหม่'
    }
    resultDialogVisible.value = true
  }
}

const convertToDateFormat = (thaiDate) => {
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const parts = thaiDate.split(' ');  // แยกวันที่ออกจากเดือนและปี
  const day = parts[0];  // วันที่
  const month = monthNames.indexOf(parts[1]) + 1;  // เดือน (แปลงจากชื่อเดือนเป็นหมายเลข)
  const year = parseInt(parts[2]) - 543;  // ปี (แปลงจากปีพุทธศักราชเป็นคริสต์ศักราช)

  const formattedMonth = month.toString().padStart(2, '0');  // ทำให้เดือนเป็น 2 หลัก
  const formattedDay = day.toString().padStart(2, '0');  // ทำให้วันเป็น 2 หลัก

  return `${year}-${formattedMonth}-${formattedDay}`;  // รูปแบบ "yyyy-MM-dd"
};

const openDialog = (day) => {
  localStorage.setItem('oldDate', day.date);
  editedDate.value = day.date;
  dialogVisible.value = true;
}

const saveDate = async () => {
  const oldDate = localStorage.getItem('oldDate');
  const newDate = editedDate.value;

  if (!oldDate || !newDate) {
    console.error('Invalid date values:', oldDate, newDate);
    return;  // ไม่ให้ส่งคำขอหากวันที่ไม่ถูกต้อง
  }

  console.log('Old Date:', oldDate);
  console.log('New Date:', newDate);

  // ฟังก์ชันแปลงวันที่ที่ผิดพลาด
  const cleanNewDate = cleanDateFormat(newDate);

  if (!cleanNewDate) {
    console.error('Invalid new date format');
    return;  // ถ้าหากวันที่ไม่ถูกต้อง, ไม่ส่งข้อมูล
  }

  // แปลงวันที่เก่า
  const formattedOldDate = convertToDateFormat(oldDate);

  try {
    // ส่งวันที่ที่แก้ไขไปยัง API
    await axios.post("/api/updateDate", {
      date: cleanNewDate,  // ส่งวันที่ใหม่ที่ถูกแปลงแล้ว
      oldDate: formattedOldDate
    });
    
    dialogVisible.value = false;  // ปิด dialog หลังจากบันทึกสำเร็จ

    // รีเฟรชข้อมูลใหม่หลังจากบันทึก
    listData();
  } catch (error) {
    console.error("Error saving date:", error);
  }
}

// ฟังก์ชันที่ทำการตรวจสอบและตัด "NaN-00-" ออกจากวันที่
const cleanDateFormat = (date) => {
  // ตรวจสอบว่า date เป็นวันที่ที่ถูกต้อง
  const regex = /^\d{4}-\d{2}-\d{2}$/; // รูปแบบ "yyyy-MM-dd"

  if (regex.test(date)) {
    return date;  // หากตรงตามรูปแบบ "yyyy-MM-dd" ก็ส่งคืนค่านั้น
  } else {
    // ถ้าหากพบว่าเป็น "NaN-00-" ให้คืนค่า null หรือวันที่ที่ถูกต้อง
    return null;
  }
}

const goback = () => {
  previousPage.value = localStorage.getItem('previousPage')
  router.push(`${previousPage.value}`);
}

</script>
<style lang="scss" scoped>
.custom-bg {
  background: rgb(25, 118, 210);
  background: linear-gradient(350deg, rgba(25, 118, 210, 1) 0%, rgba(33, 150, 243, 1) 50%, rgba(33, 150, 243, 1) 70%, rgba(100, 181, 246, 1) 100%);
}

.sticky-header {
  position: sticky;
  top: 0;
  /* ติดด้านบนของหน้าจอ */
  z-index: 10;
  /* เพื่อให้ลอยอยู่ด้านบน */
  background-color: white;
  /* เพิ่มสีพื้นหลังเพื่อความชัดเจน */
}

.custom-bg-btn {
    letter-spacing: '0.03rem';
    height: '4.5rem';
    background: rgb(219,235,255);
    background: linear-gradient(131deg, rgba(219,235,255,1) 0%, rgba(209,225,245,1) 58%, rgba(200,216,236,1) 94%);
    border-radius: '15px';
    border: 'solid 1px #c5d5e8';
    margin: '5px';
    width: '400px';
    max-width: '90%';
}
</style>