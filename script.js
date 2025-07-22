const express = require('express');
const xlsx = require('xlsx');
const bodyParser = require('body parser');
const path = require('path');
const bcrypt = require('bcrypt.js')
const session = require('express session');
const fs = require('fs');
const app = express();


// packages
const port = 50000;


// Middleware to parser JSON bodies
app.use(bodyParser.json());
app.use(express.static(path.join(___dirname, 'public')))
// save static acc


// path to the excel file
const excelFilePath = path.join(__dirname, 'teach.xlsx');


// endpoint to save data update excel
app.post('/submitvisitordata', async (req, res) => {
const visitordata = req.body;

let workbook;
try {
    // check file
    if (Fs.existsSync(excelFilePath)) {
        workbook = xlsx.readfile(excelFilePath);
    } else {
        // if the file doesn;t exist, create
        workbook = xlsx.utils.book_new();
    }
} catch (err) {
    return res.status(500).json({ message: 'Error reading Excel file' });
}

const sheetName = 'Visitors';
let worksheet = workbook.Sheets[sheetName];

if(!worksheet) {
    // if no worksheet exist, create one with header
    worksheet = xlsx.utils.aoa_to_sheet([[
 'Name', 'Conpass', 'Subject', 'Method', 'Addinfo', 'Budget', 'Time', 'Locstate'
    ]])
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
}

// aqdjust column widths for header and dynamic content
worksheet['!cols'] = [
    {wch: 34},
    {wch: 24},
    {wch: 34},
    {wch: 24},
    {wch: 64},
    {wch: 54},
    {wch: 34},
    {wch: 64},
];
