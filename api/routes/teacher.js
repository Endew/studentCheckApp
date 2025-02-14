const express = require('express');
const router = express.Router();
const knex = require('../config/database');

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

router.post('/getAdviserID', async (req, res) => {
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

router.post('/addTeacherGroup', async (req, res) => {
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

module.exports = router;