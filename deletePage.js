const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');
const fs = require('fs');

const getPageRangesForDeletion = (startingPage, endingPage) => {
  // Specify pages for deletion.
  const pageRangesForDeletion = new PDFToolsSdk.PageRanges();
  if(startingPage === endingPage) pageRangesForDeletion.addSinglePage(startingPage);
  else pageRangesForDeletion.addPageRange(startingPage, endingPage);
  return pageRangesForDeletion;
};

module.exports = async function deletePage(baseFile, startingPage, endingPage){
try {
  // Initial setup, create credentials instance.
  const credentials = PDFToolsSdk.Credentials
      .serviceAccountCredentialsBuilder()
      .fromFile("pdftools-api-credentials.json")
      .build();

  // Create an ExecutionContext using credentials and create a new operation instance.
  const executionContext = PDFToolsSdk.ExecutionContext.create(credentials),
      deletePagesOperation = PDFToolsSdk.DeletePages.Operation.createNew();

  // Set operation input from a source file.
  const input = PDFToolsSdk.FileRef.createFromLocalFile(`output/${baseFile}.pdf`);
  deletePagesOperation.setInput(input);

  // Delete pages of the document (as specified by PageRanges).
  const pageRangesForDeletion = getPageRangesForDeletion(startingPage, endingPage);
  deletePagesOperation.setPageRanges(pageRangesForDeletion);

  // Execute the operation and Save the result to the specified location.
  let status = await deletePagesOperation.execute(executionContext)
      .then(async result => {
        if (fs.existsSync(`./output/${baseFile}.pdf`)){
            await fs.unlinkSync(`./output/${baseFile}.pdf`);
        }
        await result.saveAsFile(`output/${baseFile}.pdf`)
        return true
    })
   return (status ? true:false)
} catch (err) {
  return ({
    success: false
  })
}
}