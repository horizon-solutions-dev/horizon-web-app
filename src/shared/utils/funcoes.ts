  export const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d+)/, "$1.$2");
    if (numbers.length <= 8)
      return numbers.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
    if (numbers.length <= 12)
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
    return numbers.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/,
      "$1.$2.$3/$4-$5",
    );
  };

export const formatDoc = (doc?: string, type?: string | number) => {
  if (!doc) return "-";

  const numbers = doc.replace(/\D/g, "");

  // CPF
  if (type === 1 || type === "1") {
    if (!/^\d{11}$/.test(numbers)) return doc;

    return numbers.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );
  }

  // CNPJ
  if (type === 2 || type === "2") {
    if (!/^\d{14}$/.test(numbers)) return doc;

    return numbers.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  // CNH
  if (type === 3 || type === "3") {
    if (!/^\d{11}$/.test(numbers)) return doc;

    return numbers.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1 $2 $3 $4"
    );
  }

  // Passaporte
  if (type === 4 || type === "4") {
    const pass = doc.toUpperCase();

    if (!/^[A-Z]{1,2}\d{6,8}$/.test(pass)) return pass;

    return pass;
  }

  return doc;
};