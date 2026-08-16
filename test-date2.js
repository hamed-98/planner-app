const { format } = require('date-fns-jalali');

try {
  console.log("Jalali:", format(new Date(), 'd MMMM yyyy'));
} catch (e) {
  console.log("Error:", e.message);
}
