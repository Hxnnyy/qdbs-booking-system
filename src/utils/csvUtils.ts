
export const downloadCsvTemplate = () => {
  const headers = "Guest Name,Phone Number,Barber Name,Service Name,Date (DD/MM/YYYY),Time (HH:MM),Notes\n";
  const exampleRow = "John Smith,07700900000,David Allen,Haircut,01/05/2023,14:30,Regular client\n";
  
  const blob = new Blob([headers, exampleRow], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'booking_import_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
