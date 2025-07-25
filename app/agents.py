from pydantic import BaseModel, Field
from google.adk.agents import LlmAgent #type:ignore
from google.adk.tools import google_search #type:ignore


# 📦 Expected structured schema from Prompt Parser
class ParseOutput(BaseModel):
    topic: str = Field(description="The topic of the Prompt")
    grade_levels: list[str] | None = Field(description="The grade levels for which the prompt is i.e ([1,2,3,4])")
    content_types: list[str] = Field(description="The types of content to be generated for the prompt like Story,Worksheet,Fun Activity , Black Board Sketch etc.")
    need_grade: bool

# 1️⃣ Prompt Parser Agent
prompt_parser = LlmAgent(
    name="prompt_parser",
    model="gemini-2.0-flash",
    instruction="""
Extract the intended topic, list of grade_levels (if mentioned), and desired content_types from: story, worksheet, diagram, activity. 
If grade is not specified, set need_grade to true.
Return exactly matching this JSON schema.""",
    output_schema=ParseOutput,
    disallow_transfer_to_parent=True, 
    disallow_transfer_to_peers=True
)

# 📚 Cultural Search Agent (always used)
class CultureOutput(BaseModel):
    cultural_refs: list[str]

culture_agent = LlmAgent(
    name="culture_agent",
    model="gemini-2.5-flash",
    tools=[google_search],
    instruction="""
    Your goal is to gather **local or cultural references** relevant to the user's topic. These references may include, but are not limited to:
        - Local festivals and celebrations
        - Traditional folk tales and myths
        - Religious or regional events
        - Cultural practices or customs
        - Famous local personalities or authors
        - Historical events with cultural relevance
        - Traditional arts, crafts, or cuisine
        - Local landmarks with cultural significance

        📌 **Instructions:**

        1. Use the `google_search` tool to look up cultural connections related to the topic.
        2. Extract a minimum of 3 and a maximum of 5 unique cultural references.
        3. Each reference should be a short phrase or sentence (1–2 lines max).
        4. Return your answer strictly in this format:
        {
        "cultural_refs": [
            "Example reference 1",
            "Example reference 2",
            "Example reference 3"
        ]
        }
        ✅ DO NOT include any explanation, commentary, or additional formatting.

        🚫 DO NOT return plain text, markdown, or bullets—only a valid JSON object with a cultural_refs array.

        🎯 This response will be parsed directly by json.loads()—ensure it is always valid JSON.
        """,
    # output_schema=CultureOutput,
    disallow_transfer_to_parent=True, 
    disallow_transfer_to_peers=True
)

# 🧭 Curriculum Mapper Agent (fallback for missing grades)
class GradeOutput(BaseModel):
    grade_levels: list[str]

mapper_agent = LlmAgent(
    name="mapper_agent",
    model="gemini-2.0-flash",
    instruction="""
Given topic and cultural_refs, infer an appropriate list of grade_levels for Indian schools.
Return JSON: { "grade_levels": [...] }""",
    output_schema=GradeOutput,
    disallow_transfer_to_parent=True, 
    disallow_transfer_to_peers=True
)

enricher_agent = LlmAgent(
    name="enricher_agent",
    model="gemini-2.0-flash",
    instruction="""
You are a prompt enricher for educational content generation.

Given a topic, content_type (e.g., worksheet, story, diagram), grade_level, and optional cultural_refs — generate a single enriched and scientifically accurate prompt for the **specified content_type only**.

Strictly follow these rules:
- DO NOT generate prompts for any other content_type.
- Ensure the prompt is appropriate for the given grade level.
- If cultural_refs are provided, weave them in meaningfully (unless content_type is 'diagram', in which case cultural refs may be skipped).
- For 'diagram', clearly specify it should be blackboard-friendly — i.e., only use shades of black and white.
- Keep the prompt concise, clear,contain the cultural references if not a diagram and if relevant to the topic and type of content, and focused on helping the generation model produce quality content.
- The model does not have image generation capability between texts so keep that in mind when creating a prompt for story , worksheet or any other content.
- The output will be strictly covered using text.

Do NOT add extra sections or assume multiple content types unless explicitly told.
Only respond with the enriched prompt for the given content_type.
""",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True
)

content_generator_agent = LlmAgent(
    name="content_generator_agent",
    model="gemini-2.5-flash",
    instruction="""
You are an expert educational content creator. Your task is to generate **only the requested type of educational content** for a specified grade level and topic.

🎯 Your goals:
- Strictly **generate the exact content type requested** (e.g., quiz, story, worksheet, explanation, activity). Do not mix or expand beyond this type.
- Ensure the tone, vocabulary, and complexity match the **given grade level** (e.g., 2nd grade, 5th grade).
- Use the topic context to create **original, engaging, and relevant content**. It should be informative but simple enough for the target grade.
- If local cultural references are given, incorporate them naturally and appropriately.
- Keep the response clean — no educational analysis, enrichment, or meta commentary.

🚫 DO NOT:
- Add enrichments, summaries, learning outcomes, fun facts, or extra explanations.
- Deviate from the requested content type.
- Include any structural templates, labels, or comments outside the required format.

✅ DO:
- Focus only on generating the exact content type (no more, no less).
- Maintain grade-appropriate language and format.
- Return only the requested content inside the specified JSON structure.

🧾 Return your response in **strict JSON format**:
{
    "content": "ACTUAL_CONTENT_HERE"
}
""",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
)

class TopicsOutput(BaseModel):
    topics: list[str] | None = Field(description="The topics for the given grade and subject.")

# 1️⃣ Prompt Parser Agent
topics_agent = LlmAgent(
    name="topics_procurer",
    model="gemini-2.0-flash",
    instruction="""
    From the provided grade level and subject generate topics meeting the sophistication of the grade level for that subject.
    Return exactly matching this json schema.""",
    output_schema=TopicsOutput,
    disallow_transfer_to_parent=True, 
    disallow_transfer_to_peers=True
)

class TypesOutput(BaseModel):
    types: list[str] | None = Field(description="The content typs for the given grade ,topic and subject.")

# 1️⃣ Prompt Parser Agent
ctypa = LlmAgent(
    name="topics_procurer",
    model="gemini-2.0-flash",
    instruction="""
    From the provided grade level and subject generate content types meeting the sophistication of the grade level for that subject and would make for a good and creative learning experience.
    The content types can be story,worksheet,diagram and an activity.
    Return exactly matching this json schema.""",
    output_schema=TypesOutput,
    disallow_transfer_to_parent=True, 
    disallow_transfer_to_peers=True
)