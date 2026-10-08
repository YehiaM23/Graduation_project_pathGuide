"""RAG module for loading company documents and retrieving relevant context."""

import os
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

DOCUMENTS_DIR = Path(__file__).parent / "documents"
CHROMA_DIR = Path(__file__).parent / "chroma_db"


def load_documents() -> list:
    """Load all documents from the documents directory."""
    docs = []
    for file_path in DOCUMENTS_DIR.iterdir():
        if file_path.suffix == ".pdf":
            loader = PyPDFLoader(str(file_path))
            docs.extend(loader.load())
        elif file_path.suffix in (".txt", ".md"):
            loader = TextLoader(str(file_path), encoding="utf-8")
            docs.extend(loader.load())
    return docs


def build_vector_store() -> Chroma:
    """Build or load the ChromaDB vector store from company documents."""
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    # If vector store already exists, load it
    if CHROMA_DIR.exists() and any(CHROMA_DIR.iterdir()):
        return Chroma(
            persist_directory=str(CHROMA_DIR),
            embedding_function=embeddings,
        )

    # Otherwise, build from documents
    docs = load_documents()
    if not docs:
        raise FileNotFoundError(
            f"No documents found in {DOCUMENTS_DIR}. "
            "Add .pdf, .txt, or .md files about your company."
        )

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
    )
    return vector_store


class CompanyRAG:
    """Simple RAG interface for retrieving company information."""

    def __init__(self):
        self.vector_store = build_vector_store()

    def retrieve(self, query: str, k: int = 5) -> str:
        """Retrieve relevant company information for a query."""
        results = self.vector_store.similarity_search(query, k=k)
        return "\n\n".join(doc.page_content for doc in results)

    def get_company_overview(self) -> str:
        """Get a general overview of the company."""
        return self.retrieve("company overview mission products culture values")
