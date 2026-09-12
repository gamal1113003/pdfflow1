import type { Language } from "@/lib/i18n/dictionaries";

/**
 * Long-form copy for tool pages.
 *
 * A page that is only a title and an upload box gives a search engine almost
 * nothing to rank. This is where the substance lives: what the tool does, how
 * to use it, and the questions people actually ask.
 *
 * Not every tool needs an entry. Pages without one simply render without this
 * section.
 */

export type ToolContent = {
  /** Two or three paragraphs introducing the tool. */
  intro: string[];
  steps?: { title: string; body: string }[];
  stepsHeading?: string;
  faq?: { q: string; a: string }[];
  faqHeading?: string;
};

const en: Record<string, ToolContent> = {
  "scan-to-pdf": {
    intro: [
      "A phone camera is a better scanner than most scanners, for one reason: it is already in your hand. The problem has never been the sensor — it is that a photograph of a page is taken at an angle, lit unevenly, and comes out as a grey trapezium rather than a white rectangle.",
      "Both of those are fixable. Dragging the four corners onto the page tells this tool exactly where the paper is, and it computes the transform that makes those four points into a rectangle again. The lighting is handled by comparing each pixel to the area around it rather than to a single fixed threshold, which is how a shaded page still comes out white.",
      "All of it happens on your device. The photographs are never uploaded, which matters more here than for most tools — people scan passports, contracts and medical letters.",
    ],
    stepsHeading: "How to scan a document with your phone",
    steps: [
      {
        title: "Photograph the page",
        body: "Use the camera button, or add pictures you have already taken. Lay the page flat, get the whole sheet in frame, and avoid a shadow falling across it — that is the one thing no amount of processing fully fixes.",
      },
      {
        title: "Drag the corners onto the paper",
        body: "Four handles, one per corner of the page. The preview beside them updates as you move, so you can see the page straightening out.",
      },
      {
        title: "Choose how it should look",
        body: "Scan gives black text on white paper, like a photocopier. Grey keeps shading, which suits pencil. Colour brightens the image but keeps stamps and coloured ink.",
      },
      {
        title: "Add more pages, then download",
        body: "Each photograph becomes a page. They are combined into a single PDF in the order shown.",
      },
    ],
    faqHeading: "Questions about scanning with a camera",
    faq: [
      {
        q: "Why are the corners not found automatically?",
        a: "Automatic detection looks for the edges of the paper, and it fails on a patterned desk, a page with a dark photograph on it, or a white sheet on a white table. A wrong crop that silently cuts off a signature is worse than dragging four handles, so it asks.",
      },
      {
        q: "Can I search the text afterwards?",
        a: "Not yet — a scan is a picture of words. Run the result through OCR PDF and it gains a text layer, after which it can be searched and copied.",
      },
      {
        q: "Which setting should I use?",
        a: "Scan for ordinary printed documents: it makes the smallest files and the most legible pages. Colour when stamps, signatures in blue ink or highlighting matter. Grey for pencil or faint print.",
      },
      {
        q: "Is this as good as a real scanner?",
        a: "For text documents, close enough that the difference rarely matters. A flatbed scanner is still better for photographs, fragile originals and anything where colour accuracy counts.",
      },
      {
        q: "Does the camera work on a computer?",
        a: "Yes, if it has one, and a switch appears when there is more than one camera. A phone is usually easier because you can hold it over the page.",
      },
    ],
  },
  "ocr-pdf": {
    intro: [
      "A scanned document contains no text. It looks like a page of writing, but what is stored is a picture of one — which is why searching finds nothing, copying gives nothing, and pasting it into a translator does nothing.",
      "Optical character recognition reads the shapes in the image and works out which letters they are. The result keeps the page looking exactly as it did, with the recognised text placed invisibly behind the image. You see the scan; your computer sees words.",
      "Choose the language of the document before you start. This matters more than it sounds: recognition works by matching shapes against the letters it expects, so English settings applied to a Russian page produce confident nonsense rather than an error.",
    ],
    stepsHeading: "How to make a scanned PDF searchable",
    steps: [
      {
        title: "Upload the scan",
        body: "Any PDF whose pages are images. If the text is already selectable, there is nothing to recognise and the document needs no work.",
      },
      {
        title: "Choose the language",
        body: "Pick the language the document is written in. Where a page mixes two, choose the combination.",
      },
      {
        title: "Wait, and download",
        body: "Recognition takes a few seconds per page. The result is the same document with a text layer added.",
      },
    ],
    faqHeading: "Questions about OCR",
    faq: [
      {
        q: "Will the pages look different afterwards?",
        a: "No. The image is kept exactly as it was and the text sits behind it. Anyone opening the file sees what they saw before — but can now search and copy.",
      },
      {
        q: "How accurate is it?",
        a: "On a clean, straight scan of printed text, very. On a photograph taken at an angle, in poor light, or of handwriting, considerably less. Straightening the page first with Scan with Camera makes a real difference.",
      },
      {
        q: "Why did it produce nonsense?",
        a: "Almost always the wrong language. Recognition matches shapes against expected letters, so Latin settings on a Cyrillic page produce plausible-looking rubbish rather than failing outright.",
      },
      {
        q: "Does the file get bigger?",
        a: "Slightly. The text layer itself is small, but the pages are re-encoded in the process. A large increase usually means the original was a very compressed scan.",
      },
      {
        q: "Can it read handwriting?",
        a: "Rarely well. The models are trained on printed type. Neat block capitals sometimes work; ordinary handwriting usually does not.",
      },
    ],
  },
  "compress-image": {
    intro: [
      "Photographs from a modern phone are around four thousand pixels across and several megabytes each. That is right for printing and wrong for almost everything else: email attachments bounce, web pages crawl, and a messaging app silently degrades them anyway.",
      "There are two separate ways to make an image smaller, and mixing them up is why people end up disappointed. Reducing the dimensions throws away pixels nobody was going to see — a photograph shown at 800 pixels wide does not benefit from being 4000. Lowering the quality keeps the dimensions and stores the detail less precisely.",
      "For most purposes the first is the one that matters. Resizing a photograph from 4000 to 1920 pixels typically removes three quarters of the file with no visible difference at all, because it was never being displayed at that size.",
    ],
    stepsHeading: "How to make an image smaller",
    steps: [
      {
        title: "Add your images",
        body: "As many as you like. They are processed one after another, entirely on your device.",
      },
      {
        title: "Choose a size",
        body: "1920 pixels suits a full screen, 1200 a web page, 800 an email. Choose by where the image is going, not by how small you want the file — the size follows.",
      },
      {
        title: "Choose a quality",
        body: "Good is a sensible default and is hard to distinguish from the original. Lower settings become visible on close inspection, particularly around text and sharp edges.",
      },
      {
        title: "Download",
        body: "One image downloads directly; several arrive as a ZIP. The saving is shown before you commit.",
      },
    ],
    faqHeading: "Questions about compressing images",
    faq: [
      {
        q: "Which format should I choose?",
        a: "JPG for photographs. PNG for screenshots, diagrams and anything with text or transparency — it is lossless, so quality settings do nothing. WEBP is smaller than both at the same visible quality, and every current browser supports it.",
      },
      {
        q: "Why did my PNG barely shrink?",
        a: "PNG stores every pixel exactly, so quality has no effect on it. The only way to make one smaller is to reduce its dimensions, or convert it to JPG or WEBP.",
      },
      {
        q: "Is quality lost permanently?",
        a: "Yes. Compression discards information and there is no way back — which is why the original should be kept. Compress a copy.",
      },
      {
        q: "Are my photographs uploaded?",
        a: "No. Everything happens in the browser, and the images are discarded when the page is closed.",
      },
      {
        q: "What happens to transparency?",
        a: "Converting to JPG removes it, and the transparent areas become white rather than black — which is what a careless conversion produces. Keep PNG or WEBP if transparency matters.",
      },
    ],
  },
  "qr-code": {
    intro: [
      "A QR code is a link that works without typing. Printed on an invoice it takes someone to the payment page; on a menu, to the menu; on a form, to wherever the form should be sent.",
      "The type of code matters more than it appears. Scanners recognise particular prefixes and offer to act on them — dial the number, compose the message, join the network. A bare web address with no https:// in front is read as plain text and does nothing at all, which is the most common reason a code seems to scan but achieves nothing.",
      "Error correction is the other setting worth understanding. A QR code stores each piece of information several times over, so a damaged or partly covered code still reads. Higher correction survives more damage at the cost of a denser pattern.",
    ],
    stepsHeading: "How to make a QR code",
    steps: [
      {
        title: "Choose what it should contain",
        body: "A website, plain text, an email address, a phone number, a message, or the details of a Wi-Fi network.",
      },
      {
        title: "Fill in the details",
        body: "The code appears as you type, and the exact contents are shown beneath it so you can see what a scanner will read.",
      },
      {
        title: "Adjust the appearance",
        body: "Error correction and colour. Keep a strong contrast — a pale code on a white background defeats most scanners.",
      },
      {
        title: "Download",
        body: "PNG for screens, SVG for print since it stays sharp at any size, or a PDF page with a caption for putting on a wall.",
      },
    ],
    faqHeading: "Questions about QR codes",
    faq: [
      {
        q: "How long do these codes last?",
        a: "Indefinitely — a QR code is not a service, it is a pattern that encodes your text. Nothing here has to keep running for it to work, and there is no tracking or redirect involved.",
      },
      {
        q: "Which error correction should I choose?",
        a: "Medium for anything shown on a screen or printed cleanly. High or Highest if the code will be on something that gets handled, printed small, or has a logo placed over the middle of it.",
      },
      {
        q: "Can I put a logo in the middle?",
        a: "Yes, using an image editor afterwards, provided you choose Highest error correction and cover no more than about a quarter of the code. Test it with a real phone before printing anything.",
      },
      {
        q: "Why does nothing happen when I scan my code?",
        a: "Usually a web address without https:// in front. Without a scheme the code contains plain text rather than a link, so the scanner shows the words and offers nothing to tap. This tool adds it for you.",
      },
      {
        q: "Is a Wi-Fi code safe to print?",
        a: "Anyone who can see it can join the network. It is ideal for a card handed to guests, and a poor idea on a window facing the street.",
      },
    ],
  },
  "split-pdf": {
    intro: [
      "Splitting is what you need when a document contains more than you want to send. A 200-page report where the recipient only needs chapter four, or a scanned bundle where each contract should become its own file.",
      "There are three ways to do it here, and they suit different situations. Extracting selected pages puts everything you pick into one new document. Splitting every page produces one file per page, delivered as a ZIP. Splitting by ranges gives you one file per range, so 1-3, 4-8 becomes two documents.",
      "Page thumbnails are rendered so you can see what you are selecting rather than guessing at page numbers.",
    ],
    stepsHeading: "How to split a PDF",
    steps: [
      { title: "Upload the document", body: "Drag it onto the page. Thumbnails appear as each page is rendered, which takes a moment for long documents." },
      { title: "Choose how to split", body: "Pick pages visually, split every page, or type ranges such as 1-3, 4-8." },
      { title: "Download", body: "A single result downloads as a PDF; several results are packaged into a ZIP." },
    ],
    faqHeading: "Questions about splitting PDFs",
    faq: [
      { q: "Can I extract just one page?", a: "Yes. Select that page and it becomes a single-page PDF." },
      { q: "What happens to the original?", a: "Nothing. It stays on your device untouched; splitting produces new files." },
      { q: "Why do several files come as a ZIP?", a: "Browsers cannot start many downloads at once reliably, so multiple results are packaged into one archive." },
      { q: "Is there a page limit?", a: "No fixed limit, though rendering thumbnails for a very long document takes time and memory." },
    ],
  },
  "pdf-to-word": {
    intro: [
      "Converting a PDF into an editable Word document is the most requested PDF task and the hardest to do well. A PDF stores glyph positions, not paragraphs — the file knows where each character sits, but not that a run of them forms a sentence.",
      "Reconstructing the document means inferring paragraphs, columns, tables and headings from geometry. Good converters get most of it right on clean, text-based documents. Nothing gets it right every time.",
      "This conversion runs on a server, because the layout analysis needs more than a browser tab can do. Your file is processed and deleted immediately afterwards.",
    ],
    stepsHeading: "How to convert PDF to Word",
    steps: [
      { title: "Upload your PDF", body: "Text-based PDFs convert best. A scanned document needs OCR first, since there is no text to recover." },
      { title: "Wait for processing", body: "Conversion takes a few seconds for short documents and longer for complex layouts." },
      { title: "Download the .docx", body: "Open it in Word or any compatible editor and check the result before relying on it." },
    ],
    faqHeading: "Questions about PDF to Word",
    faq: [
      { q: "Will the layout be identical?", a: "Rarely. Simple documents convert closely; multi-column layouts, complex tables and unusual fonts shift. Always check the result." },
      { q: "Why did my scanned PDF produce an empty document?", a: "A scan contains images of text, not text. Run OCR on it first, then convert." },
      { q: "Is my document stored?", a: "No. It is written to a temporary directory, converted, returned to you and deleted — including if the conversion fails." },
      { q: "Can I convert back afterwards?", a: "Word to PDF is a separate tool and works reliably, since going that direction is a rendering job rather than a reconstruction." },
    ],
  },
  "pdf-to-jpg": {
    intro: [
      "Turning PDF pages into images is useful when something needs to go somewhere a PDF cannot: a slide, a web page, a message, or a printer that mishandles the original.",
      "Each page is rendered and saved as a separate JPG. You choose the resolution, from screen size up to print quality, and the result downloads as individual images or a ZIP.",
      "Rendering happens in your browser using PDF.js, so the document never leaves your device.",
    ],
    stepsHeading: "How to convert PDF to JPG",
    steps: [
      { title: "Upload the PDF", body: "Any PDF works. Long documents take longer, since every page is rendered individually." },
      { title: "Choose a resolution", body: "Screen for web use, Print when the images will be printed. Higher settings produce larger files." },
      { title: "Download", body: "One page downloads as a single image; several pages are packaged as a ZIP." },
    ],
    faqHeading: "Questions about PDF to JPG",
    faq: [
      { q: "Which resolution should I choose?", a: "Standard at 144 dpi suits most uses. Choose Print at 288 dpi only when the image will be printed, since files get large quickly." },
      { q: "Can I convert only some pages?", a: "This tool exports every page. To convert a few, extract them first with Split PDF, then convert the result." },
      { q: "Why are the images large?", a: "JPG stores every pixel, while a PDF often stores text as instructions. A text page becomes a much larger file as an image." },
      { q: "Can I get PNG instead?", a: "Not from this tool. PNG suits screenshots and graphics; for scanned or photographic pages JPG is smaller at the same visible quality." },
    ],
  },
  "merge-pdf": {
    intro: [
      "Combining files is the most common thing anyone needs to do with a PDF. A contract arrives in three parts, a scanner produces one file per page, or a report needs its appendix attached before it goes out.",
      "This tool joins any number of PDFs into a single document, in whatever order you choose. The work happens inside your browser using pdf-lib, so the files never travel across the internet — you can disconnect your network after the page loads and it still works.",
      "You can also merge Word documents, spreadsheets, presentations and images alongside PDFs. Those are converted first, then combined with the rest.",
    ],
    stepsHeading: "How to merge PDF files",
    steps: [
      {
        title: "Add your files",
        body: "Drag them onto the page or use the Choose PDFs button. There is no limit on how many you add, though very large documents are bounded by your device's memory.",
      },
      {
        title: "Put them in order",
        body: "Drag a file to move it, or use the arrow buttons. The first page of each file is shown as a thumbnail so you can tell them apart at a glance.",
      },
      {
        title: "Merge and download",
        body: "Press Merge PDFs. The combined document is built in the page and handed straight to you as a download.",
      },
    ],
    faqHeading: "Questions about merging PDFs",
    faq: [
      {
        q: "How many files can I merge at once?",
        a: "There is no fixed limit. Because the work happens on your own device, the practical ceiling is available memory — a laptop handles far more than a phone.",
      },
      {
        q: "Are my files uploaded to a server?",
        a: "No. Merging runs entirely in your browser. Open the Network tab in your browser's developer tools while you merge and you will see no upload.",
      },
      {
        q: "Does merging reduce quality?",
        a: "No. The pages are copied across as they are, with their text, images and fonts intact. Nothing is re-compressed.",
      },
      {
        q: "Can I merge a Word file with a PDF?",
        a: "Yes. Word, Excel, PowerPoint files and images are converted to PDF first, then merged with the rest. Office conversion happens on a server; everything else stays local.",
      },
    ],
  },
  "compress-pdf": {
    intro: [
      "PDFs grow large for one reason more than any other: photographs and scans stored at far higher resolution than anyone will ever look at. A ten-page scanned contract can easily reach 40 MB, which most email systems will refuse.",
      "This tool offers two genuinely different approaches, and the right one depends on what the document is for.",
      "Basic compression rewrites the file structure and strips metadata. It is lossless — the text stays selectable and searchable — but the saving is modest, often 5 to 20 percent. Strong and Extreme redraw every page as an image at lower quality, which shrinks scans dramatically but removes the text layer.",
    ],
    stepsHeading: "How to compress a PDF",
    steps: [
      {
        title: "Upload your document",
        body: "Drag the file onto the page. The file size and page count are shown once it loads.",
      },
      {
        title: "Choose how hard to compress",
        body: "Start with Basic if the document contains text you need to search or copy. Choose Strong or Extreme for scans and photographs where you only need to read the page.",
      },
      {
        title: "Compress and compare",
        body: "The result shows the original size, the new size and the percentage saved, so you can decide whether to try a different setting before downloading.",
      },
    ],
    faqHeading: "Questions about compressing PDFs",
    faq: [
      {
        q: "Will compression damage my document?",
        a: "Basic compression changes nothing you can see — it removes redundancy in how the file is stored. Strong and Extreme do reduce image quality and turn pages into pictures, so text can no longer be selected. The tool tells you which happened.",
      },
      {
        q: "Why did my file barely get smaller?",
        a: "Some PDFs are already well optimised, particularly those exported from modern software. If Basic compression finds nothing to remove, the result says so rather than pretending otherwise.",
      },
      {
        q: "Which setting should I use for a scan?",
        a: "Strong is usually the right balance for scanned documents. Extreme is worth trying when the file must fit a strict size limit and legibility is all that matters.",
      },
      {
        q: "Is my file uploaded anywhere?",
        a: "No. Compression runs entirely in your browser, and the document is discarded the moment you close or reload the page.",
      },
    ],
  },
};

