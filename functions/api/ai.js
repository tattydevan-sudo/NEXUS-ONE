 export async function onRequestPost({ request, env }) {
  try {
    if (!env.AI) {
      return Response.json(
        { success: false, error: "Workers AI binding is missing." },
        { status: 503 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: "Invalid request data." },
        { status: 400 }
      );
    }

    const idea = String(body.idea || "").trim();
    const task = String(body.task || "business_plan").trim();

    if (idea.length < 5 || idea.length > 3000) {
      return Response.json(
        { success: false, error: "Please enter an idea between 5 and 3000 characters." },
        { status: 400 }
      );
    }

    const tasks = {
      business_plan:
        "Create a practical project plan with an overview, target users, key features or services, promotion, estimated costs, risks, and next steps.",
      marketing:
        "Create a marketing plan with a short promotional message, three social media post ideas, and a call to action.",
      budget:
        "Create a simple estimated budget in Kenyan shillings (KSh). Explain assumptions and label all figures as estimates.",
      action_plan:
        "Create a practical 30-day action plan with weekly goals and specific tasks."
    };

    if (!tasks[task]) {
      return Response.json(
        { success: false, error: "Unsupported planning task." },
        { status: 400 }
      );
    }

    const result = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct-fp8",
      {
        messages: [
          {
            role: "system",
            content:
              "You are NEXUS ONE, a helpful planning assistant. Give practical, clear, realistic advice. Adapt to the user's idea and explain assumptions. Never guarantee results."
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

    if (typeof answer !== "string" || !answer.trim()) {
      console.error("Workers AI returned no usable answer.");
      return Response.json(
        { success: false, error: "The AI service returned an empty answer." },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      answer: answer.trim()
    });
  } catch (error) {
    console.error("NEXUS ONE AI error:", error?.stack || error);

    return Response.json(
      {
        success: false,
        error: "AI generation failed.",
        details: String(error?.message || "Unknown server error")
      },
      { status: 500 }
    );
  }
           }
