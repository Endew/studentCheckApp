const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const upload = require('../config/multer');
const knex = require('../config/database');
const app = express(); 

app.post('/uploadProfile', upload.single('profileImage'), async (req, res) => {
    try {
        const { stdID } = req.body; // รับ stdID จาก request body
        console.log('stdID:', stdID);
        console.log('file:', req.file);

        if (!stdID || !req.file) {
            return res.status(400).json({ error: 'stdID หรือรูปภาพหายไป' });
        }

        // สร้างชื่อไฟล์ใหม่
        const timestamp = Date.now();
        const newFileName = `${stdID}_${timestamp}.png`;

        // แปลงและบันทึกรูปภาพเป็น PNG
        await sharp(req.file.buffer)
            .resize(150, 150) // ปรับขนาด (ถ้าต้องการ)
            .toFormat('png') // แปลงเป็น PNG
            .toFile(`./profilePic/${newFileName}`); // บันทึกในโฟลเดอร์

        // อัปเดตชื่อรูปภาพในฐานข้อมูล
        await knex('students')
            .where({ stdID })
            .update({ profilePic: newFileName });

        // ส่ง URL กลับไปให้ client
        res.json({ 
            message: 'อัพโหลดสำเร็จ', 
            imageUrl: `/profilePic/${newFileName}` 
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/uploadProfileTeacher', upload.single('profileImage'), async (req, res) => {
    try {
        const { adviserID } = req.body; // รับ adviserID จาก request body
        console.log('adviserID:', adviserID);
        console.log('file:', req.file);

        if (!adviserID || !req.file) {
            return res.status(400).json({ error: 'adviserID หรือรูปภาพหายไป' });
        }

        // สร้างชื่อไฟล์ใหม่
        const timestamp = Date.now();
        const newFileName = `${adviserID}_${timestamp}.png`;

        // แปลงและบันทึกรูปภาพเป็น PNG
        await sharp(req.file.buffer)
            .resize(150, 150) // ปรับขนาด (ถ้าต้องการ)
            .toFormat('png') // แปลงเป็น PNG
            .toFile(`./profilePic/${newFileName}`); // บันทึกในโฟลเดอร์

        // อัปเดตชื่อรูปภาพในฐานข้อมูล
        await knex('teachers')
            .where({ adviserID })
            .update({ profilePic: newFileName });

        // ส่ง URL กลับไปให้ client
        res.json({ 
            message: 'อัพโหลดสำเร็จ', 
            imageUrl: `/profilePic/${newFileName}` 
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

app.get('/getProfile', async (req, res) => {
    const stdID = req.query.stdID;

    if (!stdID) {
        return res.status(400).json({ error: 'stdID is missing' });
    }

    try {
        const data = await knex('students')
            .select('profilePic')
            .where('stdID', '=', stdID)
            .first(); // ดึงแค่ row เดียว

        if (!data) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ profilePic: data.profilePic });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.get('/getProfileTeacher', async (req, res) => {
    const adviserID = req.query.adviserID;

    if (!adviserID) {
        return res.status(400).json({ error: 'adviserID is missing' });
    }

    try {
        const data = await knex('teachers')
            .select('profilePic')
            .where('adviserID', '=', adviserID)
            .first(); // ดึงแค่ row เดียว

        if (!data) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ profilePic: data.profilePic });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.use('/profilePic', express.static('profilePic'));

app.get('/listStudent', async (req, res) => {
    const { groupID } = req.query
    console.log('groupID:', groupID)
    try {
        const students = await knex('students')
        .where('groupID', groupID)
        res.json(students)
    } catch (error) {
        console.error('error', error)
        res.status(500).json({ error: 'error' })
    }
});

module.exports = router;
