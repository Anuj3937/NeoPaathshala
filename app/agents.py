# agents.py
from pydantic import BaseModel, Field
# from google import genai
from google.adk.agents import LlmAgent #type:ignore
from google.adk.tools import google_search #type:ignore

# 🔧 Configure Gemini
# client = genai.Client()

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
    # response_mime_type="application/json",
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
    # response_mime_type="application/json",
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
    # response_mime_type="application/json",
    output_schema=GradeOutput,
    disallow_transfer_to_parent=True, 
    disallow_transfer_to_peers=True
)

enricher_agent = LlmAgent(
    name="enricher_agent",
    model="gemini-2.0-flash",
    instruction="""
Given topic and cultural_refs and grade level, and type of content.Build an enriches and accurate prompt to build scientifaccy and factually accurate educational content.""",
    # response_mime_type="application/json",
    disallow_transfer_to_parent=True, 
    disallow_transfer_to_peers=True
)

content_generator_agent = LlmAgent(
    name="content_generator_agent",
    model="gemini-2.0-flash",
    instruction="""
You are a highly skilled educational content generator. Your job is to create engaging, curriculum-aligned material for a given grade level and content type based on the provided topic context.

Follow this structure:
- Understand the grade level (e.g., 2nd grade, 5th grade).
- Identify the content type (worksheet, quiz, explanation, activity, story, etc.)
- Incorporate topic-specific details and local cultural references if provided.
- Output content that is age-appropriate, accurate, and creative.

Return your response in this strict JSON format:
{
  "content": "<Generated content string here>"
}
""",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
)