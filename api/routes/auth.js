const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateToken, SECRET_KEY } = require('../middleware/auth');
const knex = require('../config/database');

router.post('/doLogin', async (req, res) => {
    console.log(req.body);
    let users = await knex('students')
        .where({ stdUserName: req.body.username, stdPass: req.body.password });
        console.log(users);

    if (users.length > 0) {
        let role = users[0].statusID;

        let data = {
            username: req.body.username,
            stdFirstName: users[0].stdFirstName,
            stdLastName: users[0].stdLastName,
            groupID: users[0].groupID,
            statusID: users[0].statusID,
            stdID: users[0].stdID,
            profilePic: users[0].profilePic
        };

        const token = jwt.sign(
            { stdUserName: users[0].stdUserName, statusID: users[0].statusID },
            SECRET_KEY,
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
            groupID: group ? group.groupID : null // ถ้าไม่มี group ให้ส่งค่า null
        };

        const token = jwt.sign(
            { teacherUserName: users[0].teacherUserName, statusID: users[0].statusID },
            SECRET_KEY,
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
            SECRET_KEY,
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

router.get('/checkToken', authenticateToken, (req, res) => {
    res.json({ 
        message:'token correct',
        status: 1
    });
});

module.exports = router;