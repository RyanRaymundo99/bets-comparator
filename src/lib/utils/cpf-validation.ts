/**
 * CPF (Cadastro de Pessoa Física) validation utility
 * CPF is a Brazilian tax identification number
 */

export class CPFValidator {
  /**
   * Removes formatting characters from CPF string
   */
  static clean(cpf: string): string {
    return cpf.replace(/[^\d]/g, "");
  }

  /**
   * Validates CPF format and check digits
   */
  static isValid(cpf: string): boolean {
    const cleaned = this.clean(cpf);

    // Must have 11 digits
    if (cleaned.length !== 11) {
      return false;
    }

    // Check if all digits are the same (invalid CPF)
    if (/^(\d)\1{10}$/.test(cleaned)) {
      return false;
    }

    // Validate check digits
    let sum = 0;
    let remainder: number;

    // Validate first check digit
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) {
      return false;
    }

    // Validate second check digit
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) {
      return false;
    }

    return true;
  }

  /**
   * Formats CPF string with standard formatting (XXX.XXX.XXX-XX)
   */
  static format(cpf: string): string {
    const cleaned = this.clean(cpf);
    if (cleaned.length !== 11) {
      return cpf; // Return original if invalid length
    }
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
}


