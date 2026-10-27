export async function onRequestPost({ request, env }) {
  try {
    if (!env.AI) {
      return Response.json(
        { error: "AI service is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
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
        "Create a practical business plan with an overview, customers, products or services, marketing, costs, risks, and next steps.",
      marketing:
        "Create marketing content with a promotional message, three social media post ideas, and a call to action.",
      budget:
        "Create a simple startup budget in Kenyan shillings (KSh). Label all figures as estimates and explain assumptions.",
      action_plan:
        "Create a practical 30-day action plan with weekly goals and specific tasks."
    };

    if (!tasks[task]) {
      return Response.json(
        { error: "Choose a supported planning task." },
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
              "You are NEXUS ONE, a helpful business planning assistant. Give practical, clear advice for entrepreneurs, including people starting with very little money. Clearly label estimates and never guarantee business results."
          },
          {
            role: "user",
            content: `${tasks[task]}\n\nUser's idea:\n${idea}`
          }
        ],
        max_tokens: 1200
      }
    );

    return Response.json({
      success: true,
      answer: result.response || result.output || "No answer was returned."
    });
  } catch (error) {
    return Response.json(
      { error: "The AI request failed. Please try again later." },
      { status: 500 }
    );
  }
        }
