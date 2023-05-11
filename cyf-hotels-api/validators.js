function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /[+\-()0-9 ]/g;
  // alternate check:
  // const phoneRegex = /^\d{11}$/;
  return phoneRegex.test(phoneNumber);
}

module.exports = { validateEmail, validatePhoneNumber };
