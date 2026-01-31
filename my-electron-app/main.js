const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db');

let mainWindow;

function createLoginWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 650,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    mainWindow.loadFile('index.html');
}

function createDashboardWindow(user) {
    const dashboardWindow = new BrowserWindow({
        width: 1300,
        height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    dashboardWindow.loadFile('dashboard.html');
    dashboardWindow.webContents.on('did-finish-load', () => {
        dashboardWindow.webContents.send('user-data', user);
    });
    mainWindow.close();
}

app.whenReady().then(createLoginWindow);

// LOGIN & REGISTER (same as before)
ipcMain.handle('register', async (event, user) => {
    try {
        const stmt = db.prepare('INSERT INTO users (name,email,password) VALUES (?,?,?)');
        stmt.run(user.name, user.email, user.password);
        return { success: true };
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return { success: false, message: 'Email exists!' };
        return { success: false, message: err.message };
    }
});

ipcMain.handle('login', async (event, credentials) => {
    try {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
        const user = stmt.get(credentials.email, credentials.password);
        if (user) {
            createDashboardWindow(user);
            return { success: true };
        } else {
            return { success: false, message: 'Invalid email or password' };
        }
    } catch (err) { return { success: false, message: err.message }; }
});

// DASHBOARD DATA
ipcMain.handle('dashboard-data', () => {
    const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get().count;
    const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;
    return { studentCount, teacherCount, classCount };
});


// --- CRUD for Students ---
ipcMain.handle('get-students', () => db.prepare('SELECT * FROM students').all());
ipcMain.handle('add-student', (event, student) => {
    db.prepare('INSERT INTO students (name,class,email) VALUES (?,?,?)').run(student.name, student.class, student.email);
    return { success: true };
});
ipcMain.handle('update-student', (event, student) => {
    db.prepare('UPDATE students SET name=?, class=?, email=? WHERE id=?').run(student.name, student.class, student.email, student.id);
    return { success: true };
});
ipcMain.handle('delete-student', (event, id) => {
    db.prepare('DELETE FROM students WHERE id=?').run(id);
    return { success: true };
});

// --- CRUD for Teachers ---
ipcMain.handle('get-teachers', () => db.prepare('SELECT * FROM teachers').all());
ipcMain.handle('add-teacher', (event, teacher) => {
    db.prepare('INSERT INTO teachers (name,subject,email) VALUES (?,?,?)').run(teacher.name, teacher.subject, teacher.email);
    return { success: true };
});
ipcMain.handle('update-teacher', (event, teacher) => {
    db.prepare('UPDATE teachers SET name=?, subject=?, email=? WHERE id=?').run(teacher.name, teacher.subject, teacher.email, teacher.id);
    return { success: true };
});
ipcMain.handle('delete-teacher', (event, id) => {
    db.prepare('DELETE FROM teachers WHERE id=?').run(id);
    return { success: true };
});

// --- CRUD for Classes ---
ipcMain.handle('get-classes', () => db.prepare('SELECT * FROM classes').all());
ipcMain.handle('add-class', (event, cls) => {
    db.prepare('INSERT INTO classes (name,teacher) VALUES (?,?)').run(cls.name, cls.teacher);
    return { success: true };
});
ipcMain.handle('update-class', (event, cls) => {
    db.prepare('UPDATE classes SET name=?, teacher=? WHERE id=?').run(cls.name, cls.teacher, cls.id);
    return { success: true };
});
ipcMain.handle('delete-class', (event, id) => {
    db.prepare('DELETE FROM classes WHERE id=?').run(id);
    return { success: true };
});
