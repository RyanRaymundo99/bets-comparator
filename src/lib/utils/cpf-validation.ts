/**
 * CPF (Brazilian Tax ID) validation utility
 * Implements the official Brazilian CPF validation algorithm
 */

export class CPFValidator {
  /**
   * Validates if a CPF is valid using the official Brazilian algorithm
   * @param cpf - CPF string (can contain dots and dashes)
   * @returns true if valid, false otherwise
   */
  static isValid(cpf: string): boolean {
    // Remove all non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, "");

    // Check if it has 11 digits
    if (cleanCPF.length !== 11) {
      return false;
    }

    // Check if all digits are the same (invalid CPF)
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    // Check if calculated digits match the CPF
    return (
      parseInt(cleanCPF.charAt(9)) === digit1 &&
      parseInt(cleanCPF.charAt(10)) === digit2
    );
  }

  /**
   * Formats CPF with dots and dash (XXX.XXX.XXX-XX)
   * @param cpf - CPF string
   * @returns formatted CPF
   */
  static format(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, "");
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  /**
   * Removes formatting from CPF (dots and dash)
   * @param cpf - CPF string
   * @returns clean CPF (only numbers)
   */
  static clean(cpf: string): string {
    return cpf.replace(/\D/g, "");
  }

  /**
   * Generates a random valid CPF (for testing purposes only)
   * @returns a valid CPF string
   */
  static generate(): string {
    const digits = [];

    // Generate first 9 random digits
    for (let i = 0; i < 9; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }

    // Calculate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    let remainder = sum % 11;
    digits.push(remainder < 2 ? 0 : 11 - remainder);

    // Calculate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * (11 - i);
    }
    remainder = sum % 11;
    digits.push(remainder < 2 ? 0 : 11 - remainder);

    return digits.join("");
  }

  /**
   * Validates CPF and returns detailed result
   * @param cpf - CPF string
   * @returns validation result object
   */
  static validate(cpf: string): {
    isValid: boolean;
    cleanCPF: string;
    formattedCPF: string;
    errors: string[];
  } {
    const errors: string[] = [];
    const cleanCPF = this.clean(cpf);

    // Check length
    if (cleanCPF.length !== 11) {
      errors.push("CPF deve ter 11 dígitos");
    }

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      errors.push("CPF não pode ter todos os dígitos iguais");
    }

    // Check if it's a valid CPF
    if (!this.isValid(cleanCPF)) {
      errors.push("CPF inválido");
    }

    return {
      isValid: errors.length === 0,
      cleanCPF,
      formattedCPF: this.format(cleanCPF),
      errors,
    };
  }
}

/**
 * CPF input mask utility for real-time formatting
 */
export class CPFMask {
  /**
   * Applies CPF mask to input value
   * @param value - Input value
   * @returns masked value
   */
  static apply(value: string): string {
    const cleanValue = value.replace(/\D/g, "");

    if (cleanValue.length <= 3) {
      return cleanValue;
    } else if (cleanValue.length <= 6) {
      return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
    } else if (cleanValue.length <= 9) {
      return `${cleanValue.slice(0, 3)}.${cleanValue.slice(
        3,
        6
      )}.${cleanValue.slice(6)}`;
    } else {
      return `${cleanValue.slice(0, 3)}.${cleanValue.slice(
        3,
        6
      )}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
    }
  }

  /**
   * Removes mask from CPF value
   * @param value - Masked value
   * @returns clean value
   */
  static remove(value: string): string {
    return value.replace(/\D/g, "");
  }
}
