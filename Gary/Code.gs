/**
 * AI News Aggregator - Google Apps Script Web App
 */

/**
 * Serves the main HTML page
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('AI News Aggregator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

