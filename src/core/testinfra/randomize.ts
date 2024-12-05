/* Helper methods related to randomizing the proof order */
export const fisherYates = (arr: any[]) => {
  // shuffle the array with Fisher-Yates algorithm
  const arrCopy = arr.slice();
  for (let i = arrCopy.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
  }
  // return the shuffled array
  return arrCopy;
};
