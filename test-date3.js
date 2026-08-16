const { format } = require('date-fns-jalali');

const jalaliFa = require('date-fns-jalali/locale/fa-IR');

try {
  console.log("Jalali:", format(new Date(), 'd MMMM yyyy'));
  console.log("Jalali with explicit locale:", format(new Date(), 'd MMMM yyyy', { locale: jalaliFa }));
} catch (e) {
  console.log("Error:", e.message);
}
