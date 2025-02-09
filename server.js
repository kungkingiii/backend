// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(express.json()); // รองรับ JSON request

// // Mock Data - จำลองข้อมูลคอร์ส
// const courses = [
//   { id: 1, title: "JavaScript for Beginners", description: "เรียนรู้ JavaScript ตั้งแต่พื้นฐาน" },
//   { id: 2, title: "React.js Masterclass", description: "สร้างเว็บแอปด้วย React.js" }
// ];

// // 📌 API: ดึงคอร์สทั้งหมด
// app.get("/courses", (req, res) => {
//   res.json(courses);
// });

// // 📌 API: ดึงรายละเอียดคอร์ส
// app.get("/courses/:id", (req, res) => {
//   const course = courses.find(c => c.id === parseInt(req.params.id));
//   course ? res.json(course) : res.status(404).json({ message: "Course not found" });
// });

// // 📌 API: สมัครเรียน
// app.post("/courses/:id/register", (req, res) => {
//   res.json({ message: `ลงทะเบียนเรียนคอร์สที่ ${req.params.id} สำเร็จ!` });
// });

// // 📌 ตั้งค่า PORT และรันเซิร์ฟเวอร์
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const users = []; // จำลองฐานข้อมูลผู้ใช้
// const courses = [
//   { id: 1, title: "JavaScript for Beginners", description: "เรียนรู้ JavaScript ตั้งแต่พื้นฐาน" },
//   { id: 2, title: "React.js Masterclass", description: "สร้างเว็บแอปด้วย React.js" }
// ];


// const pool = new Pool({
//   user: "postgres",       // เปลี่ยนเป็นชื่อ user ของคุณ
//   host: "localhost",
//   database: "online_courses",  // ใช้ฐานข้อมูลที่คุณสร้าง
//   password: "23082539",    // ใส่รหัสผ่านของคุณ
//   port: 5432,
// });


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//============================================================
// 📌 API: ดึงคอร์สทั้งหมด
// app.get("/courses", (req, res) => {
//   res.json(courses);
// });

// 📌 API: ดึงรายละเอียดคอร์ส
app.get("/courses/:id", async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const result = await pool.query(`SELECT * FROM courses WHERE id = ${id};`);
    res.json(result.rows[0]);
    // }
  } catch (err) {
    res.status(500).json({ message: "Course not found" });
  }

});

// 📌 API: สมัครเรียน
app.post("/courses/:id/register", async (req, res) => {
  const { courseId, username } = req.body;
  try {
    const addCourse = await pool.query(
      "UPDATE users SET registered_courses = array_append(registered_courses, $1) WHERE username = $2;", [courseId, username]);
    // console.log("checkUser", (await bcrypt.compare(password, checkUser.rows[0].password)));
    const userData = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    res.json(userData.rows[0]);
  } catch (err) {
    console.error("❌ Error add course:", err);
    res.status(500).json({ message: "❌ เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});


//=========================================================

// 📌 API: สมัครสมาชิก
app.post("/register", async (req, res) => {


  const { username, name, email, phone, password } = req.body;

  try {
    // ตรวจสอบว่า email มีอยู่แล้วหรือไม่
    // const checkUser = await pool.query("SELECT * FROM users WHERE email = $1", [username]);
    // if (checkUser.rows.length > 0) {
    //   return res.status(400).json({ message: "❌ Username นี้ถูกใช้งานแล้ว" });
    // }
    // const checkEmail = await pool.query("SELECT * FROM users WHERE email = $3", [email]);

    // if (checkEmail.rows.length > 0) {
    //   return res.status(400).json({ message: "❌ Email นี้ถูกใช้งานแล้ว" });
    // }
    const hashedPassword = await bcrypt.hash(password, 10);
    // ถ้า email ยังไม่ถูกใช้ -> เพิ่มข้อมูลใหม่
    const newUser = await pool.query(
      "INSERT INTO users (username,name, email, phone ,password, registered_courses) VALUES ($1, $2, $3, $4,$5,$6) RETURNING *",
      [username, name, email, phone, hashedPassword, []]
    );

    res.status(201).json({ message: "✅ สมัครสมาชิกสำเร็จ", user: newUser.rows[0] });
  } catch (err) {
    console.error("❌ Error registering user:", err);
    res.status(500).json({ message: "❌ เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// 📌 API: เข้าสู่ระบบ
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // const user = users.find(user => user.username === username);

  // if (!user || !(await bcrypt.compare(password, user.password))) {
  //   return res.status(401).json({ message: "Invalid credentials" });
  // }

  try {
    const checkUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    console.log("checkUser", (await bcrypt.compare(password, checkUser.rows[0].password)));
    if (checkUser.rows.length == 0 || !(await bcrypt.compare(password, checkUser.rows[0].password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error("❌ Error login user:", err);
    res.status(500).json({ message: "❌ เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// 📌 Middleware: ตรวจสอบ Token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// 📌 API: ดึงข้อมูลโปรไฟล์ (ต้องใช้ Token)
app.get("/profile", authenticate, async (req, res) => {

  const username = req.user.username;
  let userCouse = []

  const userData = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  for (let courseId of userData.rows[0].registered_courses) {

    const couse = await pool.query("SELECT * FROM courses WHERE id = $1", [courseId]);
    userCouse.push(couse.rows[0])
  }

  res.json({ userData: userData.rows[0], userCouse });
});

// 📌 API: ดึงข้อมูลโปรไฟล์ (ต้องใช้ Token)
app.get("/userdata", authenticate, async (req, res) => {

  const username = req.user.username;


  const userData = await pool.query("SELECT * FROM users WHERE username = $1", [username]);


  res.json(userData.rows[0]);
});

//===============================================================

// 📌 ตรวจสอบการเชื่อมต่อ
pool.connect()
  .then(() => console.log("✅ เชื่อมต่อ PostgreSQL สำเร็จ!"))
  .catch(err => console.error("❌ เชื่อมต่อ PostgreSQL ไม่สำเร็จ:", err));

app.get("/courses", async (req, res) => {
  try {
    const { search } = req.query; // รับค่าที่ใช้ค้นหา
    let query = "SELECT * FROM courses";
    let values = [];

    if (search) {
      query += " WHERE title ILIKE $1"; // ค้นหาคอร์สที่มีคำในชื่อ
      values.push(`%${search}%`);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// 📌 API: เพิ่มคอร์สใหม่
app.post("/courses", async (req, res) => {
  try {
    const { title, description, price } = req.body;
    await pool.query(
      "INSERT INTO courses (title, description, price) VALUES ($1, $2, $3)",
      [title, description, price]
    );
    res.json({ message: "เพิ่มคอร์สสำเร็จ!" });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});



// 📌 รันเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


