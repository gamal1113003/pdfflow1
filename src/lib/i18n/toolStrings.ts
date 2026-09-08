import type { Language } from "@/lib/i18n/dictionaries";

/** Russian names and descriptions, keyed by tool slug. */
const ru: Record<string, { name: string; description: string; lede: string }> = {
  "compress-pdf": {
    name: "Сжать PDF",
    description: "Уменьшить размер файла без потери качества.",
    lede: "Уменьшите размер PDF, сохранив читаемость документа.",
  },
  "merge-pdf": {
    name: "Объединить PDF",
    description: "Собрать несколько файлов в один документ.",
    lede: "Объедините несколько PDF в один файл в нужном порядке.",
  },
  "split-pdf": {
    name: "Разделить PDF",
    description: "Разбить документ на отдельные файлы или диапазоны.",
    lede: "Извлеките страницы из PDF или разбейте документ на несколько файлов.",
  },
  "pdf-to-word": {
    name: "PDF в Word",
    description: "Преобразовать PDF в редактируемый документ Word.",
    lede: "Превратите PDF в редактируемый файл .docx.",
  },
  "pdf-to-excel": {
    name: "PDF в Excel",
    description: "Извлечь таблицы и данные в электронную таблицу.",
    lede: "Перенесите таблицы из PDF в Excel.",
  },
  "pdf-to-ppt": {
    name: "PDF в PowerPoint",
    description: "Превратить страницы PDF в редактируемые слайды.",
    lede: "Преобразуйте PDF обратно в презентацию.",
  },
  "word-to-pdf": {
    name: "Word в PDF",
    description: "Преобразовать документы Word в аккуратный PDF.",
    lede: "Сделайте из файла .docx PDF, который везде выглядит одинаково.",
  },
  "excel-to-pdf": {
    name: "Excel в PDF",
    description: "Превратить таблицы в PDF для отправки.",
    lede: "Преобразуйте книгу Excel в удобный для печати PDF.",
  },
  "ppt-to-pdf": {
    name: "PowerPoint в PDF",
    description: "Преобразовать презентации в PDF-документ.",
    lede: "Поделитесь презентацией в виде PDF, который откроется на любом устройстве.",
  },
  "jpg-to-pdf": {
    name: "JPG в PDF",
    description: "Создать PDF из изображений JPG.",
    lede: "Соберите фотографии и сканы в один PDF.",
  },
  "png-to-pdf": {
    name: "PNG в PDF",
    description: "Собрать PDF из изображений PNG.",
    lede: "Объедините скриншоты и графику PNG в один PDF.",
  },
  "pdf-to-jpg": {
    name: "PDF в JPG",
    description: "Преобразовать страницы PDF в изображения.",
    lede: "Сохраните каждую страницу PDF как отдельное изображение.",
  },
  "rotate-pdf": {
    name: "Повернуть PDF",
    description: "Повернуть отдельные страницы или весь документ.",
    lede: "Выровняйте перевёрнутые сканы — одну страницу или все сразу.",
  },
  "delete-pages": {
    name: "Удалить страницы",
    description: "Убрать ненужные страницы из PDF.",
    lede: "Выберите лишние страницы и удалите их.",
  },
  "extract-pages": {
    name: "Извлечь страницы",
    description: "Сохранить выбранные страницы как новый PDF.",
    lede: "Оставьте только нужные страницы и сохраните их отдельным файлом.",
  },
  "reorder-pages": {
    name: "Изменить порядок страниц",
    description: "Перетащить страницы в нужном порядке.",
    lede: "Расставьте страницы в правильном порядке перетаскиванием.",
  },
  "edit-pdf": {
    name: "Редактор страниц",
    description: "Порядок, поворот, копирование и удаление в одном месте.",
    lede: "Визуальный редактор страниц: поворот, порядок, дублирование и удаление.",
  },
  "annotate-pdf": {
    name: "Правка и заметки",
    description: "Добавить текст, рисунки, выделение и изображения.",
    lede: "Пишите поверх страницы: текст, рисунки, выделение, затемнение и изображения.",
  },
  "crop-pdf": {
    name: "Обрезать PDF",
    description: "Обрезать поля и оставить только нужное.",
    lede: "Выделите рамкой нужную область и оставьте только её.",
  },
  "watermark-pdf": {
    name: "Водяной знак",
    description: "Добавить текстовый водяной знак.",
    lede: "Поставьте на каждую страницу надпись, например «Черновик».",
  },
  "sign-pdf": {
    name: "Подписать PDF",
    description: "Добавить электронную подпись в документ.",
    lede: "Нарисуйте или введите подпись и разместите её на странице.",
  },
  "protect-pdf": {
    name: "Защитить PDF",
    description: "Установить пароль на документ.",
    lede: "Добавьте пароль, чтобы документ открыли только нужные люди.",
  },
  "unlock-pdf": {
    name: "Снять защиту",
    description: "Убрать пароль, если у вас есть на это право.",
    lede: "Снимите пароль с документа, который вам разрешено изменять.",
  },
  "translate-pdf": {
    name: "Перевести PDF",
    description: "Перевести текст документа на другой язык.",
    lede: "Прочитайте документ на другом языке. Переводится текст, оформление не копируется.",
  },
  "flatten-pdf": {
    name: "Свести PDF",
    description: "Убрать поля форм и аннотации, сохранив вид страницы.",
    lede: "Превратите заполненные формы и комментарии в неизменяемое содержимое страницы.",
  },
  "ocr-pdf": {
    name: "Распознать текст (OCR)",
    description: "Сделать сканы доступными для поиска.",
    lede: "Распознайте текст на скане, чтобы его можно было искать и копировать.",
  },
};

/**
 * Russian page titles and meta descriptions. These are what appear in search
 * results, so they matter more than the on-page text for ranking.
 */
