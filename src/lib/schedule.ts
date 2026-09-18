export function utcHourStart(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0),
  );
}

export function shouldEnqueueHourlyJob(alreadyCreatedThisHour: boolean) {
  return !alreadyCreatedThisHour;
}
