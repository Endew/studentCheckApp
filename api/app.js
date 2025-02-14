const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();  

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/profilePic', express.static('profilePic'));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/profile', require('./routes/profile'));
app.use('/activity', require('./routes/activity'));
app.use('/student', require('./routes/student'));
app.use('/teacher', require('./routes/teacher'));

const port = 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});