import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()

_embeddings: "TaskPrefixEmbeddings | None" = None
_vectorstores: dict[str, Chroma] = {}


class TaskPrefixEmbeddings(GoogleGenerativeAIEmbeddings):
    """
    Wrapper for gemini-embedding-2-preview.
    This model requires task instructions as text prefixes instead of task_type param.
    """

    def embed_documents(self, texts: list[str], **kwargs) -> list[list[float]]:
        prefixed = [f"task: search result | query: {t}" for t in texts]
        return super().embed_documents(prefixed, **kwargs)

    def embed_query(self, text: str, **kwargs) -> list[float]:
        return super().embed_query(f"task: question answering | query: {text}", **kwargs)


def get_embeddings() -> TaskPrefixEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = TaskPrefixEmbeddings(
            model="models/gemini-embedding-2-preview",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )
    return _embeddings


def get_vectorstore(session_id: str) -> Chroma:
    if session_id not in _vectorstores:
        os.makedirs("./data/chroma_db", exist_ok=True)
        _vectorstores[session_id] = Chroma(
            collection_name=session_id,
            persist_directory="./data/chroma_db",
            embedding_function=get_embeddings(),
        )
    return _vectorstores[session_id]
