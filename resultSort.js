import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const FIELDS = ['Name', 'First Contentful Paint', 'Largest Contentful Paint', 'Total Blocking Time', 'Cumulative Layout Shift', 'Speed Index', 'Total Score'];

function sortResult() {
  let table = [];
  table.push(FIELDS);
  traverseFolder('./results', table);

  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.aoa_to_sheet(table);
  xlsx.utils.book_append_sheet(workbook, sheet, 'Sheet1');

  const filename = `results${getTime()}.xlsx`;
  try {
    xlsx.writeFile(workbook, filename);
    console.log('Result output success!')
  } catch(err) {
    console.log('Result output fail! Error:', err);
  }
}

function getTime() {
  const now = new Date(); 
  const dateStr = now.toLocaleString(); // 获取当前日期字符串，格式根据操作系统的区域设置而定
  const [year, month, daytime] = dateStr.split('/'); // 根据具体格式使用适当的分隔符拆分日期字符串
  const [day,time] = daytime.split(' ');
  const [hour, min, sec] = time.split(':')
  return `${year}-${month}-${day}-${hour}-${min}-${sec}`;
}

// 遍历文件夹
function traverseFolder(folderPath, table) {
  const files = fs.readdirSync(folderPath);
  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      traverseFolder(filePath, table);
    } else {
      if (file.includes(".json")) {
        const jsonString = fs.readFileSync(filePath, 'utf-8');
        const jsonArray = JSON.parse(jsonString);
        table.push(getFactors(jsonArray, file));
      }
    }
  })
}

function getFactors(json, file) {
    return [
      file.substring(0, file.length - 5),
      `${json.audits["first-contentful-paint"].displayValue}(${json.audits["first-contentful-paint"].score * 100})`,
      `${json.audits["largest-contentful-paint"].displayValue}(${json.audits["largest-contentful-paint"].score * 100})`,
      `${json.audits["total-blocking-time"].displayValue}(${json.audits["total-blocking-time"].score * 100})`,
      `${json.audits["cumulative-layout-shift"].displayValue}(${json.audits["cumulative-layout-shift"].score * 100})`,
      `${json.audits["speed-index"].displayValue}(${json.audits["speed-index"].score * 100})`,
      `${json.categories.performance.score * 100}`
    ]
}

export {sortResult};