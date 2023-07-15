import pdfParse from 'pdf-parse'

export const getTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const result = await pdfParse(buffer)

  return result.text
}
