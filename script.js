const form = document.querySelector("#client-form");
const firstNameInput = document.querySelector("#first-name");
const lastNameInput = document.querySelector("#last-name");
const phoneInput = document.querySelector("#phone");

const firstNameError = document.querySelector("#first-name-error");
const lastNameError = document.querySelector("#last-name-error");
const phoneError = document.querySelector("#phone-error");

const summaryFirstName = document.querySelector("#summary-first-name");
const summaryLastName = document.querySelector("#summary-last-name");
const summaryPhone = document.querySelector("#summary-phone");
const successMessage = document.querySelector("#success-message");

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function removeFrenchLeadingZero(digits) {
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

function formatFrenchNationalNumber(digits) {
  const normalizedDigits = removeFrenchLeadingZero(digits).slice(0, 9);
  const groups = [normalizedDigits.slice(0, 1)];

  for (let index = 1; index < normalizedDigits.length; index += 2) {
    groups.push(normalizedDigits.slice(index, index + 2));
  }

  return groups.filter(Boolean).join(" ");
}

function formatFrenchInternationalNumber(digits) {
  const nationalNumber = formatFrenchNationalNumber(digits);
  return nationalNumber ? `+33 ${nationalNumber}` : "-";
}

function validateRequiredText(input, errorElement, label) {
  const value = input.value.trim();

  if (!value) {
    errorElement.textContent = `${label} est obligatoire.`;
    return false;
  }

  errorElement.textContent = "";
  return true;
}

function validatePhone() {
  const digits = removeFrenchLeadingZero(onlyDigits(phoneInput.value));

  if (!digits) {
    phoneError.textContent = "Le numéro de téléphone est obligatoire.";
    return false;
  }

  if (digits.length !== 9) {
    phoneError.textContent = "Le numéro doit contenir 9 chiffres après +33.";
    return false;
  }

  phoneError.textContent = "";
  return true;
}

function updateSummary() {
  const phoneDigits = onlyDigits(phoneInput.value);

  summaryFirstName.textContent = firstNameInput.value.trim() || "-";
  summaryLastName.textContent = lastNameInput.value.trim() || "-";
  summaryPhone.textContent = formatFrenchInternationalNumber(phoneDigits);
}

phoneInput.addEventListener("input", () => {
  const digits = onlyDigits(phoneInput.value);
  phoneInput.value = formatFrenchNationalNumber(digits);
  successMessage.hidden = true;
  updateSummary();
});

[firstNameInput, lastNameInput].forEach((input) => {
  input.addEventListener("input", () => {
    successMessage.hidden = true;
    updateSummary();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isFirstNameValid = validateRequiredText(firstNameInput, firstNameError, "Le prénom");
  const isLastNameValid = validateRequiredText(lastNameInput, lastNameError, "Le nom");
  const isPhoneValid = validatePhone();

  updateSummary();
  successMessage.hidden = !(isFirstNameValid && isLastNameValid && isPhoneValid);
});