const ruSeo: Record<string, { title: string; description: string }> = {
  "compress-pdf": {
    title: "Сжать PDF онлайн — уменьшить размер файла | orzix",
    description:
      "Уменьшите размер PDF-файла онлайн. Быстро, бесплатно и прямо в браузере — файл не загружается на сервер.",
  },
  "merge-pdf": {
    title: "Объединить PDF онлайн — соединить файлы в один | orzix",
    description:
      "Объедините несколько PDF в один документ. Перетащите файлы в нужном порядке и скачайте результат.",
  },
  "split-pdf": {
    title: "Разделить PDF онлайн — разбить на части | orzix",
    description:
      "Разделите PDF на отдельные файлы или извлеките нужные страницы. Работает прямо в браузере.",
  },
  "crop-pdf": {
    title: "Обрезать PDF онлайн — убрать поля | orzix",
    description:
      "Обрежьте поля PDF, выделив нужную область рамкой. Можно применить ко всем страницам сразу.",
  },
  "rotate-pdf": {
    title: "Повернуть PDF онлайн — исправить ориентацию | orzix",
    description:
      "Поверните страницы PDF на 90, 180 или 270 градусов и сохраните результат.",
  },
  "delete-pages": {
    title: "Удалить страницы из PDF онлайн | orzix",
    description: "Уберите лишние страницы из PDF-документа и скачайте новый файл.",
  },
  "extract-pages": {
    title: "Извлечь страницы из PDF онлайн | orzix",
    description: "Сохраните выбранные страницы PDF в отдельный документ.",
  },
  "reorder-pages": {
    title: "Изменить порядок страниц PDF онлайн | orzix",
    description: "Перетащите страницы PDF в нужном порядке и сохраните документ.",
  },
  "edit-pdf": {
    title: "Редактировать PDF онлайн — редактор страниц | orzix",
    description:
      "Поворот, порядок, дублирование и удаление страниц PDF в наглядном редакторе.",
  },
  "annotate-pdf": {
    title: "Добавить текст и заметки в PDF онлайн | orzix",
    description:
      "Пишите поверх PDF: текст, рисунки, выделение, затемнение и изображения. Поддерживается кириллица.",
  },
  "watermark-pdf": {
    title: "Водяной знак на PDF онлайн | orzix",
    description:
      "Добавьте текстовый водяной знак на каждую страницу PDF — размер, угол, цвет и прозрачность.",
  },
  "sign-pdf": {
    title: "Подписать PDF онлайн — электронная подпись | orzix",
    description:
      "Нарисуйте или введите подпись, разместите её на странице и скачайте подписанный PDF.",
  },
  "pdf-to-word": {
    title: "PDF в Word онлайн — конвертер PDF в DOCX | orzix",
    description: "Преобразуйте PDF в редактируемый документ Word с сохранением разметки.",
  },
  "pdf-to-excel": {
    title: "PDF в Excel онлайн — извлечь таблицы | orzix",
    description: "Перенесите таблицы из PDF в электронную таблицу Excel.",
  },
  "pdf-to-ppt": {
    title: "PDF в PowerPoint онлайн | orzix",
    description: "Преобразуйте PDF в презентацию PowerPoint — по слайду на страницу.",
  },
  "pdf-to-jpg": {
    title: "PDF в JPG онлайн — сохранить страницы как изображения | orzix",
    description: "Преобразуйте страницы PDF в изображения JPG высокого качества.",
  },
  "jpg-to-pdf": {
    title: "JPG в PDF онлайн — фото в документ | orzix",
    description: "Соберите фотографии и сканы JPG в один PDF-документ.",
  },
  "png-to-pdf": {
    title: "PNG в PDF онлайн | orzix",
    description: "Объедините изображения PNG в один PDF-файл.",
  },
  "word-to-pdf": {
    title: "Word в PDF онлайн — конвертер DOCX в PDF | orzix",
    description: "Преобразуйте документ Word в PDF с сохранением шрифтов и разметки.",
  },
  "excel-to-pdf": {
    title: "Excel в PDF онлайн | orzix",
    description: "Преобразуйте таблицу Excel в аккуратный PDF для печати и отправки.",
  },
  "ppt-to-pdf": {
    title: "PowerPoint в PDF онлайн | orzix",
    description: "Преобразуйте презентацию в PDF, который откроется на любом устройстве.",
  },
  "protect-pdf": {
    title: "Поставить пароль на PDF онлайн | orzix",
    description: "Защитите PDF паролем, чтобы документ открыли только нужные люди.",
  },
  "unlock-pdf": {
    title: "Снять пароль с PDF онлайн | orzix",
    description: "Уберите защиту с PDF-документа, который вам разрешено изменять.",
  },
  "ocr-pdf": {
    title: "OCR PDF онлайн — распознать текст на скане | orzix",
    description: "Распознайте текст на отсканированном PDF, чтобы его можно было искать и копировать.",
  },
  "flatten-pdf": {
    title: "Свести PDF онлайн — зафиксировать поля форм | orzix",
    description: "Превратите заполненные формы и аннотации в неизменяемое содержимое страницы.",
  },
  "translate-pdf": {
    title: "Перевести PDF онлайн — на русский и другие языки | orzix",
    description: "Переведите текст PDF-документа на другой язык и скачайте готовый файл.",
  },
};

export function translateToolSeo(
  language: Language,
  slug: string,
  fallback: { title: string; description: string },
) {
  if (language === "ru" && ruSeo[slug]) return ruSeo[slug];
  return fallback;
}

export function translateTool(
  language: Language,
  slug: string,
  fallback: { name: string; description: string; lede: string },
) {
  if (language === "ru" && ru[slug]) return ru[slug];
  return fallback;
}
