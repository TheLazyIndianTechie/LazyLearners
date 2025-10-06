import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale = "en-US",
) {
  const { currency = "USD", ...formatOptions } = options;

  const mergedOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: formatOptions.minimumFractionDigits ?? 0,
    maximumFractionDigits: formatOptions.maximumFractionDigits ?? 2,
    ...formatOptions,
  };

  return new Intl.NumberFormat(locale, mergedOptions).format(value);
}
