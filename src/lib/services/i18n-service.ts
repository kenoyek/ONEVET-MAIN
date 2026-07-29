export type SupportedLanguage = 'en' | 'ha' | 'yo' | 'ig';
export type SupportedCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'KES' | 'GHS';

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  KES: 'KSh',
  GHS: 'GH₵',
};

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    emergency_sos: '24/7 SOS Emergency',
    digital_passport: 'Digital Medical Passport',
    book_appointment: 'Book Appointment',
    consultations: 'Veterinary Consultations',
    grooming: 'Grooming & Spa Services',
    pharmacy: 'Prescriptions & Pharmacy',
    diagnostics: 'Laboratory Diagnostics',
    livestock: 'Livestock & Farm Management',
    hmo_plans: 'Pet HMO Health Insurance',
  },
  ha: {
    emergency_sos: 'Agin Gaggawa na 24/7',
    digital_passport: 'Fasfo na Kiwon Lafiya',
    book_appointment: 'Yi Sabon Alwashi',
    consultations: 'Shawarwarin Likitan Dabbobi',
    grooming: 'Ayyukan Gyaran Dabbobi',
    pharmacy: 'Magunguna da Kayan Magani',
    diagnostics: 'Gwajin Dabbobi na Laboratory',
    livestock: 'Kiwon Kaji da Shanu',
    hmo_plans: 'Inshorar Kiwon Lafiyar Dabbobi',
  },
  yo: {
    emergency_sos: 'Pajawiri Pajawiri 24/7',
    digital_passport: 'Iwe Ase Inju Alafia',
    book_appointment: 'Iwe Ase Ifiweranise',
    consultations: 'Igbimọ Dokita Eranko',
    grooming: 'Awọn Iṣẹ Itọju Ẹranko',
    pharmacy: 'Agbegbe Oogun & Ile Oogun',
    diagnostics: 'Ayẹwo Ile-iṣẹ Giga',
    livestock: 'Itọju Ẹran Ọsìn ati Oko',
    hmo_plans: 'Inshoransi Alafia Ẹranko',
  },
  ig: {
    emergency_sos: 'Mberede Enyemaka 24/7',
    digital_passport: 'Akwụkwọ Passpọtụ Ahụike',
    book_appointment: 'Wepụ Oge Atụmatụ',
    consultations: 'Onye Dọkịta Anụmanụ',
    grooming: 'Nlekọta Anụmanụ Ụlọ',
    pharmacy: 'Ọgwụ na Ụlọ Ọgwụ',
    diagnostics: 'Nnyocha Lab anụmanụ',
    livestock: 'Nlekọta Anụ Ubi na Ọkụkọ',
    hmo_plans: 'Inshọransị Ahụike Anụmanụ',
  },
};

export const i18nService = {
  /**
   * Format monetary amount with local currency symbol
   */
  formatCurrency(amount: number, currency: SupportedCurrency = 'NGN'): string {
    const symbol = CURRENCY_SYMBOLS[currency] || '₦';
    const formatted = Math.max(0, amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
  },

  /**
   * Translate system string key to target language
   */
  translate(key: string, lang: SupportedLanguage = 'en'): string {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  },

  /**
   * Get supported currencies
   */
  getCurrencies(): SupportedCurrency[] {
    return ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'GHS'];
  },

  /**
   * Get supported languages
   */
  getLanguages(): Array<{ code: SupportedLanguage; label: string }> {
    return [
      { code: 'en', label: 'English' },
      { code: 'ha', label: 'Hausa' },
      { code: 'yo', label: 'Yorùbá' },
      { code: 'ig', label: 'Igbo' },
    ];
  },
};
