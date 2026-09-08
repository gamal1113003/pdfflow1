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
