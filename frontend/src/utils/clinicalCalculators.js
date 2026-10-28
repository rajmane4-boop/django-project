/**
 * Smart MedTrack — Clinical Calculators & Utility Helpers
 */

export const FREQUENCY_MULTIPLIERS = {
  ONCE_DAILY: 1,
  TWICE_DAILY: 2,
  THRICE_DAILY: 3,
  AS_NEEDED: 0.5,
};

export function calculateDailyIntake(dosageUnits, frequency) {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency] || 1;
  return Number(dosageUnits) * multiplier;
}

export function estimateDaysOfSupply(currentStock, dailyBurnRate) {
  if (!dailyBurnRate || dailyBurnRate <= 0) return null;
  return Math.max(0, Math.floor(Number(currentStock) / Number(dailyBurnRate)));
}

export function classifyAdherenceBand(rate) {
  const val = Number(rate) || 0;
  if (val >= 85) {
    return { band: 'OPTIMAL', label: 'Optimal Adherence', color: 'emerald', description: 'Patient is maintaining therapeutic blood levels.' };
  }
  if (val >= 70) {
    return { band: 'MODERATE', label: 'Moderate Compliance', color: 'amber', description: 'Occasional missed doses detected; monitor routine.' };
  }
  return { band: 'CRITICAL', label: 'Sub-Optimal Compliance', color: 'rose', description: 'High risk of therapeutic failure; caregiver alerted.' };
}

export function formatDosageString(units, unitType = 'tablets', frequency = 'ONCE_DAILY') {
  const freqLabel = {
    ONCE_DAILY: 'once a day',
    TWICE_DAILY: 'twice a day',
    THRICE_DAILY: '3 times a day',
    AS_NEEDED: 'as needed',
  }[frequency] || frequency;

  return `${units} ${unitType} (${freqLabel})`;
}
