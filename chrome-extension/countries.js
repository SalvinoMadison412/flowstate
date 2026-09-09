// Country calling codes for the dialer's country selector. All of Europe/EEA
// plus the markets Flow State works. Order: pinned favourites first, then A–Z.

const RAW = [
  ["France", "FR", "33"],
  ["United Kingdom", "GB", "44"],
  ["Germany", "DE", "49"],
  ["Australia", "AU", "61"],
  ["United Arab Emirates", "AE", "971"],
  ["United States", "US", "1"],
  ["India", "IN", "91"],
  // ── rest of Europe / EEA ──
  ["Albania", "AL", "355"],
  ["Andorra", "AD", "376"],
  ["Austria", "AT", "43"],
  ["Belgium", "BE", "32"],
  ["Bosnia and Herzegovina", "BA", "387"],
  ["Bulgaria", "BG", "359"],
  ["Croatia", "HR", "385"],
  ["Cyprus", "CY", "357"],
  ["Czechia", "CZ", "420"],
  ["Denmark", "DK", "45"],
  ["Estonia", "EE", "372"],
  ["Finland", "FI", "358"],
  ["Greece", "GR", "30"],
  ["Hungary", "HU", "36"],
  ["Iceland", "IS", "354"],
  ["Ireland", "IE", "353"],
  ["Italy", "IT", "39"],
  ["Kosovo", "XK", "383"],
  ["Latvia", "LV", "371"],
  ["Liechtenstein", "LI", "423"],
  ["Lithuania", "LT", "370"],
  ["Luxembourg", "LU", "352"],
  ["Malta", "MT", "356"],
  ["Moldova", "MD", "373"],
  ["Monaco", "MC", "377"],
  ["Montenegro", "ME", "382"],
  ["Netherlands", "NL", "31"],
  ["North Macedonia", "MK", "389"],
  ["Norway", "NO", "47"],
  ["Poland", "PL", "48"],
  ["Portugal", "PT", "351"],
  ["Romania", "RO", "40"],
  ["San Marino", "SM", "378"],
  ["Serbia", "RS", "381"],
  ["Slovakia", "SK", "421"],
  ["Slovenia", "SI", "386"],
  ["Spain", "ES", "34"],
  ["Sweden", "SE", "46"],
  ["Switzerland", "CH", "41"],
  ["Ukraine", "UA", "380"],
  ["Vatican City", "VA", "379"],
  // ── other common markets ──
  ["Canada", "CA", "1"],
  ["Brazil", "BR", "55"],
  ["Mexico", "MX", "52"],
  ["Singapore", "SG", "65"],
  ["Hong Kong", "HK", "852"],
  ["Japan", "JP", "81"],
  ["New Zealand", "NZ", "64"],
  ["South Africa", "ZA", "27"],
  ["Israel", "IL", "972"],
  ["Saudi Arabia", "SA", "966"],
  ["Turkey", "TR", "90"],
];

const flag = (iso) =>
  iso.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

export const COUNTRIES = RAW.map(([name, iso, dial]) => ({
  name,
  iso,
  dial,
  flag: flag(iso),
  label: `${flag(iso)} ${name} +${dial}`,
}));

export const DEFAULT_COUNTRY = COUNTRIES[0]; // France
