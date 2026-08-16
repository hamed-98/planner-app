const { format } = require('date-fns-jalali');
const { faIR } = require('date-fns/locale');

try {
  console.log("Jalali:", format(new Date(), 'd MMMM yyyy', { locale: faIR }));
} catch (e) {
  console.log("Error:", e.message);
}