const ru: Record<string, ToolContent> = {
  "scan-to-pdf": {
    intro: [
      "Камера телефона — сканер лучше большинства сканеров по одной причине: она уже у вас в руке. Проблема никогда не была в матрице. Проблема в том, что снимок страницы сделан под углом, освещён неравномерно и получается серой трапецией, а не белым прямоугольником.",
      "И то и другое исправимо. Перетащив четыре угла на страницу, вы точно указываете, где лежит бумага, а инструмент вычисляет преобразование, которое снова превращает эти четыре точки в прямоугольник. С освещением справляется сравнение каждой точки с областью вокруг неё, а не с одним фиксированным порогом — именно поэтому затенённая страница всё равно выходит белой.",
      "Всё выполняется на вашем устройстве. Снимки никуда не отправляются, и здесь это важнее, чем в большинстве инструментов: люди сканируют паспорта, договоры и медицинские заключения.",
    ],
    stepsHeading: "Как отсканировать документ телефоном",
    steps: [
      {
        title: "Сфотографируйте страницу",
        body: "Нажмите кнопку камеры или добавьте готовые снимки. Положите страницу ровно, поместите весь лист в кадр и следите, чтобы на него не падала тень — это единственное, что обработка не исправляет полностью.",
      },
      {
        title: "Перетащите углы на бумагу",
        body: "Четыре маркера, по одному на угол страницы. Предпросмотр рядом обновляется при перемещении, поэтому видно, как страница выпрямляется.",
      },
      {
        title: "Выберите вид",
        body: "«Скан» даёт чёрный текст на белой бумаге, как копир. «Серый» сохраняет полутона и подходит для карандаша. «Цвет» осветляет изображение, но сохраняет печати и цветные чернила.",
      },
      {
        title: "Добавьте страницы и скачайте",
        body: "Каждый снимок становится страницей. Они собираются в один PDF в показанном порядке.",
      },
    ],
    faqHeading: "Вопросы о сканировании камерой",
    faq: [
      {
        q: "Почему углы не находятся автоматически?",
        a: "Автоматическое определение ищет края бумаги и не справляется с узорчатым столом, страницей с тёмной фотографией или белым листом на белой столешнице. Неверная обрезка, молча отрезавшая подпись, хуже, чем четыре маркера, — поэтому инструмент спрашивает.",
      },
      {
        q: "Можно ли будет искать по тексту?",
        a: "Пока нет: скан — это изображение слов. Пропустите результат через «OCR PDF», и в документе появится текстовый слой, после чего по нему можно искать и копировать.",
      },
      {
        q: "Какой режим выбрать?",
        a: "«Скан» для обычных печатных документов: самые маленькие файлы и самые читаемые страницы. «Цвет» — когда важны печати, синие подписи или выделение маркером. «Серый» — для карандаша и слабой печати.",
      },
      {
        q: "Это так же хорошо, как настоящий сканер?",
        a: "Для текстовых документов разница почти не имеет значения. Планшетный сканер по-прежнему лучше для фотографий, ветхих оригиналов и всего, где важна точность цвета.",
      },
      {
        q: "Работает ли камера на компьютере?",
        a: "Да, если она есть, а при наличии нескольких камер появляется переключатель. Телефоном обычно удобнее: его можно держать над страницей.",
      },
    ],
  },
  "ocr-pdf": {
    intro: [
      "В отсканированном документе нет текста. Он выглядит как страница с текстом, но хранится в нём изображение страницы — поэтому поиск ничего не находит, копирование ничего не даёт, а вставка в переводчик не срабатывает.",
      "Оптическое распознавание читает формы на изображении и определяет, какие это буквы. Страница при этом выглядит точно так же, а распознанный текст размещается невидимым слоем под изображением. Вы видите скан, компьютер видит слова.",
      "Перед началом выберите язык документа. Это важнее, чем кажется: распознавание работает, сопоставляя формы с ожидаемыми буквами, поэтому английские настройки на русской странице дают уверенную бессмыслицу, а не ошибку.",
    ],
    stepsHeading: "Как сделать отсканированный PDF доступным для поиска",
    steps: [
      {
        title: "Загрузите скан",
        body: "Любой PDF, страницы которого являются изображениями. Если текст уже выделяется, распознавать нечего и документ в обработке не нуждается.",
      },
      {
        title: "Выберите язык",
        body: "Укажите язык документа. Если на странице два языка, выберите их сочетание.",
      },
      {
        title: "Дождитесь и скачайте",
        body: "Распознавание занимает несколько секунд на страницу. Результат — тот же документ с добавленным текстовым слоем.",
      },
    ],
    faqHeading: "Вопросы о распознавании текста",
    faq: [
      {
        q: "Изменится ли вид страниц?",
        a: "Нет. Изображение сохраняется без изменений, а текст располагается под ним. Открывший файл увидит то же, что и раньше, — но сможет искать и копировать.",
      },
      {
        q: "Насколько это точно?",
        a: "На чистом ровном скане печатного текста — очень точно. На снимке под углом, при плохом свете или от руки — заметно хуже. Предварительное выравнивание страницы инструментом «Сканировать камерой» даёт реальную разницу.",
      },
      {
        q: "Почему получилась бессмыслица?",
        a: "Почти всегда из-за неверного языка. Распознавание сопоставляет формы с ожидаемыми буквами, поэтому латинские настройки на кириллической странице дают правдоподобный мусор, а не явную ошибку.",
      },
      {
        q: "Файл станет больше?",
        a: "Немного. Сам текстовый слой невелик, но страницы при обработке перекодируются. Сильное увеличение обычно означает, что исходник был очень сжатым сканом.",
      },
      {
        q: "Распознаёт ли он рукописный текст?",
        a: "Редко хорошо. Модели обучены на печатном шрифте. Аккуратные печатные буквы иногда получаются, обычный почерк — как правило, нет.",
      },
    ],
  },
  "compress-image": {
    intro: [
      "Снимки современного телефона — около четырёх тысяч точек по ширине и несколько мегабайт каждый. Для печати это правильно, для всего остального — нет: вложения в письмах не проходят, страницы грузятся медленно, а мессенджеры всё равно молча ухудшают качество.",
      "Есть два разных способа уменьшить изображение, и их путаница — причина разочарований. Уменьшение размеров выбрасывает точки, которых никто и не увидел бы: фотографии, показываемой шириной 800 точек, незачем быть шириной 4000. Снижение качества сохраняет размеры и хранит детали менее точно.",
      "В большинстве случаев важен первый способ. Уменьшение фотографии с 4000 до 1920 точек обычно убирает три четверти файла вообще без видимой разницы, потому что в таком размере её всё равно не показывали.",
    ],
    stepsHeading: "Как уменьшить изображение",
    steps: [
      {
        title: "Добавьте изображения",
        body: "Сколько угодно. Они обрабатываются по очереди, полностью на вашем устройстве.",
      },
      {
        title: "Выберите размер",
        body: "1920 точек подходит для полного экрана, 1200 — для веб-страницы, 800 — для письма. Выбирайте по тому, куда пойдёт изображение, а не по желаемому размеру файла: он получится сам.",
      },
      {
        title: "Выберите качество",
        body: "«Хорошее» — разумный вариант по умолчанию, его трудно отличить от оригинала. Более низкие настройки заметны при внимательном рассмотрении, особенно около текста и резких границ.",
      },
      {
        title: "Скачайте",
        body: "Одно изображение скачивается напрямую, несколько — архивом. Экономия показывается до скачивания.",
      },
    ],
    faqHeading: "Вопросы о сжатии изображений",
    faq: [
      {
        q: "Какой формат выбрать?",
        a: "JPG — для фотографий. PNG — для скриншотов, схем и всего с текстом или прозрачностью: он работает без потерь, поэтому настройка качества на него не влияет. WEBP меньше обоих при том же видимом качестве, и его поддерживают все современные браузеры.",
      },
      {
        q: "Почему PNG почти не уменьшился?",
        a: "PNG хранит каждую точку в точности, поэтому качество на него не действует. Уменьшить такой файл можно только уменьшив размеры или преобразовав его в JPG либо WEBP.",
      },
      {
        q: "Качество теряется безвозвратно?",
        a: "Да. Сжатие отбрасывает информацию, и вернуть её нельзя — поэтому оригинал стоит сохранить. Сжимайте копию.",
      },
      {
        q: "Загружаются ли мои фотографии куда-нибудь?",
        a: "Нет. Всё происходит в браузере, а изображения исчезают при закрытии страницы.",
      },
      {
        q: "Что происходит с прозрачностью?",
        a: "Преобразование в JPG её убирает, и прозрачные области становятся белыми, а не чёрными — как бывает при небрежной конвертации. Если прозрачность важна, оставьте PNG или WEBP.",
      },
    ],
  },
  "qr-code": {
    intro: [
      "QR-код — это ссылка, которая работает без набора текста. Напечатанный на счёте, он ведёт на страницу оплаты, в кафе — на меню, на бланке — туда, куда бланк нужно отправить.",
      "Тип кода важнее, чем кажется. Сканеры распознают определённые префиксы и предлагают действие: позвонить, написать сообщение, подключиться к сети. Обычный адрес сайта без https:// впереди читается как простой текст и не делает ничего — это самая частая причина, по которой код вроде бы считывается, но ничего не происходит.",
      "Вторая настройка, которую стоит понимать, — коррекция ошибок. QR-код хранит каждую часть информации несколько раз, поэтому повреждённый или частично закрытый код всё равно читается. Более высокая коррекция выдерживает большие повреждения за счёт более плотного рисунка.",
    ],
    stepsHeading: "Как создать QR-код",
    steps: [
      {
        title: "Выберите содержимое",
        body: "Сайт, обычный текст, адрес почты, телефон, сообщение или данные сети Wi-Fi.",
      },
      {
        title: "Заполните данные",
        body: "Код появляется по мере ввода, а под ним показано точное содержимое — видно, что именно прочитает сканер.",
      },
      {
        title: "Настройте вид",
        body: "Коррекция ошибок и цвет. Сохраняйте сильный контраст: бледный код на белом фоне не читается большинством сканеров.",
      },
      {
        title: "Скачайте",
        body: "PNG для экрана, SVG для печати (остаётся резким в любом размере) или PDF-страницу с подписью, чтобы повесить на стену.",
      },
    ],
    faqHeading: "Вопросы о QR-кодах",
    faq: [
      {
        q: "Сколько такие коды действуют?",
        a: "Неограниченно: QR-код — не сервис, а рисунок, кодирующий ваш текст. Ничего не должно продолжать работать, чтобы он читался, и никакого отслеживания или перенаправления здесь нет.",
      },
      {
        q: "Какую коррекцию ошибок выбрать?",
        a: "«Среднюю» для всего, что показывается на экране или печатается аккуратно. «Высокую» или «Максимальную», если код будет на предмете, который берут в руки, напечатан мелко или закрыт логотипом в середине.",
      },
      {
        q: "Можно ли поместить логотип в центр?",
        a: "Да, отдельным редактором, при условии максимальной коррекции ошибок и закрытия не более четверти кода. Обязательно проверьте настоящим телефоном перед печатью.",
      },
      {
        q: "Почему при сканировании ничего не происходит?",
        a: "Обычно из-за адреса сайта без https:// впереди. Без схемы код содержит простой текст, а не ссылку, поэтому сканер показывает слова и не предлагает перейти. Этот инструмент добавляет схему сам.",
      },
      {
        q: "Безопасно ли печатать код Wi-Fi?",
        a: "Любой, кто его видит, может подключиться к сети. Это удобно для карточки, которую дают гостям, и плохая идея для окна, выходящего на улицу.",
      },
    ],
  },
  "split-pdf": {
    intro: [
      "Разделение нужно, когда в документе больше, чем требуется отправить. Отчёт на 200 страниц, из которого адресату нужна только четвёртая глава, или пачка сканов, где каждый договор должен стать отдельным файлом.",
      "Здесь три способа, и они подходят для разных задач. Извлечение выбранных страниц собирает всё отмеченное в один новый документ. Разделение по страницам создаёт отдельный файл для каждой страницы и отдаёт их архивом. Разделение по диапазонам даёт по файлу на диапазон: 1-3, 4-8 превращаются в два документа.",
      "Миниатюры страниц отображаются сразу, поэтому видно, что именно вы выбираете, и не нужно угадывать номера.",
    ],
    stepsHeading: "Как разделить PDF",
    steps: [
      { title: "Загрузите документ", body: "Перетащите файл на страницу. Миниатюры появляются по мере отрисовки — для длинных документов это занимает время." },
      { title: "Выберите способ", body: "Отметьте страницы визуально, разделите по одной или введите диапазоны вида 1-3, 4-8." },
      { title: "Скачайте результат", body: "Один файл скачивается как PDF, несколько — упаковываются в ZIP-архив." },
    ],
    faqHeading: "Вопросы о разделении PDF",
    faq: [
      { q: "Можно ли извлечь одну страницу?", a: "Да. Отметьте нужную страницу — получится PDF из одной страницы." },
      { q: "Что происходит с исходным файлом?", a: "Ничего. Он остаётся на вашем устройстве без изменений, а разделение создаёт новые файлы." },
      { q: "Почему несколько файлов приходят архивом?", a: "Браузеры плохо справляются с несколькими одновременными загрузками, поэтому результаты упаковываются в один архив." },
      { q: "Есть ли ограничение по количеству страниц?", a: "Жёсткого ограничения нет, но отрисовка миниатюр очень длинного документа требует времени и памяти." },
    ],
  },
  "pdf-to-word": {
    intro: [
      "Преобразование PDF в редактируемый документ Word — самая востребованная и самая сложная задача. PDF хранит положение символов, а не абзацы: файл знает, где стоит каждая буква, но не знает, что вместе они образуют предложение.",
      "Восстановление документа означает, что абзацы, колонки, таблицы и заголовки приходится выводить из геометрии. Хорошие конвертеры справляются с чистыми текстовыми документами. Идеально не справляется ни один.",
      "Это преобразование выполняется на сервере, потому что анализ разметки выходит за пределы возможностей браузера. Ваш файл обрабатывается и сразу удаляется.",
    ],
    stepsHeading: "Как преобразовать PDF в Word",
    steps: [
      { title: "Загрузите PDF", body: "Лучше всего конвертируются текстовые PDF. Скан требует предварительного распознавания — восстанавливать там нечего." },
      { title: "Дождитесь обработки", body: "Короткие документы обрабатываются за несколько секунд, сложная вёрстка — дольше." },
      { title: "Скачайте .docx", body: "Откройте файл в Word или совместимом редакторе и проверьте результат, прежде чем на него полагаться." },
    ],
    faqHeading: "Вопросы о преобразовании PDF в Word",
    faq: [
      { q: "Будет ли разметка такой же?", a: "Редко. Простые документы получаются близкими к оригиналу; многоколоночная вёрстка, сложные таблицы и необычные шрифты смещаются. Результат стоит проверять." },
      { q: "Почему из скана получился пустой документ?", a: "Скан содержит изображение текста, а не текст. Сначала распознайте его с помощью OCR, затем конвертируйте." },
      { q: "Хранится ли мой документ?", a: "Нет. Он записывается во временную папку, преобразуется, возвращается вам и удаляется — в том числе при ошибке." },
      { q: "Можно ли преобразовать обратно?", a: "Word в PDF — отдельный инструмент, и он работает надёжно: в эту сторону это отрисовка, а не восстановление структуры." },
    ],
  },
  "pdf-to-jpg": {
    intro: [
      "Преобразование страниц PDF в изображения нужно, когда документ должен попасть туда, куда PDF не помещается: в презентацию, на веб-страницу, в сообщение или в принтер, который неправильно печатает оригинал.",
      "Каждая страница отрисовывается и сохраняется отдельным файлом JPG. Разрешение выбираете вы — от экранного до печатного, — а результат скачивается отдельными изображениями или архивом.",
      "Отрисовка выполняется в браузере с помощью PDF.js, поэтому документ не покидает ваше устройство.",
    ],
    stepsHeading: "Как преобразовать PDF в JPG",
    steps: [
      { title: "Загрузите PDF", body: "Подойдёт любой файл. Длинные документы обрабатываются дольше, так как каждая страница отрисовывается отдельно." },
      { title: "Выберите разрешение", body: "«Экран» — для веба, «Печать» — если изображения пойдут на печать. Чем выше настройка, тем больше файлы." },
      { title: "Скачайте", body: "Одна страница скачивается изображением, несколько — архивом ZIP." },
    ],
    faqHeading: "Вопросы о преобразовании PDF в JPG",
    faq: [
      { q: "Какое разрешение выбрать?", a: "«Стандартное» (144 dpi) подходит для большинства задач. «Печать» (288 dpi) стоит выбирать только для печати — файлы быстро становятся большими." },
      { q: "Можно ли преобразовать только часть страниц?", a: "Этот инструмент экспортирует все страницы. Чтобы взять несколько, сначала извлеките их через «Разделить PDF», затем преобразуйте результат." },
      { q: "Почему изображения такие большие?", a: "JPG хранит каждый пиксель, тогда как PDF часто хранит текст в виде инструкций. Текстовая страница в виде картинки весит заметно больше." },
      { q: "Можно ли получить PNG?", a: "В этом инструменте — нет. PNG подходит для скриншотов и графики, а для сканов и фотографий JPG меньше при том же видимом качестве." },
    ],
  },
  "merge-pdf": {
    intro: [
      "Объединение файлов — самая частая задача, которая возникает с PDF. Договор приходит в трёх частях, сканер сохраняет каждую страницу отдельным файлом, к отчёту нужно приложить приложение перед отправкой.",
      "Этот инструмент соединяет любое количество PDF-файлов в один документ в том порядке, который вы зададите. Вся работа выполняется прямо в браузере с помощью pdf-lib, поэтому файлы никуда не передаются — можно отключить интернет после загрузки страницы, и объединение всё равно сработает.",
      "Вместе с PDF можно объединять документы Word, таблицы Excel, презентации и изображения. Они сначала преобразуются в PDF, а затем соединяются с остальными файлами.",
    ],
    stepsHeading: "Как объединить PDF-файлы",
    steps: [
      {
        title: "Добавьте файлы",
        body: "Перетащите их на страницу или нажмите «Выбрать PDF». Количество файлов не ограничено, но очень большие документы зависят от объёма памяти устройства.",
      },
      {
        title: "Расставьте в нужном порядке",
        body: "Перетащите файл мышью или используйте стрелки. Первая страница каждого файла показана миниатюрой, чтобы их было легко различать.",
      },
      {
        title: "Объедините и скачайте",
        body: "Нажмите «Объединить PDF». Готовый документ собирается прямо на странице и сразу предлагается к скачиванию.",
      },
    ],
    faqHeading: "Вопросы об объединении PDF",
    faq: [
      {
        q: "Сколько файлов можно объединить за раз?",
        a: "Жёсткого ограничения нет. Поскольку обработка идёт на вашем устройстве, предел определяется доступной памятью: на компьютере он заметно выше, чем на телефоне.",
      },
      {
        q: "Загружаются ли файлы на сервер?",
        a: "Нет. Объединение полностью выполняется в браузере. Откройте вкладку «Сеть» в инструментах разработчика во время объединения — никакой загрузки не будет.",
      },
      {
        q: "Ухудшается ли качество при объединении?",
        a: "Нет. Страницы переносятся как есть, вместе с текстом, изображениями и шрифтами. Ничего не пережимается заново.",
      },
      {
        q: "Можно ли объединить файл Word с PDF?",
        a: "Да. Файлы Word, Excel, PowerPoint и изображения сначала преобразуются в PDF, а затем объединяются с остальными. Преобразование офисных форматов выполняется на сервере, остальное — локально.",
      },
    ],
  },
  "compress-pdf": {
    intro: [
      "Чаще всего PDF-файлы становятся большими по одной причине: фотографии и сканы сохраняются в разрешении гораздо выше того, которое кто-либо будет рассматривать. Отсканированный договор на десять страниц легко достигает 40 МБ, а такие вложения не пропускает большинство почтовых систем.",
      "В этом инструменте есть два по-настоящему разных подхода, и выбор зависит от того, для чего нужен документ.",
      "Базовое сжатие переписывает структуру файла и удаляет метаданные. Оно происходит без потерь — текст остаётся выделяемым и доступным для поиска, — но выигрыш скромный, обычно от 5 до 20 процентов. «Сильное» и «Максимальное» перерисовывают каждую страницу как изображение с меньшим качеством: сканы уменьшаются значительно, но текстовый слой исчезает.",
    ],
    stepsHeading: "Как сжать PDF",
    steps: [
      {
        title: "Загрузите документ",
        body: "Перетащите файл на страницу. После загрузки будут показаны размер файла и количество страниц.",
      },
      {
        title: "Выберите степень сжатия",
        body: "Начните с «Базового», если в документе есть текст, который нужно искать или копировать. Выбирайте «Сильное» или «Максимальное» для сканов и фотографий, которые нужно только прочитать.",
      },
      {
        title: "Сожмите и сравните",
        body: "В результате показываются исходный размер, новый размер и процент экономии — можно попробовать другой вариант до скачивания.",
      },
    ],
    faqHeading: "Вопросы о сжатии PDF",
    faq: [
      {
        q: "Испортится ли документ после сжатия?",
        a: "Базовое сжатие не меняет ничего из того, что видно: оно убирает избыточность в способе хранения файла. «Сильное» и «Максимальное» действительно снижают качество изображений и превращают страницы в картинки, поэтому текст перестаёт выделяться. Инструмент сообщает, что именно произошло.",
      },
      {
        q: "Почему файл почти не уменьшился?",
        a: "Некоторые PDF уже хорошо оптимизированы, особенно созданные в современных программах. Если базовому сжатию нечего убрать, результат честно об этом сообщает.",
      },
      {
        q: "Какой режим выбрать для скана?",
        a: "Для отсканированных документов обычно подходит «Сильное». «Максимальное» имеет смысл, когда нужно уложиться в жёсткое ограничение по размеру, а важна только читаемость.",
      },
      {
        q: "Загружается ли файл куда-нибудь?",
        a: "Нет. Сжатие полностью выполняется в браузере, и документ исчезает, как только вы закрываете или перезагружаете страницу.",
      },
    ],
  },
};

export function toolContent(language: Language, slug: string): ToolContent | null {
  const set = language === "ru" ? ru : en;
  return set[slug] ?? null;
}
