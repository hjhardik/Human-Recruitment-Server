const PDFToolsSdk = require('@adobe/documentservices-pdftools-node-sdk');
const fs = require("fs");

module.exports = async function (user, company, member, contractName, draftContent, pdfName) {
const setCustomOptions = (htmlToPDFOperation) => {
    // Define the page layout, in this case an 8 x 11.5 inch page (effectively portrait orientation).
    const pageLayout = new PDFToolsSdk.CreatePDF.options.PageLayout();
    pageLayout.setPageSize(8, 11.5);
    //Set the dataToMerge field that needs to be populated in the HTML before its conversion.
    const dataToMerge = {
        "title":contractName.toUpperCase(),
        "contract_content": draftContent,
        "company_title":company.toUpperCase(),
        "created": user,
        "candidate_name": member,
    };
    // Set the desired HTML-to-PDF conversion options.
    const htmlToPdfOptions = new PDFToolsSdk.CreatePDF.options.html.CreatePDFFromHtmlOptions.Builder()
        .includesHeaderFooter(true)
        .withPageLayout(pageLayout)
        .withDataToMerge(dataToMerge)
        .build();
    htmlToPDFOperation.setOptions(htmlToPdfOptions);
};


try {
    // Initial setup, create credentials instance.
    const credentials =  PDFToolsSdk.Credentials
        .serviceAccountCredentialsBuilder()
        .fromFile("pdftools-api-credentials.json")
        .build();

    // Create an ExecutionContext using credentials and create a new operation instance.
    const executionContext = PDFToolsSdk.ExecutionContext.create(credentials),
        htmlToPDFOperation = PDFToolsSdk.CreatePDF.Operation.createNew();

    // Set operation input from a source file.
    const input = PDFToolsSdk.FileRef.createFromLocalFile('resources/createPDFFromDynamicHtmlInput.zip');
    htmlToPDFOperation.setInput(input);

    // Provide any custom configuration options for the operation.
    setCustomOptions(htmlToPDFOperation);

    // Execute the operation and Save the result to the specified location.
    let result = await htmlToPDFOperation.execute(executionContext)
    if (result){
        if (fs.existsSync(`./output/${pdfName}.pdf`)){
            await fs.unlinkSync(`./output/${pdfName}.pdf`);
        }
        await result.saveAsFile(`output/${pdfName}.pdf`)
        return ({
                success: true,
        })
    }else{
        return ({
                success: false,
            })
    }        
} catch (err) {
    console.log(err)
    return ({
        success: false,
    })
}
}