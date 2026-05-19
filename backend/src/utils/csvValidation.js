const VALIDATION_MESSAGES = {
  REQUIRED_CELL_ID: "Cell ID is required.",
  REQUIRED_MANUFACTURER: "Manufacturer is required.",
  REQUIRED_CHEMISTRY: "Chemistry is required.",
  REQUIRED_BATCH: "Batch number is required.",
  REQUIRED_DATE: "Received date is required.",

  INVALID_CHEMISTRY: "Chemistry must be one of: NMC, LFP, NCA,LMO,LCO,LTO.",
  INVALID_CAPACITY:
    "Capacity must be a valid number between 100 and 100000 mAh.",
  INVALID_VOLTAGE: "Voltage must be a valid number between 2V and 5V.",
  INVALID_DATE:
    "Received date must use YYYY-MM-DD, DD-MM-YYYY, or MM/DD/YYYY format.",
  AMBIGUOUS_DATE: "Received date is ambiguous. Please use YYYY-MM-DD format.",
  FUTURE_DATE: "Received date cannot be in the future.",

  DUPLICATE_CSV: "Duplicate Cell ID found in uploaded CSV.",
};

function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/\s+/g, "_");
}

function getValue(row, keys) {
  const normalizedRow = {};

  Object.keys(row).forEach((key) => {
    normalizedRow[normalizeKey(key)] = row[key];
  });

  for (const key of keys) {
    const normalizedKey = normalizeKey(key);

    if (
      normalizedRow[normalizedKey] !== undefined &&
      normalizedRow[normalizedKey] !== null &&
      String(normalizedRow[normalizedKey]).trim() !== ""
    ) {
      return String(normalizedRow[normalizedKey]).trim();
    }
  }

  return "";
}

function isValidRealDate(year, month, day) {
  const date = new Date(`${year}-${month}-${day}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)
  );
}

function normalizeDate(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return "";
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    const [year, month, day] = cleanValue.split("-");

    if (!isValidRealDate(year, month, day)) {
      return "";
    }

    return cleanValue;
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(cleanValue)) {
    const [day, month, year] = cleanValue.split("-");

    if (!isValidRealDate(year, month, day)) {
      return "";
    }

    return `${year}-${month}-${day}`;
  }

  // MM/DD/YYYY
  // Accept only when unambiguous, e.g. 03/15/2026.
  // Reject ambiguous cases like 01/10/2026 because they could be Jan 10 or Oct 1.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanValue)) {
    const [month, day, year] = cleanValue.split("/");

    if (Number(month) <= 12 && Number(day) <= 12) {
      return "AMBIGUOUS";
    }

    if (!isValidRealDate(year, month, day)) {
      return "";
    }

    return `${year}-${month}-${day}`;
  }

  return "";
}

function isFutureDate(value) {
  const inputDate = new Date(value + "T00:00:00");
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return inputDate > today;
}

function validateCsvRow(row, csvRowNumber, seenInFile) {
  const serialNumber = getValue(row, [
    "cell_id",
    "serial_number",
    "serial number",
    "cell id",
  ]);

  const manufacturer = getValue(row, ["manufacturer", "manufactu", "manufact"]);

  const chemistry = getValue(row, ["chemistry"]).toUpperCase();

  const capacityRaw = getValue(row, ["capacity_mah", "capacity", "capacity_r"]);

  const voltageRaw = getValue(row, [
    "voltage_nominal",
    "voltage",
    "voltage_no",
    "voltage_nc",
  ]);

  const batchNumber = getValue(row, [
    "batch_number",
    "batch_num",
    "batch_nun",
    "batch",
  ]);

  const receivedDateRaw = getValue(row, [
    "received_date",
    "received_d",
    "received",
  ]);

  const notes = getValue(row, ["notes"]);

  if (!serialNumber) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber: "-",
        error: VALIDATION_MESSAGES.REQUIRED_CELL_ID,
      },
    };
  }

  if (seenInFile.has(serialNumber)) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.DUPLICATE_CSV,
      },
    };
  }

  seenInFile.add(serialNumber);

  if (!manufacturer) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.REQUIRED_MANUFACTURER,
      },
    };
  }

  if (!chemistry) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.REQUIRED_CHEMISTRY,
      },
    };
  }

  if (!["NMC", "LFP", "NCA", "LMO", "LCO", "LTO"].includes(chemistry)) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.INVALID_CHEMISTRY,
      },
    };
  }

  const capacityMah = Number(capacityRaw);

  if (
    !capacityRaw ||
    Number.isNaN(capacityMah) ||
    capacityMah < 100 ||
    capacityMah > 100000
  ) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.INVALID_CAPACITY,
      },
    };
  }

  const voltageNominal = Number(voltageRaw);

  if (
    !voltageRaw ||
    Number.isNaN(voltageNominal) ||
    voltageNominal < 2 ||
    voltageNominal > 5
  ) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.INVALID_VOLTAGE,
      },
    };
  }

  if (!batchNumber) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.REQUIRED_BATCH,
      },
    };
  }

  if (!receivedDateRaw) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.REQUIRED_DATE,
      },
    };
  }

  const receivedDate = normalizeDate(receivedDateRaw);

  if (receivedDate === "AMBIGUOUS") {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.AMBIGUOUS_DATE,
      },
    };
  }

  if (!receivedDate) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.INVALID_DATE,
      },
    };
  }

  if (isFutureDate(receivedDate)) {
    return {
      valid: false,
      error: {
        row: csvRowNumber,
        serialNumber,
        error: VALIDATION_MESSAGES.FUTURE_DATE,
      },
    };
  }

  return {
    valid: true,
    data: {
      serialNumber,
      manufacturer,
      chemistry,
      capacityMah,
      voltageNominal,
      batchNumber,
      receivedDate,
      notes,
    },
  };
}

function validateManualCell(data) {
  const fakeSeen = new Set();

  return validateCsvRow(
    {
      cell_id: data.serialNumber,
      manufacturer: data.manufacturer,
      chemistry: data.chemistry,
      capacity_mah: data.capacityMah,
      voltage_nominal: data.voltageNominal,
      batch_number: data.batchNumber,
      received_date: data.receivedDate,
      notes: data.notes || "",
    },
    1,
    fakeSeen,
  );
}

module.exports = {
  validateCsvRow,
  validateManualCell,
  VALIDATION_MESSAGES,
};
