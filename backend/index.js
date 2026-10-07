require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const path = require('path');
const authRoutes = require('./routes/auth/authRoutes.js');
const craneRoutes = require('./routes/cranes/craneRoutes.js');
const operatorRoutes = require('./routes/operators/operatorRoutes.js');
const riggerRoutes = require('./routes/riggers/riggerRoutes.js');
const attendanceRoutes = require('./routes/attendance/attendanceRoutes.js');
const siteRoutes = require('./routes/sites/siteRoutes.js');
const assignmentRoutes = require('./routes/assignments/assignmentRoutes.js');
const logbookRoutes = require('./routes/logbook/logbookRoutes.js');
// const patientRegistrationRoutes = require('./routes/patient/patientRoutes.js');
// const masterDataRoutes = require('./routes/master-data/masterDataRoutes.js');
// const patientReportRoutes = require('./routes/reports/patientReportRoutes.js');
// const roleRoutes = require('./routes/users/permissionRoutes.js');
// const modules_tablesRoutes = require('./routes/system/modules_tablesRoutes.js');


const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/cranes', craneRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/riggers', riggerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/logbook', logbookRoutes);
// app.use("/api/patient", patientRegistrationRoutes);
// app.use("/api/master-data", masterDataRoutes);
// app.use("/api/reports", patientReportRoutes);
// app.use("/api/users", roleRoutes);
// app.use("/api/system", modules_tablesRoutes);


const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));