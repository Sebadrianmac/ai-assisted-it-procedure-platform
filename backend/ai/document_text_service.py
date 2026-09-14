from pathlib import Path

from docx import Document as WordDocument
from pypdf import PdfReader


def extract_document_text(document):
    if not document.file:
        return ""

    file_extension = Path(document.file.name).suffix.lower()

    if file_extension == ".pdf":
        return extract_pdf_text(document.file)

    if file_extension == ".docx":
        return extract_word_text(document.file)

    return ""


def extract_pdf_text(document_file):
    pages_text = []

    with document_file.open("rb") as pdf_file:
        reader = PdfReader(pdf_file)

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text and page_text.strip():
                pages_text.append(page_text.strip())

    return "\n\n".join(pages_text)


def extract_word_text(document_file):
    paragraphs = []

    with document_file.open("rb") as word_file:
        word_document = WordDocument(word_file)

        for paragraph in word_document.paragraphs:
            paragraph_text = paragraph.text.strip()

            if paragraph_text:
                paragraphs.append(paragraph_text)

    return "\n\n".join(paragraphs)