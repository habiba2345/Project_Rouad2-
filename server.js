/* ===========================================================
   رواد البيئة — باك إند بسيط
   - يخدّم ملفات الفرونت إند (public/)
   - يستقبل رسائل نموذج "اتواصل معانا" ويخزّنها في ملف إكسل
     بدون الحاجة لقاعدة بيانات
=========================================================== */

const path = require('path');
const fs = require('fs');
const express = require('express');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const EXCEL_PATH = path.join(DATA_DIR, 'contacts.xlsx');
const SHEET_NAME = 'رسائل التواصل';
const COLUMNS = [
  { header: 'الاسم', key: 'name', width: 26 },
  { header: 'السن', key: 'age', width: 10 },
  { header: 'العنوان بالتفصيل', key: 'address', width: 45 },
  { header: 'الرسالة', key: 'message', width: 45 },
  { header: 'تاريخ الإرسال', key: 'submittedAt', width: 22 }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// يضمن وجود مجلد الداتا وملف الإكسل بالهيدر الصحيح
async function ensureExcelFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(EXCEL_PATH)) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(SHEET_NAME);
    sheet.columns = COLUMNS;
    sheet.getRow(1).font = { bold: true };
    await workbook.xlsx.writeFile(EXCEL_PATH);
  }
}

// يضيف صف جديد لملف الإكسل الموجود
// ملاحظة: بعد قراءة ملف موجود من القرص، ExcelJS لا يحتفظ بخاصية "key" الخاصة
// بالأعمدة (فهي غير مخزّنة داخل تنسيق xlsx نفسه)، لذلك بنضيف الصف بترتيب
// مصفوفة يطابق ترتيب الأعمدة بدل الاعتماد على المفاتيح، لضمان تخزين البيانات فعليًا.
async function appendContactRow(row) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_PATH);
  let sheet = workbook.getWorksheet(SHEET_NAME);
  if (!sheet) {
    sheet = workbook.addWorksheet(SHEET_NAME);
    sheet.columns = COLUMNS;
    sheet.getRow(1).font = { bold: true };
  }
  const rowValues = COLUMNS.map(col => row[col.key]);
  sheet.addRow(rowValues);
  await workbook.xlsx.writeFile(EXCEL_PATH);
}

app.post('/api/contact', async (req, res) => {
  try {
    const { name, age, address, message } = req.body || {};

    // تحقق بسيط من البيانات المطلوبة
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'من فضلك أدخل الاسم.' });
    }
    if (!age || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120) {
      return res.status(400).json({ success: false, error: 'من فضلك أدخل سن صحيح.' });
    }
    if (!address || !String(address).trim()) {
      return res.status(400).json({ success: false, error: 'من فضلك أدخل العنوان بالتفصيل.' });
    }

    await ensureExcelFile();
    await appendContactRow({
      name: String(name).trim(),
      age: Number(age),
      address: String(address).trim(),
      message: message ? String(message).trim() : '',
      submittedAt: new Date().toLocaleString('ar-EG')
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('خطأ أثناء حفظ بيانات التواصل:', err);
    return res.status(500).json({ success: false, error: 'حصل خطأ في السيرفر، حاول تاني لاحقًا.' });
  }
});

app.listen(PORT, () => {
  console.log(`🌿 موقع رواد البيئة شغّال على http://localhost:${PORT}`);
  console.log(`📊 بيانات التواصل هتتخزن في: ${EXCEL_PATH}`);
});
