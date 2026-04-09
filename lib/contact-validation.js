const PHONE_COUNTRIES = [
  {
    code: "MX",
    flag: "\uD83C\uDDF2\uD83C\uDDFD",
    label: "Mexico",
    prefix: "+52",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "5512345678",
  },
  {
    code: "US",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    label: "Estados Unidos",
    prefix: "+1",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "4155550123",
  },
  {
    code: "CA",
    flag: "\uD83C\uDDE8\uD83C\uDDE6",
    label: "Canada",
    prefix: "+1",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "4165550123",
  },
  {
    code: "ES",
    flag: "\uD83C\uDDEA\uD83C\uDDF8",
    label: "Espana",
    prefix: "+34",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "612345678",
  },
  {
    code: "CO",
    flag: "\uD83C\uDDE8\uD83C\uDDF4",
    label: "Colombia",
    prefix: "+57",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "3001234567",
  },
  {
    code: "AR",
    flag: "\uD83C\uDDE6\uD83C\uDDF7",
    label: "Argentina",
    prefix: "+54",
    minDigits: 10,
    maxDigits: 11,
    placeholder: "1123456789",
  },
  {
    code: "CL",
    flag: "\uD83C\uDDE8\uD83C\uDDF1",
    label: "Chile",
    prefix: "+56",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "912345678",
  },
  {
    code: "PE",
    flag: "\uD83C\uDDF5\uD83C\uDDEA",
    label: "Peru",
    prefix: "+51",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "912345678",
  },
];

const PHONE_COUNTRY_MAP = new Map(
  PHONE_COUNTRIES.map((country) => [country.code, country]),
);

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function validateEmail(email, { required = true } = {}) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return required ? "Ingresa un email valido." : "";
  }
  if (!isValidEmail(normalized)) {
    return "Ingresa un email valido.";
  }
  return "";
}

function normalizePhoneDigits(phoneNumber) {
  return String(phoneNumber || "")
    .replace(/\D+/g, "")
    .slice(0, 15);
}

function getPhoneCountry(countryCode) {
  return PHONE_COUNTRY_MAP.get(String(countryCode || "").toUpperCase()) || null;
}

function validatePhoneInput(
  countryCode,
  phoneNumber,
  { required = false } = {},
) {
  const digits = normalizePhoneDigits(phoneNumber);
  const hasDigits = digits.length > 0;
  const country = getPhoneCountry(countryCode);

  if (!hasDigits) {
    if (required) {
      return { ok: false, error: "Ingresa un telefono valido." };
    }
    return {
      ok: true,
      error: "",
      country: null,
      digits: "",
      e164: null,
    };
  }

  if (!country) {
    return { ok: false, error: "Selecciona un pais para el telefono." };
  }

  if (digits.length < country.minDigits || digits.length > country.maxDigits) {
    const range =
      country.minDigits === country.maxDigits
        ? `${country.minDigits} digitos`
        : `entre ${country.minDigits} y ${country.maxDigits} digitos`;
    return {
      ok: false,
      error: `El telefono para ${country.label} debe tener ${range}.`,
    };
  }

  return {
    ok: true,
    error: "",
    country,
    digits,
    e164: `${country.prefix}${digits}`,
  };
}

module.exports = {
  PHONE_COUNTRIES,
  getPhoneCountry,
  isValidEmail,
  normalizeEmail,
  normalizePhoneDigits,
  validateEmail,
  validatePhoneInput,
};
