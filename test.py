
from dotenv import load_dotenv
load_dotenv()
import os
import asyncio
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

async def main():
    app_name, user_id, session_id = "key-test", "test-user", "test-session"
    agent = LlmAgent(
        name="key_test",
        model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
        instruction="Reply with exactly: Agent works.",
    )
    sessions = InMemorySessionService()
    await sessions.create_session(
        app_name=app_name, user_id=user_id, session_id=session_id
    )
    runner = Runner(agent=agent, app_name=app_name, session_service=sessions)
    message = types.Content(
        role="user", parts=[types.Part(text="Run the test.")]
    )
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=message
    ):
        if event.is_final_response() and event.content:
            print("\n".join(p.text for p in event.content.parts if p.text))

asyncio.run(main())
