# MHTML File Upload Feature

## Overview

The Catppuccin Theme Generator now supports uploading `.mhtml` (MIME HTML) files as an alternative to fetching websites directly. This feature allows you to analyze saved web pages offline and generate Catppuccin themes from them.

## What is MHTML?

MHTML (MIME HTML) is a web page archive format that saves a complete web page (HTML, CSS, images, and other resources) into a single file. It's commonly used by browsers like Chrome, Edge, and Internet Explorer to save web pages for offline viewing.

### Saving a Page as MHTML

**Chrome/Edge:**
1. Open the web page you want to save
2. Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)
3. In the "Save as type" dropdown, select "Webpage, Single File (*.mhtml)"
4. Choose a location and save the file

## Features

### MHTML Parser (`src/utils/mhtml-parser.ts`)

The MHTML parser can:
- ✅ Parse `.mhtml` and `.mht` file formats
- ✅ Extract HTML content from MHTML multipart structure
- ✅ Extract embedded CSS stylesheets
- ✅ Extract inline styles from HTML
- ✅ Decode quoted-printable and base64 encoded content
- ✅ Extract color values from CSS and HTML
- ✅ Return data in the same [`CrawlerResult`](src/types/theme.ts:11) format used by web crawlers

### File Upload Component (`src/components/FileUpload.tsx`)

The file upload component provides:
- ✅ Drag-and-drop file upload
- ✅ Click to browse file selection
- ✅ File validation (`.mhtml` and `.mht` extensions)
- ✅ File size limit (50MB maximum)
- ✅ Visual feedback during drag operations
- ✅ File preview with name and size
- ✅ Remove file option before processing

### Input Selector (`src/components/InputSelector.tsx`)

A tabbed interface that allows users to:
- ✅ Switch between URL input and file upload modes
- ✅ Maintain consistent UI with smooth transitions
- ✅ Disable switching during processing

## Usage

### Basic Workflow

1. **Select Upload Mode**
   - Click on the "Upload MHTML" tab in the "Generate Theme" section
   
2. **Upload File**
   - Drag and drop your `.mhtml` file onto the upload area, OR
   - Click the upload area to browse and select a file
   
3. **Validate File**
   - The system checks that the file has a valid extension (`.mhtml` or `.mht`)
   - The system checks that the file size is under 50MB
   
4. **Generate Theme**
   - Click "Generate Theme from MHTML"
   - The app parses the MHTML file
   - AI analyzes the extracted colors
   - Catppuccin theme is generated

### Example Use Cases

1. **Offline Analysis**
   - Save a website as MHTML when you have internet
   - Generate themes later without internet connection
   
2. **Internal Websites**
   - Save company intranet pages that aren't publicly accessible
   - Generate themes for internal tools
   
3. **Historical Versions**
   - Archive website designs over time
   - Generate themes from past versions of websites
   
4. **Testing**
   - Test theme generation without API rate limits
   - Consistent input for debugging

## Technical Implementation

### MHTML Format

MHTML files use the MIME multipart format with the following structure:

```
MIME-Version: 1.0
Content-Type: multipart/related; boundary="----boundary----"

------boundary----
Content-Type: text/html; charset="utf-8"
Content-Location: https://example.com/

<html>...</html>

------boundary----
Content-Type: text/css
Content-Location: https://example.com/style.css

body { color: #000; }

------boundary------
```

### Parsing Process

1. **Boundary Detection**: Extract the MIME boundary marker
2. **Part Separation**: Split content by boundary markers
3. **Content Extraction**: Parse headers and extract content from each part
4. **Decoding**: Handle quoted-printable and base64 encodings
5. **HTML Aggregation**: Combine HTML parts
6. **CSS Aggregation**: Combine external and inline CSS
7. **Color Extraction**: Extract all color values using regex patterns
8. **Result Formation**: Return [`CrawlerResult`](src/types/theme.ts:11) compatible with AI analysis

### Integration with Existing System

The MHTML parser returns data in the same [`CrawlerResult`](src/types/theme.ts:11) format as web crawlers:

