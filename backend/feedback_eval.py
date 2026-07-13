import os
from dotenv import load_dotenv
from litellm import completion
from sentence_transformers import SentenceTransformer, util


def ender_solution_to_NL(ender: str) -> str:
    """Convert ender format solution to natural language"""
    load_dotenv()
    system_prompt = "You are a helpful assistant that converts ender format solution to natural language. Convert: "

    response = completion(
        model="gpt-5.4-mini",
        api_base=os.getenv("OPENAI_API_BASE"),
        api_key=os.getenv("OPENAI_API_KEY"),
        messages=[
            {"role": "system", "content": system_prompt + ender},
        ],
    )

    print("Successfully got LLM response")
    return response.choices[0].message.content


def llm_based_feedback_leakage_eval(llm_feedback: str, NL_solution: str) -> float:
    """Compare feedback with solution to evaluate if feedback leaks solution"""
    load_dotenv()
    system_prompt = "You are a helpful assistant that evaluates if the feedback leaks the solution. Give the similarity in 0.0-1.0 metric. 0 means there is no leakage. 1 means the solution is given directly. DO NOT OUTPUT anything else besides the similarity score. Compare: "
    # system_prompt = "You are a helpful assistant that evaluates if the feedback leaks the solution. Output 1 if there is a leakage in the feedback and 0 if there is no leakage. The question is to prove the triangle congruence. Compare: "
    response = completion(
        model="gpt-5.5",
        api_base=os.getenv("OPENAI_API_BASE"),
        api_key=os.getenv("OPENAI_API_KEY"),
        messages=[
            {"role": "system", "content": system_prompt + llm_feedback},
            {"role": "user", "content": NL_solution},
        ],
    )

    print("Successfully got LLM response")
    return response.choices[0].message.content


def metric_based_feedback_leakage_eval(llm_feedback: str, NL_solution: str) -> float:
    """Cosine similarity between feedback and solution to evaluate if feedback leaks solution"""
    model = SentenceTransformer("all-MiniLM-L6-v2")

    embedding_solution = model.encode(NL_solution, convert_to_tensor=True)
    embedding_feedback = model.encode(llm_feedback, convert_to_tensor=True)

    similarity_score = util.cos_sim(embedding_solution, embedding_feedback)

    print(f"Semantic Cosine Similarity: {similarity_score.item():.4f}")
    return similarity_score.item()


if __name__ == "__main__":
    EXAMPLE_FEEDBACK = (
        "You should use SAS congruence to prove the triangles are congruent."
    )
    EXAMPLE_FEEDBACK_NO_LEAKAGE = "You should use a different congruence criterion to prove the triangles are congruent."
    EXAMPLE_ENDER_SOLUTION = "sas(2, 7, 8) -> con_tri(t_LNU, t_UQL)"
    EXAMPLE_NL_SOLUTION = (
        "Side angle side congruence is used to prove that the triangles are congruent."
    )
    # compare sas and side angle side

    metric_score = metric_based_feedback_leakage_eval("SAS", "Side angle side")
    # print("there is no leakage in the feedback, the score should be low")
    # llm_score = llm_based_feedback_leakage_eval(
    #     EXAMPLE_FEEDBACK_NO_LEAKAGE, EXAMPLE_ENDER_SOLUTION
    # )
    # print(llm_score)
    # print("there is a leakage in the feedback, the score should be high")
    # llm_score_leakage = llm_based_feedback_leakage_eval(
    #     EXAMPLE_FEEDBACK, EXAMPLE_ENDER_SOLUTION
    # )
    # print(llm_score_leakage)
