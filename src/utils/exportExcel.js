import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportToExcel = ({ fileName, sheetName = "Sheet1", rows }) => {
  if (!rows || rows.length === 0) return false;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  downloadWorkbook(workbook, fileName);

  return true;
};

export const exportMultiSheetExcel = ({ fileName, sheets }) => {
  const validSheets = sheets.filter(
    (sheet) => sheet.rows && sheet.rows.length > 0
  );

  if (validSheets.length === 0) return false;

  const workbook = XLSX.utils.book_new();

  validSheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName);
  });

  downloadWorkbook(workbook, fileName);

  return true;
};

const downloadWorkbook = (workbook, fileName) => {
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, `${fileName}.xlsx`);
};