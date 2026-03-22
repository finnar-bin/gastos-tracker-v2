const MAX_DECIMAL_AMOUNT = 99_999_999.99;

export function parseAndValidateAmount(rawAmount: FormDataEntryValue | null) {
  const amountValue = typeof rawAmount === "string" ? rawAmount.trim() : "";
  const amount = Number.parseFloat(amountValue);

  if (!Number.isFinite(amount)) {
    throw new Error("Amount must be a valid number.");
  }

  if (amount <= 0) {
    throw new Error("Amount must be greater than 0.");
  }

  if (Math.abs(amount) > MAX_DECIMAL_AMOUNT) {
    throw new Error("Amount must be 99,999,999.99 or less.");
  }

  return amount;
}

export function parseOptionalAmount(
  rawAmount: FormDataEntryValue | null,
  fieldLabel = "Amount",
) {
  const amountValue = typeof rawAmount === "string" ? rawAmount.trim() : "";

  if (!amountValue) {
    return null;
  }

  try {
    return parseAndValidateAmount(amountValue);
  } catch (error) {
    const message =
      error instanceof Error ? error.message.replace(/^Amount/, fieldLabel) : `${fieldLabel} is invalid.`;
    throw new Error(message);
  }
}

export { MAX_DECIMAL_AMOUNT };
