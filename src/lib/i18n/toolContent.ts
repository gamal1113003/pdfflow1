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
