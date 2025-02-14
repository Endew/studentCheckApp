const express = require('express');
const router = express.Router();
const knex = require('../config/database');

router.post('/addStudent', async (req, res) => {
    console.log(req.body)
    try {
        let data = await knex('students')
        .insert({
            stdUserName: req.body.studentid,
            stdPass: req.body.id,
            stdFirstName: `${req.body.title}${req.body.fname}`,
            stdLastName: req.body.lname,
            statusID: 1,
            profilePic: req.body.profilePic,
            groupID: req.body.groupID
        })
        res.send({ status: 1, message: 'insert ok'})
    } catch (error) {
        res.send({ status: 0, error: error.message });
    }
})

router.get('/deleteStudent', async (req, res) => {
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

router.get('/listStudent', async (req, res) => {
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