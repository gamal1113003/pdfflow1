/**
 * Single source of truth for every tool in orzix.
 * Routes, navigation, the tool grid, search, sitemap and SEO metadata are all
 * generated from this registry — add a tool here and it appears everywhere.
 */

export type ToolCategory =
  | "convert-from-pdf"
  | "convert-to-pdf"
  | "compress"
  | "organize"
  | "edit"
  | "security"
  | "image";

/** Which client widget renders the working area of the tool page. */
export type ToolWidget =
  | "compress"
  | "merge"
  | "split"
  | "organize"
  | "images-to-pdf"
  | "pdf-to-images"
  | "watermark"
  | "sign"
  | "crop"
  | "edit-content"
  | "translate"
  | "ocr-local"
  | "compare"
  | "redact"
  | "invoice"
  | "application"
  | "qr"
  | "page-numbers"
  | "pdf-to-text"
  | "extract-images"
  | "pages-per-sheet"
  | "metadata"
  | "image-optimise"
  | "fill-form"
  | "scan"
  | "backend";

export type Tool = {
  slug: string;
  name: string;
  /** One line, used on cards and under the tool page H1. */
  description: string;
  /** Longer sentence for the tool page subheading. */
  lede: string;
  categories: ToolCategory[];
  icon: string;
  widget: ToolWidget;
  /** true when the whole job happens in the visitor's browser. */
  runsInBrowser: boolean;
  popular?: boolean;
  /** Extra options passed to the shared widgets. */
  config?: Record<string, unknown>;
  seo: { title: string; description: string };
};

export const TOOL_CATEGORIES: { id: ToolCategory | "all"; label: string }[] = [
  { id: "all", label: "All tools" },
  { id: "convert-from-pdf", label: "Convert PDF" },
  { id: "convert-to-pdf", label: "Convert to PDF" },
  { id: "compress", label: "Compress" },
  { id: "organize", label: "Organize" },
  { id: "edit", label: "Edit" },
  { id: "security", label: "Security" },
  { id: "image", label: "Image tools" },
];

