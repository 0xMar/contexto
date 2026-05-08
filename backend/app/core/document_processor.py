import tempfile
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from app.core.dependencies import get_vectorstore


async def process_document(content: bytes, extension: str, filename: str, session_id: str) -> str:
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
            tmp.write(content)
            temp_path = tmp.name

        if extension.lower() == ".pdf":
            loader = PyPDFLoader(temp_path)
        elif extension.lower() == ".txt":
            loader = TextLoader(temp_path)
        else:
            raise ValueError(f"Unsupported file type: {extension}")

        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1024, chunk_overlap=204, length_function=len
        )
        splits = splitter.split_documents(documents)

        if not splits:
            raise ValueError("No content could be extracted from the document")

        get_vectorstore(session_id).add_documents(splits)
        return filename

    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except OSError:
                pass
