const xlsx = require("xlsx");
const path = require("path");
module.exports.exportExcel = (
  datas,
  coloumnnames,
  nameofsheet,
  pathandname
) => {
  const workbook = xlsx.utils.book_new();
  const data = [coloumnnames, ...datas];
    const worksheet = xlsx.utils.aoa_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, nameofsheet);
    xlsx.writeFile(workbook, path.join(`./public/${pathandname}`));
};