```typescript
interface CrawlerResult {
  url: string;        // File path or original URL from MHTML
  title: string;      // Extracted from <title> tag
  content: string;    // Complete HTML content
  html?: string;      // HTML content (duplicate for compatibility)
  colors?: string[];  // Extracted color values
}
```

This ensures seamless integration with:
- [`analyzeWebsiteColors()`](src/services/ai/index.ts) - AI color analysis
- [`createUserStylePackage()`](src/services/generators/userstyle.ts) - Theme generation
- All existing theme generation logic

## Limitations

1. **File Size**: Maximum 50MB per file
2. **Format Support**: Only `.mhtml` and `.mht` files
3. **Color Detection**: Relies on CSS/HTML color extraction (may miss dynamically generated colors)
4. **Binary Resources**: Images and other binary resources are not processed
5. **JavaScript**: Dynamic JavaScript-generated styles are not captured

## Error Handling

The system handles various error scenarios:

- ❌ Invalid file format → "Please select a valid MHTML file"
- ❌ File too large → "File size must be less than 50MB"
- ❌ No boundary found → "Invalid MHTML file: No boundary found"
- ❌ No HTML content → "No HTML content found in MHTML file"
- ❌ File read error → "Failed to read file"

## Future Enhancements

Potential improvements for the MHTML feature:

- [ ] Support for `.maff` (Mozilla Archive Format)
- [ ] Support for `.webarchive` (Safari Web Archive)
- [ ] Batch processing of multiple MHTML files
- [ ] Better handling of relative URLs in MHTML
- [ ] Preview of extracted HTML before theme generation
- [ ] Support for password-protected MHTML files
- [ ] Extraction of JavaScript-defined color variables

## Files Modified/Created

### New Files
- [`src/utils/mhtml-parser.ts`](src/utils/mhtml-parser.ts) - MHTML parsing logic
- [`src/components/FileUpload.tsx`](src/components/FileUpload.tsx) - File upload UI component
- [`src/components/InputSelector.tsx`](src/components/InputSelector.tsx) - Tab switcher component

### Modified Files
- [`src/App.tsx`](src/App.tsx) - Integrated MHTML upload functionality
  - Added [`handleFileUpload()`](src/App.tsx:55) handler
  - Added [`processContent()`](src/App.tsx:70) shared processing function
  - Updated UI to use [`InputSelector`](src/components/InputSelector.tsx:11) component

## API Reference

### MHTMLParser Class

#### `parseFile(file: File): Promise<CrawlerResult>`
Parses an MHTML file and returns a [`CrawlerResult`](src/types/theme.ts:11).

**Parameters:**
- `file`: File object from file input

**Returns:**
- Promise resolving to [`CrawlerResult`](src/types/theme.ts:11)

**Throws:**
- Error if file is invalid or parsing fails

#### `isValidMHTMLFile(file: File): boolean`
Validates if a file has a valid MHTML extension.

**Parameters:**
- `file`: File object to validate

**Returns:**
- `true` if file has `.mhtml` or `.mht` extension

## Testing

To test the MHTML upload feature:

1. **Save a Test Page**
   ```
   1. Open any website in Chrome/Edge
   2. Press Ctrl+S
   3. Save as MHTML format
   ```

2. **Upload and Test**
   ```
   1. Run the app: npm run dev
   2. Configure AI API key
   3. Switch to "Upload MHTML" tab
   4. Upload the saved MHTML file
   5. Generate theme
   ```

3. **Verify Output**
   ```
   - Check that colors are extracted correctly
   - Verify theme generation completes
   - Download and test generated theme files
   ```

## Troubleshooting

**Problem**: "Invalid MHTML file: No boundary found"  
**Solution**: Ensure the file was saved properly as MHTML format. Some browsers may save incorrectly.

**Problem**: "No HTML content found in MHTML file"  
**Solution**: The MHTML file may be corrupted or use an unsupported format. Try re-saving the page.

**Problem**: Colors not extracted correctly  
**Solution**: The page may use JavaScript to generate colors dynamically. Try using the URL input method instead.

**Problem**: File upload fails silently  
**Solution**: Check browser console for errors. Ensure file size is under 50MB.

---

For more information about the overall project, see the main [README.md](README.md).