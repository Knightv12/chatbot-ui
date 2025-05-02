from langchain_core.messages import AIMessage
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

import PyPDF2
import os

VECTOR_STORE_NAME = "tutor_rag"
PERSIST_DIRECTORY = "./chroma_db"

def get_modelfile(model_file_path):
    if not os.path.exists(model_file_path):
        print(f"Input file '{model_file_path}' not found.")
        exit(1)

    # Read the model file
    with open(model_file_path, "r") as f:
        modelfile = f.read().strip()

    return modelfile

class UserInput:
    def __init__(self): 
        self.inp = input("Chat: ")
        self.command_flag = 1 if self.inp.startswith('/') else 0 

def append_entry(conversation, role, content):
    new_entry = {
        'role': role,
        'content': content,
    }
    conversation.append(new_entry)

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    if not os.path.exists(pdf_path):
        print(f"PDF file '{pdf_path}' not found.")
        exit(1)

    text = ""
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text()
    return text

def ingest_documents(doc_path):
    """Load and split PDF documents into chunks."""
    if not os.path.exists(doc_path):
        print(f"Document path '{doc_path}' not found.")
        exit(1)

    content = extract_text_from_pdf(doc_path)

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=300)
    chunks = text_splitter.split_text(content)
    return [Document(page_content=chunk) for chunk in chunks]

def create_vector_db(documents):
    """Create or load a vector database."""
    embedding = OllamaEmbeddings(model="nomic-embed-text")

    if os.path.exists(PERSIST_DIRECTORY):
        vector_db = Chroma(
            embedding_function=embedding,
            collection_name=VECTOR_STORE_NAME,
            persist_directory=PERSIST_DIRECTORY,
        )
        print("Loaded existing vector database.")
    else:
        vector_db = Chroma.from_documents(
            documents=documents,
            embedding=embedding,
            collection_name=VECTOR_STORE_NAME,
            persist_directory=PERSIST_DIRECTORY,
        )
        vector_db.persist()
        print("Vector database created and persisted.")
    return vector_db

def retrieve_documents(vector_db, query):
    """Retrieve relevant documents from the vector database."""
    retriever = vector_db.as_retriever()
    results = retriever.get_relevant_documents(query)
    return results

def main():
    model = "llama3.2"
    messages = []
    llm = ChatOllama(
        model=model,
        temperature=0.3
    )

    doc_path = "./temp.pdf" 
    documents = ingest_documents(doc_path)
    vector_db = create_vector_db(documents)

    while True:
        print()
        u_input = UserInput()
        print()

        if u_input.command_flag == 0:
            append_entry(messages, "user", u_input.inp)

            relevant_docs = retrieve_documents(vector_db, u_input.inp)
            print("\nRelevant Documents:")
            for doc in relevant_docs:
                print(doc.page_content)

            for doc in relevant_docs:
                append_entry(messages, "system", f"Relevant document: {doc.page_content}")

            stream = llm.stream(messages)
            full = next(stream)
            for chunk in stream:
                print(chunk.content, end="", flush=True)
                full += chunk

            append_entry(messages, "assistant", full.content)

        if u_input.command_flag == 1:
            if u_input.inp in ["/bye", "/Bye", "/BYE"]:
                break
    
if __name__ == "__main__":
    main()