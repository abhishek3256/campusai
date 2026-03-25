const fs = require('fs');
const path = require('path');

const studentControllerPath = path.join(__dirname, 'studentController.js');
const newControllersPath = path.join(__dirname, 'new_controllers.js');

const studentController = fs.readFileSync(studentControllerPath, 'utf8');
const newControllers = fs.readFileSync(newControllersPath, 'utf8');

const combined = studentController + '\r\n' + newControllers;

fs.writeFileSync(studentControllerPath, combined, 'utf8');

console.log('✅ Successfully appended new controllers!');
console.log('New file size:', fs.statSync(studentControllerPath).size, 'bytes');
