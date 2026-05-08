import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from app.core.dependencies import get_vectorstore
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are a helpful assistant that answers questions based on the provided context.
If the answer is not in the context, say you don't know — don't make up information.

Context:
{context}"""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])


def _format_docs(docs) -> str:
    return "\n\n".join(doc.page_content for doc in docs)


class RAGChain:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash-lite",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1,
        )
        self.chain = prompt | self.llm | StrOutputParser()

    async def generate_response(self, query: str, history: list[dict], session_id: str):
        retriever = get_vectorstore(session_id).as_retriever()
        docs = await retriever.ainvoke(query)
        context = _format_docs(docs)

        sources = []
        for doc in docs:
            sources.append({
                "source": os.path.basename(doc.metadata.get("source", "Unknown")),
                "page": doc.metadata.get("page", 1)
            })

        chat_history = []
        for msg in history:
            if msg["role"] == "user":
                chat_history.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                chat_history.append(AIMessage(content=msg["content"]))

        full_response = ""
        async for chunk in self.chain.astream({
            "context": context,
            "chat_history": chat_history,
            "question": query,
        }):
            full_response += chunk
            yield chunk

        # Yield metadata as a structured JSON string at the end
        yield f"__METADATA__{json.dumps({'sources': sources})}"
