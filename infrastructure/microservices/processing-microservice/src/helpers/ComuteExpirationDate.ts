  export function computeExpirationDate(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d;
  };