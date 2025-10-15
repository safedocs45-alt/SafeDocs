from sentence_transformers import SentenceTransformer

m = SentenceTransformer("all-MiniLM-L6-v2")
print("SBERT OK:", m.get_sentence_embedding_dimension())