export const tools: Tool[] = [
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality.",
    lede: "Reduce your PDF file size without compromising quality.",
    categories: ["compress"],
    icon: "Minimize2",
    widget: "compress",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Compress PDF Online — Reduce PDF Size | orzix",
      description:
        "Compress PDF files online quickly and easily. Reduce file size while maintaining excellent document quality with orzix.",
    },
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    lede: "Combine several PDFs into a single document, in the order you choose.",
    categories: ["organize"],
    icon: "Combine",
    widget: "merge",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Merge PDF Online — Combine PDF Files | orzix",
      description:
        "Merge two or more PDFs into one document. Reorder files by dragging, then download the combined PDF. Free and private in your browser.",
    },
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    description: "Separate pages or ranges into individual PDFs.",
    lede: "Pull pages out of a PDF, or break one document into many.",
    categories: ["organize"],
    icon: "Scissors",
    widget: "split",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Split PDF Online — Separate PDF Pages | orzix",
      description:
        "Split a PDF by selecting pages, entering page ranges, or separating every page into its own file. Runs in your browser with orzix.",
    },
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    description: "Convert PDF documents into editable Word files.",
    lede: "Turn a PDF into an editable .docx document.",
    categories: ["convert-from-pdf"],
    icon: "FileType2",
    widget: "backend",
    runsInBrowser: false,
    popular: true,
    config: { accept: ["pdf"], outputLabel: "Word document (.docx)" },
    seo: {
      title: "PDF to Word Converter — PDF to DOCX | orzix",
      description:
        "Convert PDF files into editable Word documents while keeping layout, headings and tables intact with orzix.",
    },
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    description: "Extract tables and data into Excel spreadsheets.",
    lede: "Pull tables out of a PDF and into a spreadsheet.",
    categories: ["convert-from-pdf"],
    icon: "Table2",
    widget: "backend",
    runsInBrowser: false,
    config: { accept: ["pdf"], outputLabel: "Excel workbook (.xlsx)" },
    seo: {
      title: "PDF to Excel Converter — Extract Tables to XLSX | orzix",
      description:
        "Convert PDF tables into Excel spreadsheets you can sort, filter and edit. Accurate table detection with orzix.",
    },
  },
  {
    slug: "pdf-to-ppt",
    name: "PDF to PowerPoint",
    description: "Turn PDF pages into editable slides.",
    lede: "Convert a PDF back into an editable slide deck.",
    categories: ["convert-from-pdf"],
    icon: "Presentation",
    widget: "backend",
    runsInBrowser: false,
    config: { accept: ["pdf"], outputLabel: "PowerPoint deck (.pptx)" },
    seo: {
      title: "PDF to PowerPoint Converter — PDF to PPTX | orzix",
      description:
        "Convert PDF documents into editable PowerPoint presentations, one slide per page, with orzix.",
    },
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    description: "Convert Word documents into polished PDFs.",
    lede: "Turn a .docx file into a PDF that looks the same everywhere.",
    categories: ["convert-to-pdf"],
    icon: "FileText",
    widget: "backend",
    runsInBrowser: false,
    config: { accept: ["docx", "doc"], outputLabel: "PDF document" },
    seo: {
      title: "Word to PDF Converter — DOCX to PDF | orzix",
      description:
        "Convert Word documents to PDF with fonts, spacing and page breaks preserved exactly as you wrote them.",
    },
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    description: "Turn spreadsheets into shareable PDFs.",
    lede: "Convert a workbook into a clean, printable PDF.",
    categories: ["convert-to-pdf"],
    icon: "Sheet",
    widget: "backend",
    runsInBrowser: false,
    config: { accept: ["xlsx", "xls", "csv"], outputLabel: "PDF document" },
    seo: {
      title: "Excel to PDF Converter — XLSX to PDF | orzix",
      description:
        "Convert Excel spreadsheets into PDFs with tidy page breaks and readable column widths, using orzix.",
    },
  },
  {
    slug: "ppt-to-pdf",
    name: "PowerPoint to PDF",
    description: "Convert slide decks into PDF documents.",
    lede: "Share a deck as a PDF that opens on any device.",
    categories: ["convert-to-pdf"],
    icon: "MonitorPlay",
    widget: "backend",
    runsInBrowser: false,
    config: { accept: ["pptx", "ppt"], outputLabel: "PDF document" },
    seo: {
      title: "PowerPoint to PDF Converter — PPTX to PDF | orzix",
      description:
        "Convert PowerPoint presentations into PDF documents with slide layouts and fonts preserved.",
    },
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Create a PDF from JPG images.",
    lede: "Combine photos and scans into a single PDF.",
    categories: ["convert-to-pdf", "image"],
    icon: "ImagePlus",
    widget: "images-to-pdf",
    runsInBrowser: true,
    popular: true,
    config: { accept: ["jpg", "jpeg"] },
    seo: {
      title: "JPG to PDF Converter — Images to PDF | orzix",
      description:
        "Turn JPG photos and scans into one PDF. Reorder pages, choose page size and download instantly with orzix.",
    },
  },
  {
    slug: "png-to-pdf",
    name: "PNG to PDF",
    description: "Build a PDF from PNG images.",
    lede: "Combine PNG screenshots and graphics into one PDF.",
    categories: ["convert-to-pdf", "image"],
    icon: "Image",
    widget: "images-to-pdf",
    runsInBrowser: true,
    config: { accept: ["png"] },
    seo: {
      title: "PNG to PDF Converter — Images to PDF | orzix",
      description:
        "Convert PNG images into a single PDF document. Transparency is flattened onto a white page by orzix.",
    },
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Convert PDF pages into high-quality images.",
    lede: "Save every page of a PDF as a separate image.",
    categories: ["convert-from-pdf", "image"],
    icon: "Images",
    widget: "pdf-to-images",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "PDF to JPG Converter — Export PDF Pages as Images | orzix",
      description:
        "Convert PDF pages into high-resolution JPG images. Pick the quality, preview pages and download them as a ZIP.",
    },
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    description: "Rotate individual pages or the entire document.",
    lede: "Straighten sideways scans, one page or all of them.",
    categories: ["organize"],
    icon: "RotateCw",
    widget: "organize",
    runsInBrowser: true,
    popular: true,
    config: { mode: "rotate" },
    seo: {
      title: "Rotate PDF Online — Fix Page Orientation | orzix",
      description:
        "Rotate PDF pages 90, 180 or 270 degrees and save the result permanently. Preview every page before you download.",
    },
  },
  {
    slug: "delete-pages",
    name: "Delete Pages",
    description: "Remove unwanted pages from a PDF.",
    lede: "Select the pages you don't need and remove them.",
    categories: ["organize"],
    icon: "Trash2",
    widget: "organize",
    runsInBrowser: true,
    config: { mode: "delete" },
    seo: {
      title: "Delete PDF Pages Online — Remove Pages | orzix",
      description:
        "Remove pages from a PDF by clicking the thumbnails you want gone, then download the trimmed document.",
    },
  },
  {
    slug: "extract-pages",
    name: "Extract Pages",
    description: "Save selected pages as a new PDF.",
    lede: "Keep only the pages you select and save them as a new file.",
    categories: ["organize"],
    icon: "FileOutput",
    widget: "organize",
    runsInBrowser: true,
    config: { mode: "extract" },
    seo: {
      title: "Extract PDF Pages Online — Save Selected Pages | orzix",
      description:
        "Extract specific pages from a PDF into a new document. Select visually or enter page ranges with orzix.",
    },
  },
  {
    slug: "reorder-pages",
    name: "Reorder Pages",
    description: "Drag and rearrange PDF pages.",
    lede: "Put your pages in the right order by dragging them.",
    categories: ["organize"],
    icon: "ArrowLeftRight",
    widget: "organize",
    runsInBrowser: true,
    config: { mode: "reorder" },
    seo: {
      title: "Reorder PDF Pages Online — Rearrange a PDF | orzix",
      description:
        "Rearrange the pages of a PDF by dragging thumbnails, or move pages with the keyboard, then download the result.",
    },
  },
  {
    slug: "edit-pdf",
    name: "Edit PDF",
    description: "Reorder, rotate, duplicate and delete in one place.",
    lede: "A visual page editor: rotate, reorder, duplicate and delete without leaving the page.",
    categories: ["edit", "organize"],
    icon: "PencilRuler",
    widget: "organize",
    runsInBrowser: true,
    popular: true,
    config: { mode: "edit" },
    seo: {
      title: "Edit PDF Online — Visual PDF Page Editor | orzix",
      description:
        "Edit a PDF in your browser: rotate, reorder, duplicate and delete pages from a visual grid, then save the new file.",
    },
  },
  {
    slug: "annotate-pdf",
    name: "Edit & Annotate",
    description: "Add text, drawings, highlights and images to a page.",
    lede: "Write on the page: add text, draw, highlight, black things out and drop in images.",
    categories: ["edit"],
    icon: "PenLine",
    widget: "edit-content",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Edit & Annotate PDF Online — Add Text and Drawings | orzix",
      description:
        "Annotate a PDF in your browser: add text in any language, draw, highlight, add shapes or images, and black out what should not be seen.",
    },
  },
  {
    slug: "crop-pdf",
    name: "Crop PDF",
    description: "Trim margins and keep only the part you need.",
    lede: "Drag a box over the page and keep only what is inside it.",
    categories: ["edit", "organize"],
    icon: "Crop",
    widget: "crop",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Crop PDF Online — Trim Page Margins | orzix",
      description:
        "Crop a PDF in your browser. Drag a box over the page, apply it to one page or all of them, and download the trimmed document.",
    },
  },
  {
    slug: "flatten-pdf",
    name: "Flatten PDF",
    description: "Remove form fields and annotations, keeping the look.",
    lede: "Turn filled forms and comments into fixed page content that cannot be edited.",
    categories: ["edit", "security"],
    icon: "Layers",
    widget: "backend",
    runsInBrowser: false,
    config: { accept: ["pdf"], outputLabel: "Flattened PDF" },
    seo: {
      title: "Flatten PDF Online — Lock Form Fields | orzix",
      description:
        "Flatten a PDF so form fields and annotations become fixed page content that cannot be edited or removed.",
    },
  },
  {
    slug: "scan-to-pdf",
    name: "Scan with Camera",
    description: "Photograph a document and get a clean, straight PDF.",
    lede: "Take a picture of a page and have it come out square and legible.",
    categories: ["convert-to-pdf", "image"],
    icon: "Camera",
    widget: "scan",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Scan to PDF with Your Camera — Free, in the Browser | orzix",
      description:
        "Photograph a document and get a straightened, cleaned-up PDF. Corrects the angle and the lighting. Nothing is uploaded — it all happens on your device.",
    },
  },
  {
    slug: "fill-form",
    name: "Fill a Form",
    description: "Type into a PDF form and save it.",
    lede: "Fill in the fields of a PDF form, and lock them if you want.",
    categories: ["edit"],
    icon: "PenLine",
    widget: "fill-form",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Fill PDF Forms Online — Free, No Sign-up | orzix",
      description:
        "Type into a PDF form's own fields and save it, keeping the values editable or locking them in. Runs entirely in your browser.",
    },
  },
  {
    slug: "page-numbers",
    name: "Add Page Numbers",
    description: "Number the pages of a document.",
    lede: "Put page numbers where you want them, in any style.",
    categories: ["edit"],
    icon: "Hash",
    widget: "page-numbers",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Add Page Numbers to PDF Online — Free | orzix",
      description:
        "Add page numbers to a PDF in any position and style. Skip a cover page or continue numbering from another document. Runs in your browser.",
    },
  },
  {
    slug: "pdf-to-text",
    name: "PDF to Text",
    description: "Pull the plain text out of a document.",
    lede: "Get the words out of a PDF, as a plain text file.",
    categories: ["convert-from-pdf"],
    icon: "FileText",
    widget: "pdf-to-text",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "PDF to Text Online — Extract Text from PDF | orzix",
      description:
        "Extract the text from a PDF and download it as a .txt file, or copy it straight to the clipboard. Runs entirely in your browser.",
    },
  },
  {
    slug: "extract-images",
    name: "Extract Images",
    description: "Save the pictures stored inside a PDF.",
    lede: "Pull out the images a document contains, at their original resolution.",
    categories: ["convert-from-pdf", "image"],
    icon: "Images",
    widget: "extract-images",
    runsInBrowser: true,
    seo: {
      title: "Extract Images from PDF Online — Free | orzix",
      description:
        "Save the images embedded in a PDF at their original resolution, rather than pictures of the pages. Runs in your browser.",
    },
  },
  {
    slug: "pages-per-sheet",
    name: "Pages per Sheet",
    description: "Fit several pages onto one sheet for printing.",
    lede: "Print two, four or more pages on a single sheet.",
    categories: ["organize"],
    icon: "LayoutGrid",
    widget: "pages-per-sheet",
    runsInBrowser: true,
    seo: {
      title: "Pages per Sheet — Print Multiple PDF Pages on One Page | orzix",
      description:
        "Lay out two, four, six or nine PDF pages on a single sheet to save paper. Runs entirely in your browser.",
    },
  },
  {
    slug: "pdf-metadata",
    name: "PDF Details",
    description: "See and change what a document says about itself.",
    lede: "Read the hidden details in a PDF, edit them, or remove them.",
    categories: ["edit", "security"],
    icon: "Tags",
    widget: "metadata",
    runsInBrowser: true,
    seo: {
      title: "Edit or Remove PDF Metadata Online — Free | orzix",
      description:
        "See the author, title and software recorded inside a PDF, change them, or clear them entirely. Runs in your browser.",
    },
  },
  {
    slug: "compress-image",
    name: "Compress Images",
    description: "Make photos and screenshots smaller.",
    lede: "Shrink images for email, messages or a web page.",
    categories: ["image", "compress"],
    icon: "ImageDown",
    widget: "image-optimise",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Compress Images Online — Smaller JPG, PNG and WEBP | orzix",
      description:
        "Make images smaller for email or the web. Resize, choose the quality, convert between JPG, PNG and WEBP. Runs entirely in your browser.",
    },
  },
  {
    slug: "qr-code",
    name: "QR Code",
    description: "Create a QR code for a link, text, Wi-Fi or contact details.",
    lede: "Make a QR code and download it as an image or a printable PDF.",
    categories: ["image", "edit"],
    icon: "QrCode",
    widget: "qr",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "QR Code Generator — Free, No Sign-up | orzix",
      description:
        "Create a QR code for a website, text, email, phone number or Wi-Fi network. Download as PNG, SVG or a printable PDF. Runs in your browser.",
    },
  },
  {
    slug: "create-invoice",
    name: "Create Invoice",
    description: "Build an invoice and download it as a PDF.",
    lede: "Fill in the details and get a clean, printable invoice.",
    categories: ["edit"],
    icon: "ReceiptText",
    widget: "invoice",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Free Invoice Generator — Create an Invoice PDF | orzix",
      description:
        "Create an invoice online and download it as a PDF. Add your logo, line items, discounts and tax, in any currency. Runs in your browser.",
    },
  },
  {
    slug: "job-application",
    name: "Job Application",
    description: "Combine a covering letter and your documents into one PDF.",
    lede: "Write the letter, attach your CV and certificates, and get one file to send.",
    categories: ["edit", "organize"],
    icon: "Briefcase",
    widget: "application",
    runsInBrowser: true,
    seo: {
      title: "Create a Job Application PDF — Letter and CV in One File | orzix",
      description:
        "Write a covering letter and attach your CV and certificates as a single PDF, ready to send. Runs entirely in your browser.",
    },
  },
  {
    slug: "blacken-pdf",
    name: "Blacken PDF",
    description: "Permanently remove private parts of a document.",
    lede: "Black out anything private — and have it genuinely removed, not just covered.",
    categories: ["edit", "security"],
    icon: "SquareSlash",
    widget: "redact",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Blacken PDF Online — Redact and Remove Text for Good | orzix",
      description:
        "Black out private information in a PDF and have it permanently removed rather than hidden. Runs in your browser; the file is never uploaded.",
    },
  },
  {
    slug: "compare-pdf",
    name: "Compare PDFs",
    description: "Find what changed between two versions of a document.",
    lede: "Put two versions side by side and see exactly what changed.",
    categories: ["edit", "organize"],
    icon: "Columns2",
    widget: "compare",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Compare PDF Files Online — Find the Differences | orzix",
      description:
        "Compare two PDFs and see what changed. Visual comparison marks every difference on the page; word comparison shows exactly which text was added or removed.",
    },
  },
  {
    slug: "watermark-pdf",
    name: "Watermark PDF",
    description: "Add custom text or image watermarks.",
    lede: "Stamp every page with text such as Draft or Confidential.",
    categories: ["edit"],
    icon: "Droplets",
    widget: "watermark",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Add a Watermark to PDF — Free Watermark Tool | orzix",
      description:
        "Add a text watermark to every page of a PDF. Control the wording, size, angle, colour and opacity, then download.",
    },
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    description: "Add an electronic signature to your PDF.",
    lede: "Draw or type a signature and place it anywhere on the page.",
    categories: ["edit", "security"],
    icon: "Signature",
    widget: "sign",
    runsInBrowser: true,
    popular: true,
    seo: {
      title: "Sign PDF Online — Add an Electronic Signature | orzix",
      description:
        "Draw, type or upload a signature, drag it into place on any page, and download the signed PDF. Nothing leaves your browser.",
    },
  },
  {
    slug: "protect-pdf",
    name: "Protect PDF",
    description: "Secure your PDF with a password.",
    lede: "Add a password so only the right people can open your document.",
    categories: ["security"],
    icon: "Lock",
    widget: "backend",
    runsInBrowser: false,
    popular: true,
    config: { accept: ["pdf"], fields: "set-password", outputLabel: "Password-protected PDF" },
    seo: {
      title: "Password Protect PDF — Encrypt a PDF | orzix",
      description:
        "Add password protection to a PDF so it can only be opened by people you share the password with.",
    },
  },
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    description: "Remove password protection when authorized.",
    lede: "Remove a password from a document you are allowed to modify.",
    categories: ["security"],
    icon: "LockOpen",
    widget: "backend",
    runsInBrowser: false,
    config: { accept: ["pdf"], fields: "enter-password", outputLabel: "Unlocked PDF" },
    seo: {
      title: "Unlock PDF — Remove a PDF Password | orzix",
      description:
        "Remove password protection from PDFs you are authorised to modify, and download an unrestricted copy.",
    },
  },
  {
    slug: "translate-pdf",
    name: "Translate PDF",
    description: "Translate the text of a document into another language.",
    lede: "Read your document in another language. The text is translated; the layout is not copied.",
    categories: ["convert-from-pdf", "edit"],
    icon: "Languages",
    widget: "translate",
    runsInBrowser: false,
    popular: true,
    seo: {
      title: "Translate PDF Online — Into English, Russian and More | orzix",
      description:
        "Translate the text of a PDF into another language and download a readable translated document.",
    },
  },
  {
    slug: "ocr-pdf",
    name: "OCR PDF",
    description: "Make scanned documents searchable.",
    lede: "Recognise the text in a scan so you can search and copy it.",
    categories: ["edit", "convert-from-pdf"],
    icon: "ScanText",
    widget: "backend",
    runsInBrowser: false,
    config: { accept: ["pdf"], outputLabel: "Searchable PDF" },
    seo: {
      title: "OCR PDF Online — Make Scans Searchable | orzix",
      description:
        "Run optical character recognition on scanned PDFs to make them searchable, selectable and copyable.",
    },
  },
];

export const toolBySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool {
  const tool = toolBySlug.get(slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  return tool;
}

export const popularTools = tools.filter((tool) => tool.popular);

export function toolsInCategory(category: ToolCategory | "all"): Tool[] {
  if (category === "all") return tools;
  return tools.filter((tool) => tool.categories.includes(category));
}

export function searchTools(query: string, category: ToolCategory | "all" = "all"): Tool[] {
  const pool = toolsInCategory(category);
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  return pool.filter((tool) =>
    `${tool.name} ${tool.description} ${tool.lede} ${tool.slug}`.toLowerCase().includes(q),
  );
}
