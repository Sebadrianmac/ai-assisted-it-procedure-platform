from ai.search_service import semantic_search
from ai.services import generate_ai_text


def generate_rag_answer(question, limit=5):
    question = question.strip()

    if not question:
        raise ValueError("Question cannot be empty.")

    search_results = list(
        semantic_search(
            query=question,
            limit=limit,
        )
    )

    if not search_results:
        raise ValueError(
            "No relevant information was found."
        )

    context_parts = []
    sources = []

    for source_number, item in enumerate(
        search_results,
        start=1,
    ):
        context_parts.append(
            (
                f"[Source {source_number}]\n"
                f"Document: {item.document.title}\n"
                f"Content:\n{item.content}"
            )
        )

        sources.append(
            {
                "document_id": item.document.id,
                "title": item.document.title,
                "chunk_number": item.chunk_number,
                "distance": round(
                    float(item.distance),
                    4,
                ),
                "similarity": round(
                    1 - float(item.distance),
                    4,
                ),
            }
        )

    context = "\n\n".join(context_parts)

    prompt = f"""
Use the provided company documents to answer the request.

Rules:
- Use only information supported by the provided sources.
- Do not invent policies, requirements, or facts.
- If the sources do not contain enough information, clearly say so.
- Create clear and practical IT procedure steps.
- Recommend a responsible role for every step.
- Reference supporting sources as [Source 1], [Source 2], and so on.
- Answer in English.

User request:
{question}

Sources:
{context}
""".strip()

    answer = generate_ai_text(prompt)

    return {
        "answer": answer,
        "sources": sources,
    }