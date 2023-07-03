export function vectorSimilarity(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Vectors are not the same length')
  }

  let dotProduct = 0
  for (let i = 0; i < x.length; i++) {
    dotProduct += x[i] * y[i]
  }
  return dotProduct
}
