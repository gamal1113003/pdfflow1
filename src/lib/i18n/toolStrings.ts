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
  "ocr-pdf": {
    name: "Распознать текст (OCR)",
    description: "Сделать сканы доступными для поиска.",
    lede: "Распознайте текст на скане, чтобы его можно было искать и копировать.",
  },
};

export function translateTool(
  language: Language,
  slug: string,
  fallback: { name: string; description: string; lede: string },
) {
  if (language === "ru" && ru[slug]) return ru[slug];
  return fallback;
}
