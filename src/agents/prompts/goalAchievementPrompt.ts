export function goalAchievementPrompt(originalInstruction: string, contextPrompt: string, completedTasks: any[], failedTasks: any[]): string {
  return `
You are an AI agent that was given this instruction: "${originalInstruction}"

${contextPrompt}
Completed Tasks:
${completedTasks.map((task: any, index: number) => `${index + 1}. ${task.description}`).join('\n')}

${failedTasks.length > 0 ? `Failed Tasks:\n${failedTasks.map((task: any, index: number) => `${index + 1}. ${task.description}`).join('\\n')}` : ''}

Based on the original instruction and the completed tasks, has the goal been achieved?

Respond with a JSON object:
{
  "achieved": true/false,
  "reasoning": "explanation of why the goal is or is not achieved",
  "confidence": "high|medium|low"
}
`;
} 