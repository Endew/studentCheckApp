require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const app = express();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Environment variables configuration
const {
    PORT = 3001,
    JWT_SECRET_KEY,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    UPLOAD_PATH = 'uploads',
    PROFILE_PIC_PATH = 'profilePic',
    PIC_PATH = 'pic',
    EXCEL_PATH = 'excel'
} = process.env;

// Create required directories if they don't exist
const directories = [UPLOAD_PATH, PROFILE_PIC_PATH, PIC_PATH, EXCEL_PATH];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Database configuration
const knex = require("knex")({
    client: "mysql",
    connection: {
        host: DB_HOST,
        port: parseInt(DB_PORT),
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    },
});

// Storage configuration for different file types
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = UPLOAD_PATH;
        if (file.fieldname === 'profileImage') {
            uploadPath = PROFILE_PIC_PATH;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            uploadPath = EXCEL_PATH;
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}${ext}`);
    }
});

const memStorage = multer.memoryStorage();
const uploadMem = multer({ storage: memStorage });
const uploadDisk = multer({ storage: diskStorage });

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files
app.use(`/${PROFILE_PIC_PATH}`, express.static(PROFILE_PIC_PATH));
app.use(`/${PIC_PATH}`, express.static(PIC_PATH));
app.use('/templates', express.static('templates'));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const tokenHeader = req.headers['authorization'];
    if (!tokenHeader) {
        return res.status(403).json({ message: 'No token provided' });
    }

    const token = tokenHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                message: 'Invalid token',
                status: 0 
            });
        }
        req.user = decoded;
        next();
    });
}

// API อัปโหลดไฟล์ Excel และเพิ่มข้อมูลลงฐานข้อมูล
app.post('/uploadExcel', uploadDisk.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const groupID = req.body.groupID; // ดึง groupID จาก req.body

        if (!file || !groupID) {
            return res.send({ status: 0, error: "ข้อมูลไม่ครบถ้วน!" });
        }

        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const students = sheetData.map(student => ({
            stdUserName: student.รหัสนักศึกษา,
            stdPass: student.เลขประจำตัวประชาชน,
            stdFirstName: `${student.คำนำหน้าชื่อ}${student.ชื่อจริง}`,
            stdLastName: student.นามสกุล,
            statusID: 1,
            profilePic: "profile.png",
            groupID: groupID
        }));

        for (let student of students) {
            const existingStudent = await knex('students')
                .where({ stdUserName: student.stdUserName })
                .first();

            if (!existingStudent) {
                await knex('students').insert(student);
            }
        }

        res.send({ status: 1, message: "อัปโหลดและบันทึกข้อมูลเรียบร้อย!" });

    } catch (error) {
        res.send({ status: 0, error: error.message });
    }
});

app.get('/getImgID', async (req, res) => {
    const dateID = req.query.dateID
    const groupID = req.query.groupID
    console.log(dateID)
    try {
        const imgID = await knex('date')
            .where('dateID', '=', dateID)
            .andWhere('groupID', '=', groupID)
            .select('imgID')
        if (imgID.length > 0) {
            res.send({ imgID: imgID[0].imgID })
        } else {
            res.status(404).send({ error: 'No image ID found for the given dateID' })
        }
    } catch (error) {
        console.error('Error:', error)
        res.status(500).send({ error: 'Internal Server Error' })
    }
})

app.get('/getImgName', async (req, res) => {
    const imgID = req.query.imgID;
    console.log(imgID);
    try {
        const imgName = await knex('img')
            .select('imgName')
            .where('imgID', '=', imgID);
        
        if (imgName.length > 0) {
            res.send({ imgName: imgName[0].imgName });
        } else {
            res.status(404).send({ error: 'No image name found for the given imgID' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// Endpoint สำหรับอัพโหลดรูปภาพ
app.post('/uploadProfile', uploadMem.single('profileImage'), async (req, res) => {
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
            .rotate() // หมุนรูปให้อยู่ในแนวที่ถูกต้อง
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

app.post('/uploadPicture', uploadMem.single('profileImage'), async (req, res) => {
    try {
        const { dateID } = req.body;
        console.log('dateID:', dateID);
        console.log('file:', req.file);

        if (!dateID || !req.file) {
            return res.status(400).json({ error: 'dateID หรือรูปภาพหายไป' });
        }

        // สร้างชื่อไฟล์ใหม่
        const timestamp = Date.now();
        const newFileName = `${dateID}_${timestamp}.png`;

        // แปลงและบันทึกรูปภาพเป็น PNG
        await sharp(req.file.buffer)
            .toFormat('png') // แปลงเป็น PNG
            .toFile(`./pic/${newFileName}`); // บันทึกในโฟลเดอร์

        // บันทึกชื่อรูปภาพในตาราง img
        const [imgID] = await knex('img').insert({
            imgName: newFileName
        }).returning('imgID');  // คืนค่า imgID ที่ได้จากการบันทึก

        // อัพเดท imgID ในตาราง date
        await knex('date')
            .where({ dateID })
            .update({ imgID });

        // ส่ง URL กลับไปให้ client
        res.json({ 
            message: 'อัพโหลดสำเร็จ', 
            imageUrl: `/pic/${newFileName}`,
            imgID: imgID // ส่ง imgID กลับไปให้ client
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/uploadProfileTeacher', uploadMem.single('profileImage'), async (req, res) => {
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

// เสิร์ฟไฟล์จากโฟลเดอร์ profilePic
app.use('/profilePic', express.static('profilePic'));
app.use('/pic', express.static('pic'));
app.use('/templates', express.static('templates'));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

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


app.post('/addDate', async (req, res) => {
    console.log(req.body)
    try {
        // ตรวจสอบว่ามีวันที่ที่ต้องการเพิ่มในฐานข้อมูลแล้วหรือยัง
        const existingDate = await knex('date')
            .where('date', req.body.date)
            .andWhere('groupID', req.body.groupID)
            .first();

        if (existingDate) {
            // ถ้ามีวันที่แล้ว ให้ตอบกลับว่าไม่สามารถเพิ่มได้
            return res.send({
                status: 0,
                message: 'วันที่นี้มีอยู่แล้วในระบบ'
            });
        }

        // ถ้าไม่มีวันที่ซ้ำกัน ก็สามารถเพิ่มได้
        await knex('date')
            .insert({ 
                date: req.body.date,
                groupID: req.body.groupID,
                yearID: 1
            });

        res.send({
            status: 1,
            message: 'เพิ่มวันที่สำเร็จ'
        });

    } catch (error) {
        res.send({
            status: 0,
            error: error.message
        });
    }
});

app.post('/addStudent', async (req, res) => {
    console.log(req.body);

    try {
        // ตรวจสอบว่ามี stdUserName ซ้ำหรือไม่
        const existingStudent = await knex('students')
            .where({ stdUserName: req.body.studentid })
            .first();

        if (existingStudent) {
            return res.send({ status: 0, error: "มีรหัสนักศึกษานี้อยู่ในระบบแล้ว!" });
        }

        await knex('students').insert({
            stdUserName: req.body.studentid,
            stdPass: req.body.id,
            stdFirstName: `${req.body.title}${req.body.fname}`,
            stdLastName: req.body.lname,
            statusID: 1,
            profilePic: req.body.profilePic,
            groupID: req.body.groupID
        });

        res.send({ status: 1, message: 'insert ok' });

    } catch (error) {
        res.send({ status: 0, error: error.message });
    }
});

app.post('/addTeacher', async (req, res) => {
    console.log(req.body);
    try {
        let insert = await knex('teachers').insert({
            teacherUserName: req.body.teacherID,
            teacherPass: req.body.id,
            teacherFirstName: `${req.body.title}${req.body.fname}`,
            teacherLastName: req.body.lname,
            statusID: 4,
            profilePic: req.body.profilePic,
        });

        res.send({ 
            status: 1,
            message: 'Insert OK',
            teacherUserName: req.body.teacherID,  // ส่ง teacherUserName กลับไปให้ frontend
        });
    } catch (error) {
        res.send({ status: 0, error: error.message });
    }
});

app.post('/editTeacher', async (req, res) => {
    try {
        const { teacherFirstName, teacherLastName, adviserID } = req.body;
        console.log({ teacherFirstName, teacherLastName, adviserID })

        // ตรวจสอบว่าค่าที่ส่งมาไม่เป็นค่าว่าง
        if (!teacherFirstName || !teacherLastName || !adviserID) {
            return res.status(400).send({ status: 0, error: "Missing required fields" });
        }

        // อัปเดตข้อมูลในฐานข้อมูล
        const updatedRows = await knex('teachers')
            .where({ adviserID: adviserID })
            .update({
                teacherFirstName: teacherFirstName,
                teacherLastName: teacherLastName 
            });

        // ตรวจสอบว่ามีการอัปเดตจริงหรือไม่
        if (updatedRows === 0) {
            return res.status(404).send({ status: 0, error: "No teacher found to update" });
        }

        // ดึงข้อมูลอัปเดตล่าสุดจากฐานข้อมูล
        const updatedTeacher = await knex('teachers')
            .where({ adviserID: adviserID })
            .first();

        res.send({
            message: 'Edit successful',
            teacherFirstName: updatedTeacher.teacherFirstName,
            teacherLastName: updatedTeacher.teacherLastName
        });

    } catch (error) {
        res.status(500).send({ status: 0, error: error.message });
    }
});

app.post('/getAdviserID', async (req, res) => {
    try {
        let data = await knex('teachers')
            .select('adviserID')
            .where({ teacherUserName: req.body.teacherUserName });

        if (data.length > 0) {
            res.send({ adviserID: data[0].adviserID });
        } else {
            res.send({ status: 0, message: "No adviserID found" });
        }
    } catch (error) {
        res.send({ status: 0, error: error.message });
    }
});

app.post('/deleteRoomGroup', async (req, res) => {
    const { groupID } = req.body; // รับ groupID จาก body

    try {
        // ลบข้อมูลในตาราง 'group' ที่มี groupID ตรงกับที่ได้รับมา
        const result = await knex('group') // สมมติว่าใช้ตารางชื่อ 'group'
            .where('groupID', groupID)
            .del();

        if (result === 0) {
            // ถ้าไม่มีข้อมูลที่ตรงกับ groupID
            return res.status(404).send({ status: 0, message: 'ไม่พบข้อมูลห้องกลุ่มนี้' });
        }

        // ส่งข้อความตอบกลับเมื่อทำการลบสำเร็จ
        res.send({ status: 1, message: 'ลบข้อมูลกลุ่มห้องเรียนสำเร็จ' });
    } catch (error) {
        // ส่งข้อผิดพลาดหากมี
        res.status(500).send({ status: 0, error: error.message });
    }
});

app.post('/addTeacherGroup', async (req, res) => {
    console.log(req.body);
    try {
        let update = await knex('group')
            .where({ groupID: req.body.groupID }) // ใช้ groupID จาก localStorage
            .update({ adviserID: req.body.adviserID });

        if (update) {
            res.send({ status: 1, message: 'Update OK', updatedRows: update });
        } else {
            res.send({ status: 0, message: 'No record updated' });
        }
    } catch (error) {
        res.send({ status: 0, error: error.message });
    }
});

app.post('/doLogin', async (req, res) => {
    console.log(req.body);
    let users = await knex('students')
        .where({ stdUserName: req.body.username, stdPass: req.body.password });
    
    if (users.length > 0) {
        let role = users[0].statusID;

        let data = {
            username: req.body.username,
            stdFirstName: users[0].stdFirstName,
            stdLastName: users[0].stdLastName,
            groupID: users[0].groupID,
            statusID: users[0].statusID,
            stdID: users[0].stdID,
            tel: users[0].tel,
            email: users[0].email,
            profilePic: users[0].profilePic
        };

        const token = jwt.sign(
            { stdUserName: users[0].stdUserName, statusID: users[0].statusID },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        return res.send({
            token,
            message: 'Login success',
            status: 'success',
            statusID: role,
            data: data
        });
    }

    users = await knex('teachers')
        .where({ teacherUserName: req.body.username, teacherPass: req.body.password });

    if (users.length > 0) {
        let role = users[0].statusID;

        const group = await knex('group')
        .where({ adviserID: users[0].adviserID }) // ใช้ adviserID จาก users
        .select('groupID')
        .first(); // ดึงแค่แถวแรกสุด

        let data = {
            username: req.body.username,
            teacherFirstName: users[0].teacherFirstName,
            teacherLastName: users[0].teacherLastName,
            adviserID: users[0].adviserID,
            profilePic: users[0].profilePic,
            tel: users[0].tel,
            email: users[0].email,
            groupID: group ? group.groupID : null // ถ้าไม่มี group ให้ส่งค่า null
        };

        const token = jwt.sign(
            { teacherUserName: users[0].teacherUserName, statusID: users[0].statusID },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        return res.send({
            token,
            message: 'Login success',
            status: 'success',
            statusID: role,
            data: data
        });
    }

    users = await knex('admins')
        .where({ adminUserName: req.body.username, adminPass: req.body.password });

    if (users.length > 0) {
        let role = users[0].statusID;

        let data = {
            username: req.body.username,
            adminUserName: users[0].adminUserName,
            profilePic: users[0].profilePic
        };

        const token = jwt.sign(
            { adminUserName: users[0].adminUserName, statusID: users[0].statusID },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        return res.send({
            token,
            message: 'Login success',
            status: 'success',
            statusID: role,
            data: data
        });
    }

    return res.send({
        message: 'Wrong username or password.',
        status: 'fail',
    });
});

// Middleware สำหรับตรวจสอบ JWT Token
function authenticateToken(req, res, next) {
    const tokenheader = req.headers['authorization'];
    const token = tokenheader.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                message: 'Invalid token',
                status: 0 
            });
        }
        req.user = decoded;
        next();
    });
}

// Route ที่ต้องมีการยืนยันตัวตน (Protected Route)
app.get('/checkToken', authenticateToken, (req, res) => {
    res.json({ 
    message:'token correct',
    status: 1
    });
});

app.get('/name', async (res) => {
    try {
        let name = await knex('students');
    } catch (error) {

    }
});

app.get('/getRoomName', async (req, res) => {
    try {
        const data = await knex('group')
            .join('room', 'group.roomID', '=', 'room.roomID')
            .select('room.roomName');

        if (!data.length) {
            return res.status(404).json({ error: 'No data found' });
        }

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getGroup', async (req, res) => {
    try {
        const data = await knex('group')
        .select('group.groupID');
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching group data:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/getStatus', async (req, res) => {
    const statusID = req.query.statusID
    try {
        if (statusID === '4') {
            const data = await knex('teachers')
            .join('status', 'teachers.statusID', '=', 'status.statusID')
            .select('status.statusName')
            .where('status.statusID', '=', statusID);
            res.send({
                statusName: data[0].statusName
            }) 
        } else if (statusID === '1') {
            const data = await knex('students')
            .join('status', 'students.statusID', '=', 'status.statusID')
            .select('status.statusName')
            .where('status.statusID', '=', statusID);
            res.send({
                statusName: data[0].statusName
            })
        } else if (statusID === '2') {
            const data = await knex('students')
            .join('status', 'students.statusID', '=', 'status.statusID')
            .select('status.statusName')
            .where('status.statusID', '=', statusID);
            res.send({
                statusName: data[0].statusName
            })
        }
    } catch (error) {
        console.error('Error fetching group data:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/getDepName', async (req, res) => {
    try {
        const data = await knex('group')
            .join('department', 'group.depID', '=', 'department.depID')
            .select('department.depName');
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getSelectedRoom', async (req, res) => {
    const groupID = req.query.groupID
    console.log('groupID:',groupID)
    try {
        const roomID = await knex('group')
            .join('room', 'group.roomID', '=', 'room.roomID')
            .select('room.roomName')
            .where('group.groupID', '=', groupID);
        const depName = await knex('group')
            .join('department', 'group.depID', '=', 'department.depID')
            .select('department.depName')
            .where('group.groupID', '=', groupID);
        res.send({
            roomName: roomID[0].roomName,
            depName: depName[0].depName,
            groupID: req.query.groupID
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Cant find room name' });
    }
})

app.get('/getAdviserID', async (req, res) => {
    const groupID = req.query.groupID
    try {
        const getAdviserID = await knex('group')
        .join('teachers', 'group.adviserID', '=', 'teachers.adviserID')
        .select('teachers.adviserID')
        .where('groupID', '=', groupID)

        const adviserID = getAdviserID[0].adviserID

        const getTeacherName = await knex('teachers')
        .select('teacherFirstName','teacherLastName')
        .where('adviserID', '=', adviserID)

        const teacherFname = getTeacherName[0].teacherFirstName
        const teacherLname = getTeacherName[0].teacherLastName

        res.send({
            adviserID: getAdviserID[0].adviserID,
            teacherFirstName: getTeacherName[0].teacherFirstName,
            teacherLastName: getTeacherName[0].teacherLastName
    })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Cant find adviser' });
    }
    
});

app.post('/insertActivity', async (req, res) => {
    const studentData = req.body.studentData;

    try {
        for (const data of studentData) {
            const existingData = await knex('activity')
                .where({ stdID: data.stdID, dateID: data.dateID })
                .first();

            if (existingData) {
                // มีข้อมูลอยู่แล้ว ตรวจสอบว่ามีส่วนใดที่แตกต่างกัน
                const isDifferent = (
                    existingData.checkStatus !== data.checkStatus ||
                    existingData.groupID !== data.groupID
                );

                if (isDifferent) {
                    // มีส่วนที่แตกต่างกัน ให้ทำการอัปเดต
                    await knex('activity')
                        .where({ stdID: data.stdID, dateID: data.dateID })
                        .update({
                            checkStatus: data.checkStatus,
                            groupID: data.groupID,
                        });
                } else {
                    // ไม่มีส่วนที่แตกต่างกัน ไม่ต้องทำการอัปเดต
                    console.log('Data is already up-to-date.');
                }
            } else {
                // ไม่มีข้อมูล ให้ทำการแทรกใหม่
                await knex('activity')
                    .insert({
                        stdID: data.stdID,
                        checkStatus: data.checkStatus,
                        groupID: data.groupID,
                        dateID: data.dateID
                    });
            }
        }

        res.send({
            status: 'Insert Activities Complete'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Cant insert' });
    }
});

app.get('/getAttendance', async (req, res) => {
    const { groupID, dateID } = req.query;

    try {
        const attendanceData = await knex('activity')
            .where({ groupID, dateID }) // ดึงข้อมูลแยกตาม groupID และ dateID
            .select('stdID', 'checkStatus');

        res.json(attendanceData);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Failed to fetch attendance data' });
    }
});

app.post('/updateProfile', async (req,res) => {
    try {
        const update = await knex('students')
            .where('stdID', '=', req.body.stdID)
            .update({
                stdFirstName: req.body.stdFirstName,
                stdLastName: req.body.stdLastName,
                tel: req.body.tel,
                email: req.body.email
            })
        res.send({
            status: 1,
            message: 'insert complete'
        })
    } catch (error) {
        res.send({ message: 'insert error' })
    }
})

app.post('/updateTeacherProfile', async (req,res) => {
    try {
        const update = await knex('teachers')
            .where('adviserID', '=', req.body.adviserID)
            .update({
                teacherFirstName: req.body.teacherFirstName,
                teacherLastName: req.body.teacherLastName,
                tel: req.body.tel,
                email: req.body.email
            })
        res.send({
            status: 1,
            message: 'insert complete'
        })
    } catch (error) {
        res.send({ message: 'insert error' })
    }
})

app.post('/insertRoom', async (req, res) => {
    console.log(req.body);  // สำหรับตรวจสอบข้อมูลที่ได้รับจาก frontend
    try {
        // บันทึกข้อมูลห้องเรียนในตาราง room
        await knex('room').insert({
            roomName: req.body.roomName  // บันทึกข้อมูลห้อง
        });

        // ดึง roomID ที่ล่าสุดจากการ insert ในตาราง room
        const room = await knex('room')
            .where('roomName', req.body.roomName)
            .orderBy('roomID', 'desc')
            .first();  // ดึงแถวแรกจากการเรียงลำดับตาม roomID ลดลง

        // ส่งกลับค่า roomID ไปยัง frontend
        res.send({ status: 1, roomID: room.roomID });
    } catch (error) {
        console.log(error);
        res.send({ status: 0 });
    }
});

// ส่วนที่บันทึกข้อมูลลงในตาราง group (จากการส่งข้อมูลมา)
app.post('/insertGroup', async (req, res) => {
    console.log(req.body);  // ตรวจสอบข้อมูลที่ได้รับจาก frontend
    try {
        // บันทึกข้อมูลกลุ่มลงในตาราง group
        await knex('group').insert({
            roomID: req.body.roomID, 
            branchID: req.body.branchID, 
            depID: req.body.depID,
            adviserID: req.body.adviserID
        });

        res.send({ status: 1 });
    } catch (error) {
        console.log(error);
        res.send({ status: 0 });
    }
});

app.get('/getDateID', async (req, res) => {
    const dateName = req.query.date;  // วันที่ในรูปแบบ "20 มกราคม 2568"
    const groupID = req.query.groupID;
    
    console.log('Original date:', dateName);
    console.log('Received groupID:', groupID); // ตรวจสอบค่า groupID

    try {
        const formattedDate = formatToISODate(dateName);  // แปลงเป็น "YYYY-MM-DD"
        console.log('Formatted date:', formattedDate);

        // เช็คว่าค่า groupID มีจริงไหม
        if (!groupID) {
            return res.status(400).json({ error: 'groupID is missing' });
        }

        // ใช้วันที่ที่แปลงแล้วในการค้นหาจากฐานข้อมูล
        const getDateID = await knex('date')
            .where('date', '=', formattedDate)
            .andWhere('groupID', '=', groupID)  // groupID อาจเป็น undefined
            .select('dateID');

        res.send({
            dateID: getDateID[0]?.dateID || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Cant get Date' });
    }    
});

app.post('/updateDate', async (req, res) => {
    const oldDate = req.body.oldDate; // วันที่เก่า
    const newDate = req.body.date;    // วันที่ใหม่ที่แก้ไข

    console.log('Old Date:', oldDate);
    console.log('New Date:', newDate);

    try {
        // อัปเดตวันที่ในฐานข้อมูล
        const updateDate = await knex('date')
            .where({ date: oldDate })  // ค้นหาจากวันที่เก่า
            .update({ date: newDate });  // อัปเดตเป็นวันที่ใหม่

        if (updateDate) {
            res.send({
                status: 'Update complete'
            });
        } else {
            res.status(400).send({ error: 'Date not found or update failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Cant update' });
    }
})

app.get('/deleteStudent', async (req, res) => {
    const stdID = req.query.stdID

    if (!stdID) {
        return res.status(400).json({ error: 'Missing student ID' })
    }

    try {
        await knex('students')
            .where({ stdID })
            .del()
        res.status(200).json({ message: 'Student deleted successfully' })
    } catch (error) {
        console.error('Error deleting student:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.get('/updateStatus', async (req, res) => {
    try {
        const { statusID, stdFirstName, stdLastName, stdID } = req.query;

        if (!statusID || !stdFirstName || !stdLastName || !stdID) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const updateStatus = await knex('students')
            .where({ stdID })
            .update({ statusID, stdFirstName, stdLastName });

        if (updateStatus) {
            res.send({ status: 'Update complete' });
        } else {
            res.status(400).send({ error: 'Update failed, no records updated' });
        }
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/listDateStudent', async (req, res) => {
    try {
        // ดึงข้อมูลจากฐานข้อมูลและแปลงรูปแบบวันที่ให้เป็น 'YYYY-MM-DD'
        let row = await knex('date')
            .select(knex.raw("DATE_FORMAT(date, '%Y-%m-%d') AS date"))
            .where('groupID', '=', req.query.groupID)
            .orderByRaw('date DESC')  // เพิ่มการเรียงลำดับจากใหม่ไปเก่า

        // แปลงวันที่จาก 'YYYY-MM-DD' เป็น "วันที่ {day} {month} {year}"
        const formattedRow = row.map(item => ({
            ...item,
            date: formatDate(item.date)  // แปลงวันที่
        }));

        console.log(formattedRow)

        res.send({
            datas: formattedRow
        })
    } catch (error) {
        res.send({ ok: 0, error: error.message });
    }
})

app.get('/listActivityStudent', async (req, res) => {
    try {
        console.log("Received groupID:", req.query.groupID); // เช็คค่าที่รับเข้ามา

        if (!req.query.groupID) {
            return res.status(400).send({ ok: 0, error: "Missing groupID" });
        }

        // ดึงข้อมูลจากฐานข้อมูล
        let rows = await knex('students')
            .join('group', 'students.groupID', '=', 'group.groupID')
            .join('activity', 'students.stdID', '=', 'activity.stdID')
            .select(
                'students.stdID',
                'students.stdFirstName',
                'students.stdLastName',
                'students.groupID',
                'students.profilePic',
                'activity.dateID',
                'activity.checkStatus'
            )
            .where('students.groupID', '=', req.query.groupID); // ✅ แก้ where ให้ถูกต้อง

        console.log("Query Result:", rows); // 🟢 ตรวจสอบว่ามีข้อมูลจากฐานข้อมูลหรือไม่

        if (rows.length === 0) {
            return res.send({ ok: 1, data: [] }); // ✅ ส่งค่ากลับเป็น array ว่างถ้าไม่มีข้อมูล
        }

        // จัดกลุ่มข้อมูลตาม stdID
        let groupedData = rows.reduce((acc, row) => {
            let key = row.stdID;
            if (!acc[key]) {
                acc[key] = {
                    stdFirstName: row.stdFirstName,
                    stdLastName: row.stdLastName,
                    groupID: row.groupID,
                    stdID: row.stdID,
                    profilePic: row.profilePic,
                    activities: []
                };
            }
            acc[key].activities.push({
                dateID: row.dateID,
                checkStatus: row.checkStatus
            });
            return acc;
        }, {});

        let result = Object.values(groupedData);
        console.log("Final Result:", result); // ✅ ดูผลลัพธ์ที่ส่งกลับ

        res.send({ ok: 1, data: result });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).send({ ok: 0, error: error.message });
    }
});

app.get('/listActivity', async (req, res) => {
    const stdID = req.query.stdID
    try {
        const activity = await knex('activity')
            .join('date', 'activity.dateID', '=', 'date.dateID')
            .select('activity.checkStatus', 'date.date', 'date.dateID')
            .where('activity.stdID', '=', stdID)
            .orderBy('date', 'desc')
            
        // แปลงวันที่ให้เป็นรูปแบบ "วันที่ 13 ตุลาคม 2567"
        const formattedActivity = activity.map(item => ({
            ...item,
            date: formatDate(item.date) // แปลงวันที่
        }));
        
        res.send({
            activity: formattedActivity
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Cant list data' });
    }    
});

// ฟังก์ชันแปลงวันที่
const formatDate = (dateStr) => {
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const date = new Date(dateStr); // แปลงจากวันที่ในรูปแบบ string
    const day = date.getDate(); // วันที่
    const month = monthNames[date.getMonth()]; // เดือน
    const year = date.getFullYear() + 543; // ปี พ.ศ. (เพิ่ม 543)

    return `${day} ${month} ${year}`; // คืนค่าผลลัพธ์
};

const formatToISODate = (thaiDate) => {
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    // แยกวันที่จากรูปแบบ "20 มกราคม 2568"
    const [dayStr, monthStr, yearStr] = thaiDate.split(' '); // dayStr = '20', monthStr = 'มกราคม', yearStr = '2568'
    const day = String(dayStr).padStart(2, '0');  // เติมศูนย์หน้าหากวันเป็นหลักเดียว เช่น '01'
    const month = String(monthNames.indexOf(monthStr) + 1).padStart(2, '0');  // แปลงชื่อเดือนเป็นหมายเลข
    const year = String(parseInt(yearStr) - 543);  // แปลงปี พ.ศ. เป็น ค.ศ.

    // สร้างวันที่ในรูปแบบ "YYYY-MM-DD"
    return `${year}-${month}-${day}`;
};

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});