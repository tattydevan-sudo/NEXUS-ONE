 export async function onRequestPost({ request, env }) {
  try {
    if (!env.AI) {
      return Response.json(
        { error: "Workers AI binding 'AI' is missing." },
        { status: 503 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON request." },
        { status: 400 }
      );
    }

    const idea = String(body.idea || "").trim();
    const task = String(body.task || "business_plan").trim();

    if (idea.length < 5 || idea.length > 3000) {
      return Response.json(
        { error: "Enter an idea between 5 and 3000 characters." },
        { status: 400 }
      );
    }

    const tasks = {
      business_plan:
        "Create a practical business plan with an overview, target customers, services, marketing, estimated costs, risks, and next steps.",
      marketing:
        "Create a marketing plan with a promotional message, three social media post ideas, and a call to action.",
      budget:
        "Create a simple startup budget in Kenyan shillings. Label figures as estimates and explain assumptions.",
      action_plan:
        "Create a practical 30-day action plan with weekly goals and specific tasks."
    };

    if (!tasks[task]) {
      return Response.json(
        { error: "Unsupported task: " + task },
        { status: 400 }
      );
    }

    const result = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          {
            role: "system",
            content:
              "You are NEXUS ONE, a practical planning assistant. Give clear, useful advice for entrepreneurs and students. Adapt to the user's idea, explain assumptions, and never guarantee results."
          },
          {
            role: "user",
            content: tasks[task] + "\n\nUser's idea:\n" + idea
          }
        ],
        max_tokens: 1200
      }
    );

    const answer = result?.response || result?.output;

    if (!answer) {
      console.error("Workers AI returned no answer:", JSON.stringify(result));

      return Response.json(
        { error: "The AI service returned an empty answer." },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      answer
    });
  } catch (error) {
    console.error("NEXUS ONE AI error:", error?.stack || error);

    return Response.json(
      {
        error: "AI generation failed.",
        details: String(error?.message || error || "Unknown error")
      },
      { status: 500 }
    );
  }
 }
