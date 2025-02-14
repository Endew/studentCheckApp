const express = require('express');
const router = express.Router();
const knex = require('../config/database');
const { formatDate } = require('../utils/dateFormatter');

router.post('/insertActivity', async (req, res) => {
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

router.get('/listActivity', async (req, res) => {
    const stdID = req.query.stdID
    try {
        const activity = await knex('activity')
            .join('date', 'activity.dateID', '=', 'date.dateID')
            .select('activity.checkStatus', 'date.date')
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

router.post('/addDate', async (req, res) => {
    console.log(req.body)
    try {
        let date = await knex('date')
            .insert({ date: req.body.date })
        res.send({
            status: 1,
            message: 'insert success'
        })
    } catch (error) {
        res.send({ status: 0, error: error.message });
    }
})

router.get('/listActivityStudent', async (req, res) => {
    try {
        // ดึงข้อมูลจากฐานข้อมูล
        let rows = await knex('students')
            .join('group', 'students.groupID', '=', 'group.groupID')
            .join('activity', 'students.stdID', '=', 'activity.stdID')
            .select(
                'students.stdID',
                'students.stdFirstName',
                'students.stdLastName',
                'students.groupID',
                'activity.dateID',
                'activity.checkStatus'
            );

        // จัดกลุ่มข้อมูลตาม stdID
        let groupedData = rows.reduce((acc, row) => {
            let key = row.stdID;
            if (!acc[key]) {
                acc[key] = {
                    stdFirstName: row.stdFirstName,
                    stdLastName: row.stdLastName,
                    groupID: row.groupID,
                    stdID: row.stdID,
                    activities: []
                };
            }
            acc[key].activities.push({
                dateID: row.dateID,
                checkStatus: row.checkStatus
            });
            return acc;
        }, {});

        // แปลงข้อมูลเป็น array
        let result = Object.values(groupedData);

        // ส่งข้อมูลกลับไป
        res.send({ ok: 1, data: result });
    } catch (error) {
        res.send({ ok: 0, error: error.message });
    }
});

router.post('/addTeacher', async (req, res) => {
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
            teacherUserName: req.body.teacherID,
        });
    } catch (error) {
        res.send({ status: 0, error: error.message });
    }
});

router.get('/getRoomName', async (req, res) => {
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

router.get('/getGroup', async (req, res) => {
    try {
        const data = await knex('group')
        .select('group.groupID');
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching group data:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/getStatus', async (req, res) => {
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

router.get('/getDepName', async (req, res) => {
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

router.get('/getSelectedRoom', async (req, res) => {
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

router.post('/insertRoom', async (req, res) => {
    console.log(req.body)
    try {
        let insert = await knex('group')
        .insert({
            roomID: req.body.roomID, 
            branchID: req.body.branchID, 
            depID: req.body.depID
        })
        res.send({status:1})
    } catch (error) {
        res.send({status:0})
    }
})

router.get('/getDateID', async (req, res) => {
    const dateName = req.query.date;  // วันที่ในรูปแบบ "20 มกราคม 2568"
    console.log('Original date:', dateName);

    try {
        const formattedDate = formatToISODate(dateName);  // แปลงเป็น "2025-01-20"
        console.log('Formatted date:', formattedDate);

        // ใช้วันที่ที่แปลงแล้วในการค้นหาจากฐานข้อมูล
        const getDateID = await knex('date')
            .select('dateID')
            .where('date', '=', formattedDate);  // ใช้วันที่ในรูปแบบ "YYYY-MM-DD"
        
        res.send({
            dateID: getDateID[0]?.dateID
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Cant get Date' });
    }    
});

router.post('/updateDate', async (req, res) => {
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

router.get('/updateStatus', async (req, res) => {
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

router.get('/listDateStudent', async (req, res) => {
    try {
        console.log('date = ', req.query)

        // ดึงข้อมูลจากฐานข้อมูลและแปลงรูปแบบวันที่ให้เป็น 'YYYY-MM-DD'
        let row = await knex('date')
            .select(knex.raw("DATE_FORMAT(date, '%Y-%m-%d') AS date"))
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

module.exports = router;