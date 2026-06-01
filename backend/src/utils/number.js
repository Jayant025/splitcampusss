const roundCurrency = (value) => {
  const numericValue = Number(value || 0);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.round((numericValue + Number.EPSILON) * 100) / 100;
};

module.exports = {
  roundCurrency
};
