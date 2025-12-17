/**
 * Formats doctor name with appropriate prefix
 * - Removes any existing "Dr." or "Prof. Dr." prefix
 * - Adds "Prof. Dr." if doctor is a professor (checks qualification)
 * - Otherwise adds "Dr." prefix
 */
export function formatDoctorName(name: string, qualification?: string): string {
  if (!name) return '';

  // Remove any existing prefixes (case-insensitive)
  let cleanName = name
    .replace(/^(prof\.?\s*)?dr\.?\s*/i, '')
    .replace(/^dr\.?\s*/i, '')
    .trim();

  // Check if doctor is a professor (check qualification for "professor" or "prof")
  const isProfessor = qualification && (
    qualification.toLowerCase().includes('professor') ||
    qualification.toLowerCase().includes('prof.') ||
    qualification.toLowerCase().includes('prof ')
  );

  // Add appropriate prefix
  if (isProfessor) {
    return `Prof. Dr. ${cleanName}`;
  } else {
    return `Dr. ${cleanName}`;
  }
}

/**
 * Formats doctor name in Bengali with appropriate prefix
 * - Removes any existing "ডাঃ" or "প্রফেসর ডাঃ" prefix
 * - Adds "প্রফেসর ডাঃ" if doctor is a professor (checks qualification)
 * - Otherwise adds "ডাঃ" prefix
 */
export function formatDoctorNameBengali(name: string, qualification?: string): string {
  if (!name) return '';

  // Remove any existing prefixes (case-insensitive)
  let cleanName = name
    .replace(/^(প্রফেসর\s*)?ডাঃ\s*/i, '')
    .replace(/^ডাঃ\s*/i, '')
    .replace(/^(prof\.?\s*)?dr\.?\s*/i, '')
    .replace(/^dr\.?\s*/i, '')
    .trim();

  // Check if doctor is a professor (check qualification for "professor" or "prof")
  const isProfessor = qualification && (
    qualification.toLowerCase().includes('professor') ||
    qualification.toLowerCase().includes('prof.') ||
    qualification.toLowerCase().includes('prof ') ||
    qualification.toLowerCase().includes('প্রফেসর')
  );

  // Add appropriate prefix
  if (isProfessor) {
    return `প্রফেসর ডাঃ ${cleanName}`;
  } else {
    return `ডাঃ ${cleanName}`;
  }
}

