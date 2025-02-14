<template>
    <div>
        <v-sheet
            class="custom-bg"
            style="display: flex; background-color: #1E88E5; padding: 1rem; padding-top: 2rem; margin-top: -1rem;"
            rounded="lg"
        >
            <v-icon
                style="margin-right: 0.75rem;"
                icon="mdi-keyboard-backspace"
                @click="goback"
            ></v-icon>
            <h3>เพิ่มห้องเรียน</h3>
        </v-sheet>

        <div>
            <div style="text-align: center;" class="pa-6 pt-10">
                <v-select
                    v-model="groupLetter"
                    :items="groupLetters"
                    variant="outlined"
                    rounded="xl"
                    label="เลือกกลุ่มตัวอักษร"
                ></v-select>
                <v-text-field
                    v-model="groupNumber"
                    variant="outlined"
                    rounded="xl"
                    label="กรอกหมายเลขกลุ่ม"
                    type="number"
                ></v-text-field>
                <v-select
                    v-model="depValue"
                    :items="dep"
                    variant="outlined"
                    rounded="xl"
                    label="เลือกแผนก"
                ></v-select>
                <v-select
                    v-model="branchValue"
                    :items="branch"
                    variant="outlined"
                    rounded="xl"
                    label="เลือกสาขา"
                ></v-select>
                <v-btn
                    style="padding-left: 25%; padding-right: 25%; letter-spacing: 0.04em;" 
                    class="custom-bg-main-btn"
                    color="#99CCFF"
                    width="100%"
                    rounded="xl"
                    size="large"
                    elevation="0"
                    @click="insertRoom"
                >บันทึก</v-btn>
            </div>
        </div>

        <!-- Dialog สำหรับแจ้งเตือน -->
        <v-dialog v-model="dialogVisible" max-width="400px">
            <v-card>
                <v-card-title>
                    <span class="headline">{{ dialogTitle }}</span>
                </v-card-title>
                <v-card-text>
                    <p>{{ dialogMessage }}</p>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="blue" @click="dialogVisible = false">ตกลง</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const groupValue = ref(null);
const groupLetter = ref(null);
const groupLetters = ref("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
const groupNumber = ref(null);

const depValue = ref(null)
const dep = ref([
  { title: "เทคโนโลยีสารสนเทศ", value: 1 },
]);

const branchValue = ref(null);
const branch = ref([
  { title: "นักพัฒนาซอฟต์แวร์คอมพิวเตอร์", value: 1 }
]);

const dialogVisible = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');

const goback = () => {
  router.push('/manage_group');
}

const insertRoom = async () => {
    if (!groupLetter.value || !groupNumber.value) {
        dialogTitle.value = 'ข้อผิดพลาด';
        dialogMessage.value = 'กรุณาเลือกกลุ่มตัวอักษรและกรอกหมายเลขกลุ่ม';
        dialogVisible.value = true;
        return;
    }
    
    const roomName = `${groupLetter.value}${groupNumber.value}`;
    try {
        // ส่งข้อมูลห้องเรียนไปที่ API insertRoom
        const response = await axios.post('/api/insertRoom', { roomName });
        const result = response.data;

        // ตรวจสอบสถานะและรับข้อมูล roomID
        if (result.status === 1 && result.roomID) {
            console.log('insert room success', result.roomID);
            
            // ส่งข้อมูลไปยัง API insertGroup เพื่อบันทึกกลุ่ม
            const groupData = {
                roomID: result.roomID,  // roomID ที่ได้จาก insertRoom
                depID: depValue.value,
                branchID: branchValue.value,
                adviserID: 0
            };
            
            const groupResponse = await axios.post('/api/insertGroup', groupData);
            if (groupResponse.data.status === 1) {
                dialogTitle.value = 'สำเร็จ';
                dialogMessage.value = 'เพิ่มห้องเรียนสำเร็จ';
                dialogVisible.value = true;
                    // เพิ่มการหน่วงเวลา
                setTimeout(() => {
                    router.push('/manage_group');
                }, 2000);  // 2 วินาที
            } else {
                dialogTitle.value = 'ข้อผิดพลาด';
                dialogMessage.value = 'เกิดข้อผิดพลาดในการบันทึกข้อมูลกลุ่ม';
                dialogVisible.value = true;
            }
        } else {
            dialogTitle.value = 'ข้อผิดพลาด';
            dialogMessage.value = 'เกิดข้อผิดพลาดในการบันทึกห้องเรียน';
            dialogVisible.value = true;
        }
    } catch (error) {
        dialogTitle.value = 'ข้อผิดพลาด';
        dialogMessage.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
        dialogVisible.value = true;
    }
}
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