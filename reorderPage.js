const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');
const fs = require('fs');

const getPageRangeForReorder = (startingPage, endingPage) => {
  // Specify order of the pages for an output document.
  const pageRanges = new PDFToolsSdk.PageRanges();

  // Add pages 3 to 4.
  if(startingPage === endingPage) pageRanges.addSinglePage(startingPage);
  else pageRanges.addPageRange(startingPage, endingPage);

  return pageRanges;
};
module.exports = async function reorderPage(baseFile, startingPage, endingPage){
try {
  // Initial setup, create credentials instance.
  const credentials = PDFToolsSdk.Credentials
      .serviceAccountCredentialsBuilder()
      .fromFile("pdftools-api-credentials.json")
      .build();

  // Create an ExecutionContext using credentials and create a new operation instance.
  const executionContext = PDFToolsSdk.ExecutionContext.create(credentials),
      reorderPagesOperation = PDFToolsSdk.ReorderPages.Operation.createNew();

  // Set operation input from a source file, along with specifying the order of the pages for
  // rearranging the pages in a PDF file.
  const input = PDFToolsSdk.FileRef.createFromLocalFile(`output/${baseFile}.pdf`);
  const pageRanges = getPageRangeForReorder(startingPage, endingPage);
  reorderPagesOperation.setInput(input);
  reorderPagesOperation.setPagesOrder(pageRanges);

  // Execute the operation and Save the result to the specified location.
  let status = await reorderPagesOperation.execute(executionContext)
      .then(async (result) => {
        if (fs.existsSync(`./output/${baseFile}.pdf`)){
            await fs.unlinkSync(`./output/${baseFile}.pdf`);
        }
        result.saveAsFile(`output/${baseFile}.pdf`)
        return true
    })
   return (status ? true:false)
} catch (err) {
    return false
 }
}