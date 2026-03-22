export type FormErrors = Partial<Record<string, string>>;

export type FormActionResult = {
  error?: string;
  success?: string;
  redirectTo?: string;
  fieldErrors?: FormErrors;
};
